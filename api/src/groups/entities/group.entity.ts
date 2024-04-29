import {
  Collection,
  Entity,
  Formula,
  OneToMany,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../../users/entities/user.entity';

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

  @Property({ type: types.datetime })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }
}
