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

  async isUserClient(email: string) {
    const userClient = await this.userRepository.findOne({
      where: {
        email,
      },
      relations: {
        client: true,
      },
    });
    console.log(userClient);
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return await this.userRepository.findOne({
      where: {
        email,
        disabled: false,
      },
      relations: ['independent.appointments', 'client.user'],
    });
  }

  async createUser(user: UserEntity): Promise<UserEntity> {
    return await this.userRepository.save(user);
  }

  async getClientsAndAppointmentsForIndependent(
    email: string,
  ): Promise<UserEntity> | null {
    const queryBuilder = await this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id as id',
        'u.email as email',
        'u.lastname as lastname',
        'u.firstname as firstname',
        'u.password as password',
        'u.disabled as disabled',
      ])
      .addSelect(
        `JSON_AGG(
        JSON_BUILD_OBJECT(
            'client', JSON_BUILD_OBJECT(
                'id', c.id,
                'email', c.email,
                'lastname', c.lastname,
                'firstname', c.firstname
            ),
            'appointments', (
                 SELECT JSON_AGG(a)
                FROM APPOINTMENT a
                WHERE a."clientId" = c.id
                AND a."independentId" = u.id and a.d_day >= now()
            )
        )
    )`,
        'clients_with_appointments',
      )
      .innerJoin(
        'independents_clients_relations',
        'ic_relations',
        'ic_relations."independentId" = u.id',
      )
      .innerJoin('user_entity', 'c', `c.id = ic_relations."clientId"`)
      .where('u.email = :email', {
        email,
      })
      .groupBy('u.id')
      .getRawMany();
    return queryBuilder[0] || null;

    //     u.email,
    //     u.password,
    //     u.lastname,
    //     u.firstname,
    //     JSON_AGG(
    //         JSON_BUILD_OBJECT(
    //             'client', JSON_BUILD_OBJECT(
    //                 'id', c.id,
    //                 'email', c.email,
    //                 'lastname', c.lastname,
    //                 'firstname', c.firstname
    //             ),
    //             'appointments', (
    //                  SELECT JSON_AGG(a)
    //                 FROM APPOINTMENT a
    //                 WHERE a."clientId" = c.id
    //                 AND a."independentId" = u.id and a.d_day >= now()
    //             )
    //         )
    //     ) AS clients_with_appointments
    // FROM user_entity as u
    // INNER JOIN independents_clients_relations as ic_relations
    //     ON ic_relations."independentId" = u.id
    // INNER JOIN user_entity as c
    //     ON c.id = ic_relations."clientId"
    // WHERE u.email = 'D@gmail.com'
    // GROUP BY u.id, u.email, u.lastname, u.firstname`,
    //     );
  }

  async isIndependent(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
      relations: ['independent'],
    });

    if (!user) throw new NotFoundException();

    return user.independent ? true : false;
  }
}
