import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { User } from '../../users/entities/user.entity';

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

  @Property({ persist: false })
  get url(): string {
    return `/attachments/${this.id}/${this.name}`;
  }

  @ManyToOne({ entity: () => User, joinColumn: 'owner_id' })
  owner: User;

  @Property({ type: types.datetime, lazy: true })
  createdAt: Date = new Date();
}

export class AttachmentResponse {
  id: string;
  name?: string;
  type?: string;
  size?: number;
  url?: string;
  owner?: {
    id: string;
    displayName: string;
  };
  createdAt?: Date;

  constructor(attachment: Attachment) {
    this.id = attachment.id;
    this.name = attachment.name;
    this.type = attachment.type;
    this.size = attachment.size;
    this.url = attachment.url;
    this.owner = attachment.owner
      ? { id: attachment.owner.id, displayName: attachment.owner.displayName }
      : undefined;
    this.createdAt = attachment.createdAt;
  }
}
