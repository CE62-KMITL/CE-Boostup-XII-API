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

  @Property({ type: types.string, length: 255 })
  title: string;

  @Property({ type: types.text })
  description: string;

  @Property({ type: types.text })
  input: string;

  @Property({ type: types.text })
  output: string;

  @Property({ type: types.text })
  hint: string;

  @Property({ type: types.integer })
  hihtCost: number;

  @Property({ type: types.json })
  testcases: { input: string; output: string }[];

  @Property({ type: types.json })
  exampleTestcases: { input: string; output: string }[];

  @Property({ type: types.text })
  starterCode: string;

  @Property({ type: types.text })
  solution: string;

  @Enum({ items: () => ProgrammingLanguage })
  solutionLanguage: ProgrammingLanguage;

  @Property({ type: types.array })
  allowedHeaders: string[];

  @Property({ type: types.array })
  bannedFunctions: string[];

  @Property({ type: types.float, precision: 6, scale: 3 })
  timeLimit: number;

  @Property({ type: types.integer, unsigned: true })
  memoryLimit: number;

  @Property({ type: types.tinyint, unsigned: true })
  difficulty: number;

  @Property({ type: types.integer, unsigned: true })
  score: number;

  @Enum({ items: () => OptimizationLevel })
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
    mappedBy: (tag) => tag.problems,
    pivotTable: 'problem_tags',
    joinColumn: 'tag_id',
    inverseJoinColumn: 'problem_id',
    owner: true,
  })
  tags: Collection<ProblemTag, object> = new Collection<ProblemTag>(this);

  @ManyToOne({ entity: () => User })
  owner: User;

  @Property({ type: types.string, length: 255 })
  credits: string;

  @Enum({ items: () => PublicationStatus })
  publicationStatus: PublicationStatus;

  @Formula(
    (alias) =>
      `(SELECT COUNT(DISTINCT \`user_id\`) FROM \`submission\` WHERE \`submission\`.\`problem_id\` = ${alias}.\`id\` AND \`submission\`.\`accepted\` = 1)`,
  )
  userSolvedCount: number;

  @Property({ type: types.datetime })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

export { OptimizationLevel } from 'src/shared/enums/optimization-level.enum';
export { PublicationStatus } from 'src/shared/enums/publication-status.enum';
