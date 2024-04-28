import { EntityManager, EntityRepository, wrap } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Group } from '../groups/entities/group.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const emailExists = await this.usersRepository.count({
      email: createUserDto.email,
    });
    if (emailExists) {
      throw new BadRequestException({
        message: 'Email already in use',
        errors: { email: 'Email already in use' },
      });
    }
    const group = await this.em
      .getRepository(Group)
      .findOne({ id: createUserDto.groupId });
    if (!group) {
      throw new BadRequestException({
        message: 'Group not found',
        errors: { groupId: 'Group not found' },
      });
    }
    const user = new User();
    user.displayName = createUserDto.displayName;
    user.email = createUserDto.email;
    user.hashedPassword = '';
    user.group = group;
    await this.em.persistAndFlush(user);
    return this.buildUserResponse(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.findAll();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    if (updateUserDto.avatar) {
      // TODO: Implement avatar upload to local file system
      // Delete the avatar property from the DTO
      delete updateUserDto.avatar;
    }
    if (updateUserDto.password) {
      if (!updateUserDto.oldPassword) {
        throw new BadRequestException({
          message: 'Old password is required',
          errors: { oldPassword: 'Old password is required' },
        });
      }
      if (
        !user.hashedPassword ||
        !(await argon2.verify(user.hashedPassword, updateUserDto.oldPassword))
      ) {
        throw new BadRequestException({
          message: 'Old password is incorrect',
          errors: { oldPassword: 'Old password is incorrect' },
        });
      }
      updateUserDto.hashedPassword = await argon2.hash(updateUserDto.password);
      delete updateUserDto.oldPassword;
      delete updateUserDto.password;
    }
    wrap(user).assign(updateUserDto);
    await this.em.flush();
    return this.buildUserResponse(user);
  }

  async remove(id: string) {
    this.usersRepository.nativeDelete({ id });
    return;
  }

  private buildUserResponse(user: User) {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      group: user.group,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
