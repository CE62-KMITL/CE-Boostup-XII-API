import {
  Collection,
  Entity,
  Formula,
  OneToMany,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { ConfigConstants } from '../../config/config-constants';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Group {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @Property({
    type: types.string,
    length: ConfigConstants.group.maxNameLength,
    unique: true,
  })
  name: string;

  @Property({ type: types.text, lazy: true })
  description: string;

  @OneToMany({ entity: () => User, mappedBy: (user) => user.group })
  members: Collection<User> = new Collection<User>(this);

  @Formula(
    (alias) =>
      `(SELECT COUNT(*) FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`)`,
    { type: types.integer, serializer: (value) => +value, lazy: true },
  )
  memberCount: number;

  @Formula(
    (alias) =>
      `(SELECT SUM(\`score\` * (SELECT COUNT(DISTINCT \`user_id\`) FROM \`submission\` WHERE \`submission\`.\`problem_id\` = \`problem\`.\`id\` AND \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)) - (SELECT SUM(\`total_score_offset\`) FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) FROM \`problem\`)`,
    { type: types.integer, serializer: (value) => +value, lazy: true },
  )
  totalScore: number;

  @Formula(
    (alias) =>
      `(SELECT SUM(\`score\`) FROM \`problem\` WHERE \`problem\`.\`id\` IN (SELECT DISTINCT \`problem_id\` FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1))`,
    { type: types.integer, serializer: (value) => +value, lazy: true },
  )
  uniqueTotalScore: number;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`problem_id\`, \`user_id\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)`,
    { type: types.integer, serializer: (value) => +value, lazy: true },
  )
  problemSolvedCount: number;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`problem_id\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)`,
    { type: types.integer, serializer: (value) => +value, lazy: true },
  )
  uniqueProblemSolvedCount: number;

  @Formula(
    (alias) =>
      `(SELECT MAX(\`created_at\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)`,
    { type: types.datetime, lazy: true },
  )
  lastProblemSolvedAt: Date;

  @Property({ type: types.string, length: 255, nullable: true, lazy: true })
  avatarFilename?: string;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, lazy: true, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

export class GroupResponse {
  id: string;
  name?: string;
  description?: string;
  members?: { id: string; displayName: string }[];
  memberCount?: number;
  totalScore?: number;
  uniqueTotalScore?: number;
  problemSolvedCount?: number;
  uniqueProblemSolvedCount?: number;
  lastProblemSolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(group: Group) {
    this.id = group.id;
    this.name = group.name;
    this.description = group.description;
    this.members = group.members
      ? group.members.map((user) => ({
          id: user.id,
          displayName: user.displayName,
        }))
      : undefined;
    this.memberCount = group.memberCount;
    this.totalScore = group.totalScore;
    this.uniqueTotalScore = group.uniqueTotalScore;
    this.problemSolvedCount = group.problemSolvedCount;
    this.uniqueProblemSolvedCount = group.uniqueProblemSolvedCount;
    this.lastProblemSolvedAt = group.lastProblemSolvedAt;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
  }
}
