import { Entity, PrimaryKey, Property, types } from '@mikro-orm/mariadb';
import { ConfigConstants } from 'src/config/config-constants';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class ProblemTag {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @Property({
    type: types.string,
    length: ConfigConstants.problemTag.maxNameLength,
    unique: true,
  })
  name: string;

  @Property({ type: types.text, lazy: true })
  description: string;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, lazy: true, onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
