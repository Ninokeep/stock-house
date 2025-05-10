import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../user/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { UserAlreadyExistException } from '../exceptions/user-already-exist.exception';
import { hashPassword } from 'src/utils/hash-password';
import { NotSamePasswordException } from '../exceptions/not-same-password.exception';
import * as bcrypt from 'bcrypt';
import { WrongPasswordException } from '../exceptions/wrong-password.exception';
import { JwtService } from '@nestjs/jwt';
import { UserCredentialsDto } from '../dto/user-credentials.dto';
import { UserType } from 'src/utils/enums/user-type.enum';
import { UserService } from 'src/user/service/user.service';
import { ClientEntity } from 'src/client/entities/client.entity';
import { IndependentEntity } from 'src/independent/entities/independent.entity';
import { BadCredentialsException } from '../exceptions/bad-credentials.exception';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception';
import { EmailDto } from 'src/shared/dto/email.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async login(loginDto: LoginDto) {
    const user =
      await this.userService.getClientsAndAppointmentsForIndependent(
        'B@gmail.com',
      );

    if (!user || user.disabled) {
      throw new BadCredentialsException();
    }
    const isSamePassword = await this.checkSamePassword(
      loginDto.password,
      user.password,
    );

    if (!isSamePassword) {
      throw new WrongPasswordException();
    }
    const transformData = (user: UserEntity) => {
      const flatData = instanceToPlain({
        ...user,
        ...user.independent,
        role:
          user.hasOwnProperty('independent') && user.independent
            ? UserType.INDEPENDENT
            : UserType.CLIENT,
        appointments: user.independent?.appointments || [],
      });
      delete flatData.independent;
      delete flatData.password;

      return flatData;
    };

    const payload = {
      email: user.email,
      id: user.id,
      disabled: user.disabled,
    };

    const accessToken = await this.generateToken({
      ...payload,
      type: 'bearer',
    });
    const refreshToken = await this.generateToken({
      ...payload,
      type: 'refresh',
    });

    return {
      statusCode: 200,
      data: user,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async getRefreshToken(userId: number) {
    const payload = {
      access_token: await this.generateToken({ id: userId, type: 'bearer' }),
      refresh_token: await this.generateToken({ id: userId, type: 'refresh' }),
    };
    return payload;
  }

  async getUserInformations(userCredentialsDto: UserCredentialsDto) {
    return {};
  }

  async register(registerDto: RegisterDto) {
    const user = await this.userService.findByEmail(registerDto.email);

    if (user !== null) {
      throw new UserAlreadyExistException();
    }

    if (registerDto.password !== registerDto.passwordConfirm) {
      throw new NotSamePasswordException();
    }
    const newUser = new UserEntity();
    registerDto.password = await hashPassword(registerDto.password);
    Object.assign(newUser, registerDto);

    if (registerDto.type === UserType.INDEPENDENT) {
      const independentEntity = new IndependentEntity();
      Object.assign(independentEntity, registerDto);
      newUser.independent = independentEntity;
    } else {
      const clientEntity = new ClientEntity();
      Object.assign(clientEntity, registerDto);
      newUser.client = clientEntity;
    }

    await this.userService.createUser(newUser);

    return { message: 'User created !' };
  }

  private async checkSamePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    const isMatch = await bcrypt.compare(password, hash);

    if (!isMatch) {
      return false;
    }

    return true;
  }

  private async generateToken(payload: Buffer | object) {
    const accessToken = await this.jwtService.signAsync(
      {
        ...payload,
      },
      {
        expiresIn: payload['type'] === 'refresh' ? '15m' : '2h',
      },
    );
    return accessToken;
  }

  private async userExists(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return false;
    }
    return true;
  }
  async getNewPasswordHashed({ email }: EmailDto) {
    const user = await this.userExists(email);
    if (!user) {
      throw new UserNotFoundException();
    }
    const newPassword = 'testing';
    return await hashPassword(newPassword);
  }
}
