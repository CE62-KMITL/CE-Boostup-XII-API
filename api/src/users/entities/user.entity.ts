import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/mariadb';
import { v4 as uuidv4 } from 'uuid';
import { Group } from '../../groups/entities/group.entity';

@Entity()
export class User {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Property({ type: types.string, length: 255, unique: true, lazy: true })
  email: string;

  @Property({ type: types.string, length: 255, lazy: true })
  hashedPassword: string;

  @Property({ type: types.string, length: 32 })
  displayName: string;

  @Property({ type: types.text })
  bio: string;

  @ManyToOne({ entity: () => Group })
  group: Group;

  @Property({ type: types.datetime })
  createdAt: Date = new Date();

  @Property({ type: types.datetime, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(email: string, displayName: string, group: Group) {
    this.email = email;
    this.displayName = displayName;
    this.group = group;
    this.bio = '';
    this.hashedPassword = '';
  }
}

export class UserResponse {
  id?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  group?: Group;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.displayName = user.displayName;
    this.bio = user.bio;
    this.group = user.group;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
