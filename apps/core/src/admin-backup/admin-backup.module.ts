import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminBackupController } from './admin-backup.controller';
import { AdminBackupService } from './admin-backup.service';

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  controllers: [AdminBackupController],
  providers: [AdminBackupService],
})
export class AdminBackupModule {}
