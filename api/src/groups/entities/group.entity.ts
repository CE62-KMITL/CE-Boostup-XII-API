import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  VirtualColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(() => User, (user) => user.group)
  members: User[];

  @VirtualColumn({
    query: (alias) =>
      `(SELECT COUNT(*) FROM user WHERE user.group_id = ${alias}.id)`,
  })
  memberCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
