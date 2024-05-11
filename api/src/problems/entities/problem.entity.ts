import {
  Collection,
  Entity,
  Enum,
  Formula,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { ConfigConstants } from 'src/config/config-constants';
import { ProblemTag } from 'src/problem-tags/entities/problem-tag.entity';
import { OptimizationLevel } from 'src/shared/enums/optimization-level.enum';
import { PublicationStatus } from 'src/shared/enums/publication-status.enum';
import { ProgrammingLanguage } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Problem {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @Property({
    type: types.integer,
    unsigned: true,
    unique: true,
    index: true,
    autoincrement: true,
  })
  number: number;

  @Property({
    type: types.string,
    length: ConfigConstants.problem.maxTitleLength,
  })
  title: string;

  @Property({ type: types.text, lazy: true })
  description: string;

  @Property({ type: types.text, lazy: true })
  input: string;

  @Property({ type: types.text, lazy: true })
  output: string;

  @Property({ type: types.text, lazy: true })
  hint: string;

  @Property({ type: types.integer, lazy: true })
  hintCost: number;

  @Property({ type: types.json, lazy: true })
  testcases: { input: string; output: string }[];

  @Property({ type: types.json, lazy: true })
  exampleTestcases: { input: string; output: string }[];

  @Property({ type: types.text, lazy: true })
  starterCode: string;

  @Property({ type: types.text, lazy: true })
  solution: string;

  @Enum({ items: () => ProgrammingLanguage, lazy: true })
  solutionLanguage: ProgrammingLanguage;

  @Property({ type: types.array, lazy: true })
  allowedHeaders: string[];

  @Property({ type: types.array, lazy: true })
  bannedFunctions: string[];

  @Property({ type: types.float, lazy: true })
  timeLimit: number;

  @Property({ type: types.integer, unsigned: true, lazy: true })
  memoryLimit: number;

  @Property({ type: types.tinyint, unsigned: true })
  difficulty: number;

  @Property({ type: types.integer, unsigned: true })
  score: number;

  @Enum({ items: () => OptimizationLevel, lazy: true })
  optimizationLevel: OptimizationLevel;

  @ManyToMany({
    entity: () => Attachment,
    pivotTable: 'problem_attachments',
    joinColumn: 'attachment_id',
    inverseJoinColumn: 'problem_id',
    owner: true,
  })
  attachments: Collection<Attachment, object> = new Collection<Attachment>(
    this,
  );

  @ManyToMany({
    entity: () => ProblemTag,
    pivotTable: 'problem_tags',
    joinColumn: 'tag_id',
    inverseJoinColumn: 'problem_id',
    owner: true,
    eager: true,
  })
  tags: Collection<ProblemTag, object> = new Collection<ProblemTag>(this);

  @ManyToOne({ entity: () => User })
  owner: User;

  @Property({
    type: types.string,
    length: ConfigConstants.problem.maxCreditsLength,
    lazy: true,
  })
  credits: string;

  @Enum({ items: () => PublicationStatus, lazy: true })
  publicationStatus: PublicationStatus;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`user_id\`) FROM \`submission\` WHERE \`submission\`.\`problem_id\` = ${alias}.\`id\` AND \`submission\`.\`accepted\` = 1)`,
    { type: types.integer, lazy: true },
  )
  userSolvedCount: number;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, lazy: true, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

export { OptimizationLevel } from 'src/shared/enums/optimization-level.enum';
export { PublicationStatus } from 'src/shared/enums/publication-status.enum';
