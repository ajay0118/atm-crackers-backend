import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'ATM Crackers',
    description: 'Admin display name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    example: 'admin@example.com',
    description: 'Admin email address',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({
    example: 'CurrentPassword123!',
    description: 'Required when changing email',
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Current password must be at least 8 characters' })
  currentPassword?: string;
}
