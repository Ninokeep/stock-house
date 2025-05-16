import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../user/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { UserAlreadyExistException } from '../exceptions/user-already-exist.exception';
import { hashPassword } from '../../utils/hash-password';
import { NotSamePasswordException } from '../exceptions/not-same-password.exception';
import * as bcrypt from 'bcrypt';
import { WrongPasswordException } from '../exceptions/wrong-password.exception';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/service/user.service';
import { BadCredentialsException } from '../exceptions/bad-credentials.exception';
import { UserNotFoundException } from '../../user/exceptions/user-not-found.exception';
import { EmailDto } from '../../shared/dto/email.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);

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

    await this.userService.createUser(newUser);

    return { message: 'User created !' };
  }

  protected async checkSamePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash);
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
