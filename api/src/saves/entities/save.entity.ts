import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { Problem } from 'src/problems/entities/problem.entity';
import { User } from 'src/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Save {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @ManyToOne({ entity: () => User, joinColumn: 'user_id' })
  user: User;

  @ManyToOne({ entity: () => Problem, joinColumn: 'problem_id' })
  problem: Problem;

  @Property({ type: types.text })
  code: string;

  @Property({ type: types.datetime })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}