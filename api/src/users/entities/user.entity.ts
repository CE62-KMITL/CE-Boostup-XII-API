import {
  Entity,
  Formula,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { Group } from 'src/groups/entities/group.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @Property({
    type: types.string,
    length: 255,
    unique: true,
    index: true,
    lazy: true,
  })
  email: string;

  @Property({ type: types.string, length: 255, lazy: true })
  hashedPassword: string;

  @Property({ type: types.string, length: 32 })
  displayName: string;

  @Property({ type: types.text, lazy: true })
  bio: string;

  @ManyToOne({ entity: () => Group, joinColumn: 'group_id' })
  group: Group;

  @Formula(
    (alias) =>
      `(SELECT SUM(\`score\`) FROM \`problem\` WHERE \`problem\`.\`id\` IN (SELECT DISTINCT \`problem_id\` FROM \`submission\` WHERE \`submission\`.\`user_id\` = ${alias}.\`id\` AND \`submission\`.\`accepted\` = 1))`,
    { type: types.integer, serializer: (value) => +value, lazy: true },
  )
  totalScore: number;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`problem_id\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` = ${alias}.\`id\` AND \`submission\`.\`accepted\` = 1)`,
    { type: types.integer, serializer: (value) => +value, lazy: true },
  )
  problemSolvedCount: number;

  @Formula(
    (alias) =>
      `(SELECT MAX(\`created_at\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` = ${alias}.\`id\` AND \`submission\`.\`accepted\` = 1)`,
    { type: types.datetime, lazy: true },
  )
  lastProblemSolvedAt: Date;

  @Property({ type: types.datetime, nullable: true, lazy: true })
  lastEmailRequestedAt?: Date;

  @Property({ type: types.string, length: 255, nullable: true, lazy: true })
  avatarFilename?: string;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, lazy: true, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(email: string, displayName: string, group: Group) {
    this.email = email;
    this.displayName = displayName;
    this.group = group;
    this.bio = '';
    this.hashedPassword = '';
  }
}

export class UserResponse {
  id?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  group?: Group;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.displayName = user.displayName;
    this.bio = user.bio;
    this.group = user.group;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
