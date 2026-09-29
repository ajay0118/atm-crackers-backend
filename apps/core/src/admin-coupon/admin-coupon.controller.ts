import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminRole } from '@libs/contracts/admin/admin.schema';
import { AdminRoles } from '../admin/decorators/roles.decorator';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/roles.guard';
import { AdminCouponService } from './admin-coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponListQueryDto } from './dto/coupon-list-query.dto';
@ApiTags('admin-coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.ADMIN)
@Controller('admin/coupons')
export class AdminCouponController {
  constructor(private readonly service: AdminCouponService) {}
  @Post()
  @ApiOperation({ summary: 'Create coupon' })
  @ApiCreatedResponse({ description: 'Coupon created successfully' })
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  @ApiUnauthorizedResponse()
  create(@Body() dto: CreateCouponDto) {
    return this.service.create(dto);
  }
  @Get() @ApiOperation({ summary: 'List coupons' }) @ApiOkResponse() findAll(
    @Query() query: CouponListQueryDto,
  ) {
    return this.service.findAll(query);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get coupon' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update coupon' })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.service.update(id, dto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete unused coupon' })
  @ApiOkResponse()
  @ApiConflictResponse()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
