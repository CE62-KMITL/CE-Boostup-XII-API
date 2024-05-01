import {
  Collection,
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { Problem } from 'src/problems/entities/problem.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class ProblemTag {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @Property({ type: types.string, length: 32, unique: true })
  name: string;

  @Property({ type: types.text })
  description: string;

  @ManyToMany({ entity: () => Problem, mappedBy: (problem) => problem.tags })
  problems: Collection<Problem, object> = new Collection<Problem>(this);

  @Property({ type: types.datetime })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
