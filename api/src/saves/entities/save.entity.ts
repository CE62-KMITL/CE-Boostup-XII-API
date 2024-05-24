import { Rel } from '@mikro-orm/core';
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

  @ManyToOne({ entity: () => User, joinColumn: 'owner_id' })
  owner: Rel<User>;

  @ManyToOne({ entity: () => Problem, joinColumn: 'problem_id' })
  problem: Rel<Problem>;

  @Property({ type: types.text, lazy: true })
  code: string;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, lazy: true, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

export class SaveResponse {
  id: string;
  owner?: { id: string; displayName: string };
  problem?: { id: string; title: string };
  code?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(save: Save) {
    this.id = save.id;
    this.owner = save.owner
      ? { id: save.owner.id, displayName: save.owner.displayName }
      : undefined;
    this.problem = save.problem
      ? { id: save.problem.id, title: save.problem.title }
      : undefined;
    this.code = save.code;
    this.createdAt = save.createdAt;
    this.updatedAt = save.updatedAt;
  }
}
