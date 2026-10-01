import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';

export type UploadedImageFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class FileHelperService {
  private readonly s3 = new S3Client({ region: process.env.AWS_REGION });
  private readonly maxBytes = 5 * 1024 * 1024;
  private readonly mimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  private storage() {
    const value = process.env.FILE_STORAGE || 'local';
    if (value !== 'local' && value !== 's3')
      throw new Error('Invalid FILE_STORAGE value');
    return value;
  }

  private validate(file: UploadedImageFile) {
    if (!file?.buffer) throw new BadRequestException('Image file is required');
    if (!this.mimeTypes.has(file.mimetype))
      throw new BadRequestException(
        'Only JPG, PNG, and WEBP images are supported',
      );
    if (file.size > this.maxBytes)
      throw new BadRequestException('Image file must not exceed 5 MB');
  }

  private safeName(value: string) {
    return value.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  async upload(file: UploadedImageFile, folder: string) {
    this.validate(file);
    const key = `${folder}/${Date.now()}-${this.safeName(file.originalname)}`;
    if (this.storage() === 'local') {
      const relative = path.join('uploads', key);
      await fs.mkdir(path.dirname(relative), { recursive: true });
      await fs.writeFile(relative, file.buffer);
      return key;
    }
    if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_REGION)
      throw new Error(
        'AWS_S3_BUCKET_NAME and AWS_REGION are required for S3 storage',
      );
    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return key;
  }

  async uploadMany(files: UploadedImageFile[], folder: string) {
    if (!files?.length)
      throw new BadRequestException('At least one image file is required');
    return Promise.all(files.map((file) => this.upload(file, folder)));
  }

  async delete(key?: string) {
    if (!key || key.startsWith('http')) return;
    if (this.storage() === 'local') {
      await fs.rm(path.join('uploads', key), { force: true });
      return;
    }
    if (process.env.AWS_S3_BUCKET_NAME)
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
        }),
      );
  }

  async url(key?: string) {
    if (!key) return '';
    if (key.startsWith('http')) return key;
    if (this.storage() === 'local')
      return `${process.env.APP_BASE_URL || 'http://localhost:3018'}/uploads/${key}`;
    if (process.env.AWS_S3_PUBLIC === 'true')
      return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: 3600 },
    );
  }

  async urls(keys: string[] = []) {
    return Promise.all(keys.map((key) => this.url(key)));
  }
}
