import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { ProblemTag } from 'src/problem-tags/entities/problem-tag.entity';
import { Submission } from 'src/submissions/entities/submission.entity';
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
  solution: string;

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

  @Enum({ items: () => ProblemOptimizationLevel })
  optimizationLevel: ProblemOptimizationLevel;

  @ManyToMany({ entity: () => Attachment })
  attachments: Collection<Attachment, object> = new Collection<Attachment>(
    this,
  );

  @ManyToMany({
    entity: () => ProblemTag,
    mappedBy: (tag) => tag.problems,
    owner: true,
  })
  tags: Collection<ProblemTag, object> = new Collection<ProblemTag>(this);

  @ManyToOne({ entity: () => User })
  owner: User;

  @Property({ type: types.string, length: 255 })
  credit: string;

  @Enum({ items: () => ProblemPublicationStatus })
  publicationStatus: ProblemPublicationStatus;

  @Property({ type: types.datetime })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

export enum ProblemOptimizationLevel {
  O0 = 'O0',
  Og = 'Og',
  O1 = 'O1',
  O2 = 'O2',
  O3 = 'O3',
  Os = 'Os',
  Ofast = 'Ofast',
}

export enum ProblemPublicationStatus {
  Draft = 'Draft',
  AwaitingApproval = 'AwaitingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Published = 'Published',
  Archived = 'Archived',
}
