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
  )
  memberCount: number;

  @Formula(
    (alias) =>
      `(SELECT SUM(\`score\`) FROM \`problem\` WHERE \`problem\`.\`id\` IN (SELECT DISTINCT \`problem_id\` FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1))`,
  )
  totalScore: number;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`problem_id\`, \`user_id\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)`,
  )
  problemSolvedCount: number;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`problem_id\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)`,
  )
  uniqueProblemSolvedCount: number;

  @Formula(
    (alias) =>
      `(SELECT MAX(\`created_at\`) FROM \`submission\` WHERE \`submission\`.\`user_id\` IN (SELECT \`id\` FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`) AND \`submission\`.\`accepted\` = 1)`,
  )
  lastProblemSolvedAt: Date;

  @Property({ type: types.datetime })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
