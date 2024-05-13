import {
  Entity,
  Enum,
  Formula,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { ConfigConstants } from 'src/config/config-constants';
import { Group } from 'src/groups/entities/group.entity';
import { Role } from 'src/shared/enums/role.enum';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @Property({
    type: types.string,
    length: ConfigConstants.user.maxEmailLength,
    unique: true,
    index: true,
    lazy: true,
  })
  email: string;

  @Enum({ items: () => Role, array: true, lazy: true })
  roles: Role[];

  @Property({ type: types.string, length: 255, lazy: true })
  hashedPassword: string;

  @Property({
    type: types.string,
    length: ConfigConstants.user.maxDisplayNameLength,
  })
  displayName: string;

  @Property({ type: types.text, lazy: true })
  bio: string;

  @ManyToOne({
    entity: () => Group,
    nullable: true,
    eager: true,
    joinColumn: 'group_id',
  })
  group?: Group;

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

  constructor(
    email: string,
    roles: Role[],
    displayName: string,
    group?: Group,
  ) {
    this.email = email;
    this.roles = roles;
    this.displayName = displayName;
    this.group = group;
    this.bio = '';
    this.hashedPassword = '';
  }
}

export class UserResponse {
  id: string;
  email?: string;
  roles?: Role[];
  displayName?: string;
  bio?: string;
  group?: { id: string; name: string } | null;
  totalScore?: number;
  problemSolvedCount?: number;
  lastProblemSolvedAt?: Date;
  lastEmailRequestedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.roles = user.roles;
    this.displayName = user.displayName;
    this.bio = user.bio;
    this.group = user.group
      ? { id: user.group.id, name: user.group.name }
      : null;
    this.totalScore = user.totalScore;
    this.problemSolvedCount = user.problemSolvedCount;
    this.lastProblemSolvedAt = user.lastProblemSolvedAt;
    this.lastEmailRequestedAt = user.lastEmailRequestedAt;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
