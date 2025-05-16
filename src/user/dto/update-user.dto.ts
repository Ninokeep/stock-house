import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  NotEquals,
  ValidateIf,
} from 'class-validator';
import { TrimWhiteSpace } from '../../decorators/trim-white-space.decorator';
import { UserRole } from '../enum/user-role.enum';

export class UserUpdateDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  lastname?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  firstname?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  disabled?: boolean;

  @IsEmail()
  @IsOptional()
  @ApiProperty()
  email?: string;

  @IsString()
  @NotEquals(null)
  @ApiProperty()
  @ValidateIf((obj, value) => value !== undefined)
  @TrimWhiteSpace()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  static getPropertyNames(): string[] {
    return ['lastname', 'email', 'password', 'role', 'firstname', 'disabled'];
  }
}
