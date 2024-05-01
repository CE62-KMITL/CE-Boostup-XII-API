import {
  Entity,
  Enum,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { Problem } from 'src/problems/entities/problem.entity';
import { User } from 'src/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Submission {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @ManyToOne({ entity: () => User })
  user: User;

  @ManyToOne({ entity: () => Problem })
  problem: Problem;

  @Property({ type: types.text })
  code: string;

  @Enum({ items: () => SubmissionLanguage })
  language: SubmissionLanguage;

  @Property({ type: types.array })
  outputCodes: string[];

  @Property({ type: types.boolean })
  accepted: boolean;

  @Property({ type: types.float, precision: 6, scale: 3 })
  compilationTime: number;

  @Property({ type: types.float, precision: 6, scale: 3 })
  executionTime: number;

  @Property({ type: types.datetime })
  createdAt: Date = new Date();
}

export enum SubmissionLanguage {
  C99 = 'c99',
  C11 = 'c11',
  C17 = 'c17',
  CPP11 = 'c++11',
  CPP14 = 'c++14',
  CPP17 = 'c++17',
  CPP20 = 'c++20',
  CPP23 = 'c++23',
  GNU99 = 'gnu99',
  GNU11 = 'gnu11',
  GNU17 = 'gnu17',
  GNUPP11 = 'gnu++11',
  GNUPP14 = 'gnu++14',
  GNUPP17 = 'gnu++17',
  GNUPP20 = 'gnu++20',
  GNUPP23 = 'gnu++23',
}
