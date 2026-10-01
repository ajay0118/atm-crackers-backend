import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRole } from '@libs/contracts/admin/admin.schema';
import { AdminRoles } from '../admin/decorators/roles.decorator';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/roles.guard';
import { AdminPosService } from './admin-pos.service';
import { PosBillDto, PosListQueryDto } from './dto/pos.dto';

@ApiTags('admin-pos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.ADMIN)
@Controller('admin/pos')
export class AdminPosController {
  constructor(private readonly service: AdminPosService) {}
  @Get('products')
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  products(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.products(search, categoryId);
  }
  @Post('bills/preview') preview(@Body() dto: PosBillDto) {
    return this.service.preview(dto);
  }
  @Post('bills') create(
    @Body() dto: PosBillDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.service.create(dto, req.user.sub);
  }
  @Get('bills') findAll(@Query() query: PosListQueryDto) {
    return this.service.findAll(query);
  }
  @Get('bills/:billNumber/receipt') receipt(
    @Param('billNumber') billNumber: string,
  ) {
    return this.service.receipt(billNumber);
  }
  @Get('bills/:billNumber') findOne(@Param('billNumber') billNumber: string) {
    return this.service.findOne(billNumber);
  }
  @Patch('bills/:billNumber/cancel') cancel(
    @Param('billNumber') billNumber: string,
  ) {
    return this.service.cancel(billNumber);
  }
}
