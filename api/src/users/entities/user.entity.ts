import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/mariadb';
import { v4 as uuidv4 } from 'uuid';
import { Group } from '../../groups/entities/group.entity';

@Entity()
export class User {
  @PrimaryKey()
  id: string = uuidv4();

  @Property()
  email: string;

  @Property()
  hashedPassword: string;

  @Property()
  displayName: string;

  @ManyToOne(() => Group)
  group: Group;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
