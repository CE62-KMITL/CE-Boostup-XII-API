import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Attachment {
  @PrimaryKey({ type: types.uuid })
  id: string;

  @Property({ type: types.text })
  name: string;

  @Property({ type: types.text, lazy: true })
  filename: string;

  @Property({ type: types.string, length: 255 })
  type: string;

  @Property({ type: types.integer })
  size: number;

  @Property({ name: 'url' })
  getUrl() {
    return `/attachments/${this.id}/${this.name}`;
  }

  @ManyToOne({ entity: () => User, joinColumn: 'owner_id' })
  owner: User;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();
}
