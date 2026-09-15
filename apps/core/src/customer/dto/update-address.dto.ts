import { PartialType } from '@nestjs/swagger';
import { CustomerAddressDto } from './customer-address.dto';

export class UpdateAddressDto extends PartialType(CustomerAddressDto) {}
