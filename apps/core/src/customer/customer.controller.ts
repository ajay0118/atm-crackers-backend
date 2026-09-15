import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerAddressDto } from './dto/customer-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update a customer using mobile number' })
  create(@Body() dto: CreateCustomerDto) { return this.customerService.createOrUpdate(dto); }

  @Get(':mobile')
  @ApiOperation({ summary: 'Get a customer by mobile number' })
  @ApiParam({ name: 'mobile', example: '8778176646' })
  get(@Param('mobile') mobile: string) { return this.customerService.getByMobile(mobile); }

  @Patch(':mobile')
  @ApiOperation({ summary: 'Update customer details' })
  update(@Param('mobile') mobile: string, @Body() dto: UpdateCustomerDto) { return this.customerService.updateByMobile(mobile, dto); }

  @Post(':mobile/addresses')
  @ApiOperation({ summary: 'Add an address to a customer' })
  addAddress(@Param('mobile') mobile: string, @Body() dto: CustomerAddressDto) { return this.customerService.addAddress(mobile, dto); }

  @Patch(':mobile/addresses/:addressId')
  @ApiOperation({ summary: 'Update a customer address' })
  updateAddress(@Param('mobile') mobile: string, @Param('addressId') addressId: string, @Body() dto: UpdateAddressDto) { return this.customerService.updateAddress(mobile, addressId, dto); }

  @Delete(':mobile/addresses/:addressId')
  @ApiOperation({ summary: 'Remove a customer address' })
  removeAddress(@Param('mobile') mobile: string, @Param('addressId') addressId: string) { return this.customerService.removeAddress(mobile, addressId); }
}
