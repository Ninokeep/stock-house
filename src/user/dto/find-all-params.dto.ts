import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';

export class FindAllParamsDto {
  @IsEmail()
  @IsOptional()
  @Type(() => String)
  email?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  username?: string;

  @IsEnum(UserRole)
  @IsOptional()
  @Type(() => String)
  role?: UserRole;
}
