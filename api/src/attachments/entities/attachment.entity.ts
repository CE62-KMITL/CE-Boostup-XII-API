import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { User } from 'src/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Attachment {
  @PrimaryKey({ type: types.uuid })
  id: string = uuidv4();

  @Property({ type: types.text })
  name: string;

  @Property({ type: types.string, length: 255 })
  type: string;

  @Property({ name: 'url' })
  getUrl() {
    return `/attachments/${this.id}/${this.name}`;
  }

  @ManyToOne({ entity: () => User })
  owner: User;

  @Property({ type: types.datetime })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(name: string, type: string, owner: User) {
    this.name = name;
    this.type = type;
    this.owner = owner;
  }
}
