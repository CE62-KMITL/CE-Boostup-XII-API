import { Rel } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { Problem } from 'src/problems/entities/problem.entity';
import { ProgrammingLanguage } from 'src/shared/enums/programming-language.enum';
import { User } from 'src/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Submission {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @ManyToOne({ entity: () => User, joinColumn: 'owner_id' })
  owner: Rel<User>;

  @ManyToOne({ entity: () => Problem, joinColumn: 'problem_id' })
  problem: Rel<Problem>;

  @Property({ type: types.text, lazy: true })
  code: string;

  @Enum({ items: () => ProgrammingLanguage, lazy: true })
  language: ProgrammingLanguage;

  @Property({ type: types.array, lazy: true })
  outputCodes: string[];

  @Property({ type: types.boolean, lazy: true })
  accepted: boolean;

  @Property({ type: types.float, lazy: true })
  compilationTime: number;

  @Property({ type: types.integer, lazy: true })
  compilationMemory: number;

  @Property({ type: types.float, lazy: true })
  executionTime: number;

  @Property({ type: types.integer, lazy: true })
  executionMemory: number;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();
}

export class SubmissionResponse {
  id: string;
  owner?: User;
  problem?: { id: string; title: string };
  code?: string;
  language?: ProgrammingLanguage;
  outputCodes?: string[];
  accepted?: boolean;
  compilationTime?: number;
  compilationMemory?: number;
  executionTime?: number;
  executionMemory?: number;
  createdAt?: Date;

  constructor(submission: Submission) {
    this.id = submission.id;
    this.owner = submission.owner;
    this.problem = submission.problem
      ? { id: submission.problem.id, title: submission.problem.title }
      : undefined;
    this.code = submission.code;
    this.language = submission.language;
    this.outputCodes = submission.outputCodes;
    this.accepted = submission.accepted;
    this.compilationTime = submission.compilationTime;
    this.compilationMemory = submission.compilationMemory;
    this.executionTime = submission.executionTime;
    this.executionMemory = submission.executionMemory;
    this.createdAt = submission.createdAt;
  }
}

export { ProgrammingLanguage } from 'src/shared/enums/programming-language.enum';
