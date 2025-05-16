import { AuthService } from './auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/service/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { repositoryMockFactory } from '../../utils/mocks/mock-factory';
import { UserRole } from '../../user/enum/user-role.enum';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: UserService;
  let userRepository;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    lastname: 'Doe',
    firstname: 'John',
    role: UserRole.USER,
    password: 'hashedPassword123',
    disabled: false,
    createAt: new Date('2023-01-01T00:00:00.000Z'),
    updateAt: new Date('2023-01-01T00:00:00.000Z'),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(UserEntity));
  });

  it('should return user if email exists and is not disabled', async () => {
    userRepository.findOne.mockImplementation(({ where }) => {
      if (where.email === mockUser.email && where.disabled === false) {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(null);
    });
    const result = await userService.findByEmail('test@example.com');
    expect(result).toEqual(mockUser);
  });

  it('should login', async () => {
    userRepository.findOne.mockResolvedValue(mockUser);
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => true);
    jest.spyOn(jwtService, 'sign').mockImplementation(() => 's');
    const loginDto = new LoginDto();
    loginDto.email = 'test@example.com';
    loginDto.password = 'hashedPassword123';

    const query = await service.login(loginDto);
  });
});
