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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@libs/contracts/admin/admin.schema';
import { AdminRoles } from '../admin/decorators/roles.decorator';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/roles.guard';
import { AdminOfferService } from './admin-offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferListQueryDto } from './dto/offer-list-query.dto';

@ApiTags('admin-offers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.ADMIN)
@Controller('admin/offers')
export class AdminOfferController {
  constructor(private readonly service: AdminOfferService) {}
  @Post() @ApiOperation({ summary: 'Create a seasonal offer' }) create(
    @Body() dto: CreateOfferDto,
  ) {
    return this.service.create(dto);
  }
  @Get() @ApiOperation({ summary: 'List seasonal offers' }) findAll(
    @Query() query: OfferListQueryDto,
  ) {
    return this.service.findAll(query);
  }
  @Get(':id') @ApiOperation({ summary: 'Get an offer' }) findOne(
    @Param('id') id: string,
  ) {
    return this.service.findOne(id);
  }
  @Patch(':id') @ApiOperation({ summary: 'Update an offer' }) update(
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.service.update(id, dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete an offer' }) remove(
    @Param('id') id: string,
  ) {
    return this.service.remove(id);
  }
}
