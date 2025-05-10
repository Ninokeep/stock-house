import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import { JwtService } from '@nestjs/jwt';
import { UserAccountService } from './service/user-account.service';

@Module({
  providers: [UserService, JwtService, UserAccountService],
  exports: [UserService, UserAccountService],
  controllers: [UserController],
  imports: [TypeOrmModule.forFeature([UserEntity])],
})
export class Usermodule {}
