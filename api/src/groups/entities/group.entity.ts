import {
  Collection,
  Entity,
  Formula,
  OneToMany,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { ConfigConstants } from 'src/config/config-constants';
import { parseIntOptional } from 'src/shared/parse-int-optional';
import { User } from 'src/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Group {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @Property({
    type: types.string,
    length: ConfigConstants.group.maxNameLength * 4,
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
    { type: types.integer, lazy: true },
  )
  memberCount: number | null;

  @Formula(
    (alias) =>
      `(SELECT SUM(\`score\` * (SELECT COUNT(DISTINCT \`owner_id\`) FROM \`submission\` WHERE \`submission\`.\`problem_id\` = \`problem\`.\`id\` AND \`submission\`.\`owner_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)) + (SELECT SUM(\`total_score_offset\`) FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) FROM \`problem\` WHERE \`problem\`.\`publication_status\` = 'Published')`,
    { type: types.integer, lazy: true },
  )
  totalScore: number | null;

  @Formula(
    (alias) =>
      `(SELECT SUM(\`score\`) FROM \`problem\` WHERE \`problem\`.\`id\` IN (SELECT DISTINCT \`problem_id\` FROM \`submission\` WHERE \`submission\`.\`owner_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1) AND \`problem\`.\`publication_status\` = 'Published')`,
    { type: types.integer, lazy: true },
  )
  uniqueTotalScore: number | null;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`submission\`.\`problem_id\`, \`submission\`.\`owner_id\`) FROM \`submission\` INNER JOIN \`problem\` ON \`submission\`.\`problem_id\` = \`problem\`.\`id\` WHERE \`submission\`.\`owner_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1 AND \`problem\`.\`publication_status\` = 'Published')`,
    { type: types.integer, lazy: true },
  )
  problemSolvedCount: number | null;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`submission\`.\`problem_id\`) FROM \`submission\` INNER JOIN \`problem\` ON \`submission\`.\`problem_id\` = \`problem\`.\`id\` WHERE \`submission\`.\`owner_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1 AND \`problem\`.\`publication_status\` = 'Published')`,
    { type: types.integer, lazy: true },
  )
  uniqueProblemSolvedCount: number | null;

  @Formula(
    (alias) =>
      `(SELECT MAX(\`submission\`.\`created_at\`) FROM \`submission\` INNER JOIN \`problem\` ON \`submission\`.\`problem_id\` = \`problem\`.\`id\` WHERE \`submission\`.\`owner_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1 AND \`problem\`.\`publication_status\` = 'Published')`,
    { type: types.datetime, lazy: true },
  )
  lastProblemSolvedAt: Date;

  @Property({ type: types.string, length: 255, nullable: true, lazy: true })
  avatarFilename: string | null = null;

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
    this.members =
      group.members && group.members.isInitialized()
        ? group.members.map((user) => ({
            id: user.id,
            displayName: user.displayName,
          }))
        : undefined;
    this.memberCount = parseIntOptional(group.memberCount);
    this.totalScore = parseIntOptional(group.totalScore);
    this.uniqueTotalScore = parseIntOptional(group.uniqueTotalScore);
    this.problemSolvedCount = parseIntOptional(group.problemSolvedCount);
    this.uniqueProblemSolvedCount = parseIntOptional(
      group.uniqueProblemSolvedCount,
    );
    this.lastProblemSolvedAt = group.lastProblemSolvedAt;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
  }
}
