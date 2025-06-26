import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { UserUpdateDto } from '../dto/update-user.dto';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../enum/user-role.enum';
import { exec } from 'node:child_process';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<UserEntity>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const mockJwtService = {
      sign: jest.fn().mockResolvedValue('token'),
      verify: jest.fn().mockResolvedValue({ id: 1 }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    userService = module.get<UserService>(UserService);
  });

  it('PUT username of user success', async () => {
    const oldUserUpdateDto = new UserUpdateDto();
    oldUserUpdateDto.role = UserRole.USER;
    oldUserUpdateDto.email = 'toto@gmail.com';
    oldUserUpdateDto.firstname = 'toto';

    const userUpdateDto = new UserUpdateDto();
    userUpdateDto.firstname = 'jean';
    const id = 1;
    userRepository.update = jest.fn().mockResolvedValue(oldUserUpdateDto);
    userRepository.findOneBy = jest.fn().mockResolvedValue(oldUserUpdateDto);
    const result = await userService.update(id, userUpdateDto);
    expect(result.firstname).toEqual('jean');
  });

  it('PUT failed because the user doesn t exist', async () => {
    const oldUserUpdateDto = null;
    const userUpdateDto = new UserUpdateDto();
    userUpdateDto.firstname = 'jean';
    const id = 1;
    userRepository.update = jest.fn().mockResolvedValue(oldUserUpdateDto);
    userRepository.findOneBy = jest.fn().mockResolvedValue(oldUserUpdateDto);
    await expect(userService.update(id, userUpdateDto)).rejects.toThrow(
      "User doesn't exist",
    );
    await expect(userService.update(id, userUpdateDto)).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
