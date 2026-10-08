import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRoles } from '../admin/decorators/roles.decorator';
import { AdminRole } from '@libs/contracts/admin/admin.schema';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/roles.guard';
import { AdminBackupService } from './admin-backup.service';

@ApiTags('admin-backups')
@ApiBearerAuth()
@Controller('admin/backups')
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.ADMIN)
export class AdminBackupController {
  constructor(private readonly backupService: AdminBackupService) {}

  @Post('mongodb')
  createMongoBackup() {
    return this.backupService.createMongoBackup();
  }
}
