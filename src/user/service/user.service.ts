import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { FindAllParamsDto } from '../dto/find-all-params.dto';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { UserUpdateDto } from '../dto/update-user.dto';
import { UserIsAlreadyDisabledException } from '../exceptions/user-is-already-disabled.exception';
import { JwtService } from '@nestjs/jwt';
import { UserCredentials } from '../../utils/interfaces/user-credentials';
import { hashPassword } from '../../utils/hash-password';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async findAll(filter?: FindAllParamsDto): Promise<UserEntity[]> {
    return this.userRepository.find({
      where: filter,
    });
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: {
        id: id,
      },
    });
    if (user) return user;
    throw new NotFoundException();
  }

  async getUserCrendetialsByToken(token: string): Promise<UserEntity> {
    const resultOfToken = this.jwtService.decode<UserCredentials>(token);
    if (!resultOfToken) {
      throw new BadRequestException();
    }
    const user = await this.userRepository.findOne({
      where: {
        id: resultOfToken.id,
      },
    });
    if (user) {
      delete user.password;
      return user;
    }
    throw new NotFoundException();
  }

  async update(id: number, updateUserDto: UserUpdateDto) {
    const userFind = await this.userRepository.findOneBy({ id });
    if (userFind === null) {
      throw new UserNotFoundException();
    }
    if (updateUserDto === undefined) {
      throw new BadRequestException();
    }

    const invalidProps = Object.keys(updateUserDto).filter(
      (item) => !UserUpdateDto.getPropertyNames().includes(item),
    );

    if (invalidProps.length > 0) {
      throw new BadRequestException();
    }
    if (updateUserDto.password !== undefined) {
      updateUserDto.password = await hashPassword(updateUserDto.password);
    }
    await this.userRepository.update(id, updateUserDto);
    return { ...userFind, ...updateUserDto };
  }

  async remove(id: number) {
    const userFind = await this.userRepository.findOneBy({
      id,
    });

    if (userFind === null) {
      throw new UserNotFoundException();
    }

    if (userFind.disabled) {
      throw new UserIsAlreadyDisabledException();
    }
    await this.userRepository.update(userFind.id, { disabled: true });

    return { detail: 'Account disabled' };
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return await this.userRepository.findOne({
      where: {
        email,
        disabled: false,
      },
    });
  }

  async createUser(user: UserEntity): Promise<UserEntity> {
    return await this.userRepository.save(user);
  }
}
