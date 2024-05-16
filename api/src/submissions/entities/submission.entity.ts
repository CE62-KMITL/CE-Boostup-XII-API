import {
  Entity,
  Enum,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { Problem } from '../../problems/entities/problem.entity';
import { ProgrammingLanguage } from '../../shared/enums/programming-language.enum';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Submission {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @ManyToOne({ entity: () => User, joinColumn: 'user_id' })
  user: User;

  @ManyToOne({ entity: () => Problem, joinColumn: 'problem_id' })
  problem: Problem;

  @Property({ type: types.text })
  code: string;

  @Enum({ items: () => ProgrammingLanguage })
  language: ProgrammingLanguage;

  @Property({ type: types.array })
  outputCodes: string[];

  @Property({ type: types.boolean })
  accepted: boolean;

  @Property({ type: types.float })
  compilationTime: number;

  @Property({ type: types.float })
  executionTime: number;

  @Property({ type: types.datetime })
  createdAt: Date = new Date();
}

export { ProgrammingLanguage } from '../../shared/enums/programming-language.enum';
