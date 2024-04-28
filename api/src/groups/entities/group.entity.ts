import {
  Collection,
  Entity,
  Formula,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/mariadb';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Group {
  @PrimaryKey()
  id: string = uuidv4();

  @Property()
  name: string;

  @Property()
  description: string;

  @OneToMany(() => User, (user) => user.group)
  members: Collection<User, object> = new Collection<User>(this);

  @Formula(
    (alias) =>
      `(SELECT COUNT(*) FROM \`user\` WHERE \`user\`.\`group_id\` = ${alias}.\`id\`)`,
  )
  memberCount?: number;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
