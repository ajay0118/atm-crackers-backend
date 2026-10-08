import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import * as createReadStream from 'node:fs';
import * as path from 'node:path';

const execFileAsync = promisify(execFile);

@Injectable()
export class AdminBackupService {
  private readonly logger = new Logger(AdminBackupService.name);
  private readonly s3: S3Client;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION'),
    });
  }

  @Cron('0 0 * * *', {
    name: 'daily-mongodb-backup',
    timeZone: 'Asia/Kolkata',
  })
  async runDailyBackup() {
    if (this.config.get<string>('BACKUP_ENABLED') !== 'true') return;

    try {
      await this.createMongoBackup();
      this.logger.log('Daily MongoDB backup completed');
    } catch (error) {
      this.logger.error(
        `Daily MongoDB backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async createMongoBackup() {
    const uri = this.config.get<string>('MONGODB_URI');
    if (!uri) throw new InternalServerErrorException('MONGODB_URI is not configured');

    const backupRoot = path.resolve(
      this.config.get<string>('BACKUP_LOCAL_DIR') || 'backups/mongodb',
    );
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpDir = path.join(backupRoot, `dump-${timestamp}`);
    const archivePath = path.join(
      backupRoot,
      `atm-crackers-mongodb-${timestamp}.tar.gz`,
    );

    await fs.mkdir(backupRoot, { recursive: true });

    try {
      await execFileAsync('mongodump', [
        `--uri=${uri}`,
        `--out=${dumpDir}`,
        '--gzip',
      ]);

      await execFileAsync('tar', [
        '-czf',
        archivePath,
        '-C',
        backupRoot,
        path.basename(dumpDir),
      ]);

      const stat = await fs.stat(archivePath);
      const storage = this.config.get<string>('BACKUP_STORAGE', 'local');

      if (storage === 's3') {
        const bucket = this.config.get<string>('AWS_S3_BUCKET_NAME');
        if (!bucket) {
          throw new InternalServerErrorException(
            'AWS_S3_BUCKET_NAME is required when BACKUP_STORAGE=s3',
          );
        }

        const prefix = this.config.get<string>(
          'BACKUP_S3_PREFIX',
          'backups/mongodb/production',
        ).replace(/^\/+|\/+$/g, '');
        const key = `${prefix}/${path.basename(archivePath)}`;

        await this.s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: createReadStream.createReadStream(archivePath),
            ContentType: 'application/gzip',
            ServerSideEncryption: 'AES256',
          }),
        );

        await this.deleteExpiredS3Backups(bucket, prefix);
        await fs.rm(archivePath, { force: true });

        return {
          message: 'MongoDB backup uploaded to S3 successfully',
          data: { fileName: path.basename(archivePath), s3Key: key, sizeBytes: stat.size },
        };
      }

      if (storage !== 'local') {
        throw new InternalServerErrorException(
          'BACKUP_STORAGE must be either local or s3',
        );
      }

      return {
        message: 'MongoDB local backup created successfully',
        data: {
          fileName: path.basename(archivePath),
          filePath: archivePath,
          sizeBytes: stat.size,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `MongoDB backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      await fs.rm(dumpDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async deleteExpiredS3Backups(bucket: string, prefix: string) {
    const retentionDays = Number(
      this.config.get<string>('BACKUP_RETENTION_DAYS', '30'),
    );
    if (!Number.isFinite(retentionDays) || retentionDays < 1) return;

    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const listed = await this.s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: `${prefix}/` }),
    );
    const expired = (listed.Contents || [])
      .filter((object) => object.Key && object.LastModified && object.LastModified.getTime() < cutoff)
      .map((object) => ({ Key: object.Key! }));

    if (expired.length > 0) {
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: expired, Quiet: true },
        }),
      );
    }
  }
}
