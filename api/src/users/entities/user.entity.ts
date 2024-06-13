import { Rel } from '@mikro-orm/core';
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
  roles: Rel<Role>[];

  @Property({ type: types.string, length: 255, lazy: true })
  hashedPassword: string;

  @Property({
    type: types.string,
    length: ConfigConstants.user.maxDisplayNameLength * 4,
  })
  displayName: string;

  @Property({ type: types.text, lazy: true })
  bio: string;

  @ManyToOne({
    entity: () => Group,
    joinColumn: 'group_id',
    nullable: true,
  })
  group: Rel<Group> | null;

  @Formula(
    (alias) =>
      `(SELECT IFNULL(SUM(\`score\`), 0) + ${alias}.\`total_score_offset\` FROM \`problem\` WHERE \`problem\`.\`id\` IN (SELECT DISTINCT \`problem_id\` FROM \`submission\` WHERE \`submission\`.\`owner_id\` = ${alias}.\`id\` AND \`submission\`.\`accepted\` = 1) AND \`problem\`.\`publication_status\` = 'Published')`,
    { type: types.integer, lazy: true },
  )
  totalScore: number;

  @Property({ type: types.integer, lazy: true })
  totalScoreOffset: number = 0;

  @Formula(
    (alias) =>
      `(SELECT IFNULL(COUNT(DISTINCT \`submission\`.\`problem_id\`), 0) FROM \`submission\` INNER JOIN \`problem\` ON \`submission\`.\`problem_id\` = \`problem\`.\`id\` WHERE \`submission\`.\`owner_id\` = ${alias}.\`id\` AND \`submission\`.\`accepted\` = 1 AND \`problem\`.\`publication_status\` = 'Published')`,
    { type: types.integer, lazy: true },
  )
  problemSolvedCount: number;

  @Formula(
    (alias) =>
      `(SELECT MAX(\`submission\`.\`created_at\`) FROM \`submission\` INNER JOIN \`problem\` ON \`submission\`.\`problem_id\` = \`problem\`.\`id\` WHERE \`submission\`.\`owner_id\` = ${alias}.\`id\` AND \`submission\`.\`accepted\` = 1 AND \`problem\`.\`publication_status\` = 'Published')`,
    { type: types.datetime, lazy: true },
  )
  lastProblemSolvedAt: Date | null;

  @Property({ type: types.datetime, nullable: true, lazy: true })
  lastEmailRequestedAt: Date | null = null;

  @Property({ type: types.string, length: 255, nullable: true, lazy: true })
  avatarFilename: string | null = null;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, lazy: true, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    email: string,
    roles: Role[],
    displayName: string,
    group?: Rel<Group> | null,
    hashedPassword?: string,
  ) {
    this.email = email;
    this.roles = roles;
    this.displayName = displayName;
    this.group = group || null;
    this.bio = '';
    this.hashedPassword = hashedPassword ?? '';
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
    this.lastProblemSolvedAt = user.lastProblemSolvedAt ?? undefined;
    this.lastEmailRequestedAt = user.lastEmailRequestedAt || undefined;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}

export { Role } from 'src/shared/enums/role.enum';
