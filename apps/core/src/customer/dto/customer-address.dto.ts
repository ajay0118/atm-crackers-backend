import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsPostalCode, IsString, Length } from 'class-validator';

export class CustomerAddressDto {
  @ApiProperty({ example: 'Ajay Venkatesh' })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @Length(3, 200)
  streetAddress: string;

  @ApiProperty({ example: 'Paramakudi' })
  @IsString()
  @Length(2, 100)
  city: string;

  @ApiPropertyOptional({ example: 'Tamil Nadu' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  state?: string;

  @ApiProperty({ example: '623707' })
  @IsPostalCode('IN')
  pincode: string;

  @ApiPropertyOptional({ example: 'Near bus stand' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  landmark?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
