import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminRole } from '@libs/contracts/admin/admin.schema';
import { AdminRoles } from '../admin/decorators/roles.decorator';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/roles.guard';
import { AdminSettingsService } from './admin-settings.service';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';

@ApiTags('admin-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.ADMIN)
@Controller('admin/settings/store')
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get store profile and receipt settings' })
  @ApiOkResponse({ description: 'Store settings fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid admin token' })
  get() {
    return this.settingsService.get();
  }

  @Patch()
  @ApiOperation({ summary: 'Update store profile and receipt settings' })
  @ApiOkResponse({ description: 'Store settings updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or empty store settings' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid admin token' })
  update(@Body() dto: UpdateStoreSettingsDto) {
    return this.settingsService.update(dto);
  }
}
