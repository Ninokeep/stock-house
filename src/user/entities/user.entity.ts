import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IndependentEntity } from '../../independent/entities/independent.entity';
import { ClientEntity } from '../../client/entities/client.entity';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  lastname: string;

  @Column()
  firstname: string;

  @Column()
  password: string;

  @Column({ default: false, enum: [false, true] })
  disabled: boolean;

  @OneToOne(() => IndependentEntity, (independent) => independent.user, {
    cascade: true,
  })
  independent: IndependentEntity;

  @OneToOne(() => ClientEntity, (client) => client.user, { cascade: true })
  client: ClientEntity;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
