import {
  Collection,
  Entity,
  Formula,
  OneToMany,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { User } from 'src/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Group {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @Property({ type: types.string, length: 32, unique: true })
  name: string;

  @Property({ type: types.text })
  description: string;

  @OneToMany({ entity: () => User, mappedBy: (user) => user.group })
  members: Collection<User, object> = new Collection<User>(this);

  @Formula(
    (alias) =>
      `(SELECT COUNT(*) FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`)`,
    { type: types.integer, lazy: true },
  )
  memberCount: number;

  @Formula(
    (alias) =>
      `(SELECT SUM(\`score\` * (SELECT COUNT(DISTINCT \`user_id\`) FROM \`submission\` WHERE \`submission\`.\`problem_id\` = \`problem\`.\`id\` AND \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)) FROM \`problem\`)`,
    { type: types.integer, lazy: true },
  )
  totalScore: number;

  @Formula(
    (alias) =>
      `(SELECT SUM(\`score\`) FROM \`problem\` WHERE \`problem\`.\`id\` IN (SELECT DISTINCT \`problem_id\` FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1))`,
    { type: types.integer, lazy: true },
  )
  uniqueTotalScore: number;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`problem_id\`, \`user_id\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)`,
    { type: types.integer, lazy: true },
  )
  problemSolvedCount: number;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`problem_id\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)`,
    { type: types.integer, lazy: true },
  )
  uniqueProblemSolvedCount: number;

  @Formula(
    (alias) =>
      `(SELECT MAX(\`created_at\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)`,
    { type: types.datetime, lazy: true },
  )
  lastProblemSolvedAt: Date;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, lazy: true, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
