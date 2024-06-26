import { Cascade, OneToMany, Rel } from '@mikro-orm/core';
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
import { Save } from 'src/saves/entities/save.entity';
import { CompletionStatus } from 'src/shared/enums/completion-status.enum';
import { OptimizationLevel } from 'src/shared/enums/optimization-level.enum';
import { PublicationStatus } from 'src/shared/enums/publication-status.enum';
import {
  ProgrammingLanguage,
  Submission,
} from 'src/submissions/entities/submission.entity';
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
    length: ConfigConstants.problem.maxTitleLength * 4,
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
  solutionLanguage: Rel<ProgrammingLanguage>;

  @Property({ type: types.array, nullable: true, lazy: true })
  allowedHeaders: string[] | null;

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
  optimizationLevel: Rel<OptimizationLevel>;

  @ManyToMany({
    entity: () => Attachment,
    pivotTable: 'problem_attachments',
    joinColumn: 'attachment_id',
    inverseJoinColumn: 'problem_id',
    owner: true,
  })
  attachments: Collection<Attachment> = new Collection<Attachment>(this);

  @ManyToMany({
    entity: () => ProblemTag,
    pivotTable: 'problem_tags',
    joinColumn: 'tag_id',
    inverseJoinColumn: 'problem_id',
    owner: true,
    eager: true,
  })
  tags: Collection<ProblemTag> = new Collection<ProblemTag>(this);

  @ManyToOne({ entity: () => User })
  owner: Rel<User>;

  @Property({
    type: types.string,
    length: ConfigConstants.problem.maxCreditsLength * 4,
    lazy: true,
  })
  credits: string;

  @Enum({ items: () => PublicationStatus, lazy: true })
  publicationStatus: Rel<PublicationStatus>;

  @ManyToOne({ entity: () => User, nullable: true })
  reviewer: Rel<User> | null = null;

  @Property({ type: types.text, nullable: true, lazy: true })
  reviewComment: string | null = null;

  @Formula(
    (alias) =>
      `(SELECT IFNULL(COUNT(DISTINCT \`submission\`.\`owner_id\`), 0) FROM \`submission\` INNER JOIN \`user\` ON \`submission\`.\`owner_id\` = \`user\`.\`id\` WHERE \`user\`.\`roles\` = 'User' AND \`submission\`.\`problem_id\` = ${alias}.\`id\` AND \`submission\`.\`accepted\` = 1)`,
    { type: types.integer, serializer: (value) => +value, lazy: true },
  )
  userSolvedCount: number;

  @ManyToMany({
    entity: () => User,
    pivotTable: 'user_unlocked_hints',
    joinColumn: 'user_id',
    inverseJoinColumn: 'problem_id',
    owner: true,
  })
  usersUnlockedHint: Collection<User> = new Collection<User>(this);

  @OneToMany({
    entity: () => Submission,
    mappedBy: (submission) => submission.problem,
    cascade: [Cascade.ALL],
  })
  submissions: Collection<Submission> = new Collection<Submission>(this);

  @OneToMany({
    entity: () => Save,
    mappedBy: (save) => save.problem,
    cascade: [Cascade.ALL],
  })
  saves: Collection<Save> = new Collection<Save>(this);

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, lazy: true, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

export class ProblemResponse {
  id: string;
  number?: number;
  title?: string;
  description?: string;
  input?: string;
  output?: string;
  hint?: string;
  hintCost?: number;
  testcases?: { input: string; output: string }[];
  exampleTestcases?: { input: string; output: string }[];
  starterCode?: string;
  solution?: string;
  solutionLanguage?: ProgrammingLanguage;
  allowedHeaders?: string[] | null;
  bannedFunctions?: string[];
  timeLimit?: number;
  memoryLimit?: number;
  difficulty?: number;
  score?: number;
  optimizationLevel?: OptimizationLevel;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
  tags?: { id: string; name: string }[];
  owner?: { id: string; displayName: string };
  credits?: string;
  publicationStatus?: PublicationStatus;
  reviewer?: { id: string; displayName: string };
  reviewComment?: string;
  completionStatus?: CompletionStatus;
  userSolvedCount?: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(
    problem: Problem,
    extra: { completionStatus?: CompletionStatus; removeHint?: boolean } = {},
  ) {
    this.id = problem.id;
    this.number = problem.number;
    this.title = problem.title;
    this.description = problem.description;
    this.input = problem.input;
    this.output = problem.output;
    this.hint = extra.removeHint ? undefined : problem.hint;
    this.hintCost = problem.hintCost;
    this.testcases = problem.testcases;
    this.exampleTestcases = problem.exampleTestcases;
    this.starterCode = problem.starterCode;
    this.solution = problem.solution;
    this.solutionLanguage = problem.solutionLanguage;
    this.allowedHeaders = problem.allowedHeaders;
    this.bannedFunctions = problem.bannedFunctions;
    this.timeLimit = problem.timeLimit;
    this.memoryLimit = problem.memoryLimit;
    this.difficulty = problem.difficulty;
    this.score = problem.score;
    this.optimizationLevel = problem.optimizationLevel;
    this.attachments =
      problem.attachments && problem.attachments.isInitialized()
        ? problem.attachments.map((attachment) => ({
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
            url: attachment.url,
          }))
        : undefined;
    this.tags =
      problem.tags && problem.tags.isInitialized()
        ? problem.tags.map((tag) => ({ id: tag.id, name: tag.name }))
        : undefined;
    this.owner = problem.owner
      ? {
          id: problem.owner.id,
          displayName: problem.owner.displayName,
        }
      : undefined;
    this.credits = problem.credits;
    this.publicationStatus = problem.publicationStatus;
    this.reviewer = problem.reviewer
      ? {
          id: problem.reviewer.id,
          displayName: problem.reviewer.displayName,
        }
      : undefined;
    this.reviewComment = problem.reviewComment || undefined;
    this.completionStatus = extra.completionStatus || undefined;
    this.userSolvedCount = problem.userSolvedCount;
    this.createdAt = problem.createdAt;
    this.updatedAt = problem.updatedAt;
  }
}

export { ProgrammingLanguage } from 'src/shared/enums/programming-language.enum';
export { OptimizationLevel } from 'src/shared/enums/optimization-level.enum';
export { PublicationStatus } from 'src/shared/enums/publication-status.enum';
