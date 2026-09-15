import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsMobilePhone, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerAddressDto } from './customer-address.dto';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ajay Venkatesh' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: '8778176646' })
  @IsMobilePhone('en-IN')
  mobile: string;

  @ApiPropertyOptional({ example: 'ajay@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: CustomerAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  address?: CustomerAddressDto;
}
