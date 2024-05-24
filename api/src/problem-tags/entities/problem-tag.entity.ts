import { Rel } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { ConfigConstants } from 'src/config/config-constants';
import { User } from 'src/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class ProblemTag {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @Property({
    type: types.string,
    length: ConfigConstants.problemTag.maxNameLength,
    unique: true,
  })
  name: string;

  @Property({ type: types.text, lazy: true })
  description: string;

  @ManyToOne({ entity: () => User })
  owner: Rel<User>;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, lazy: true, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

export class ProblemTagResponse {
  id: string;
  name?: string;
  description?: string;
  owner?: { id: string; displayName: string };
  createdAt?: Date;
  updatedAt?: Date;

  constructor(problemTag: ProblemTag) {
    this.id = problemTag.id;
    this.name = problemTag.name;
    this.description = problemTag.description;
    this.owner = problemTag.owner
      ? { id: problemTag.owner.id, displayName: problemTag.owner.displayName }
      : undefined;
    this.createdAt = problemTag.createdAt;
    this.updatedAt = problemTag.updatedAt;
  }
}
