import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
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
import { User, UserResponse } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: EntityRepository<User>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const emailExists = await this.usersRepository.count({
      email: createUserDto.email,
    });
    if (emailExists) {
      throw new BadRequestException({
        message: 'Email already in use',
        errors: { email: 'Email already in use' },
      });
    }
    const group = await this.entityManager
      .getRepository(Group)
      .findOne({ id: createUserDto.groupId });
    if (!group) {
      throw new BadRequestException({
        message: 'Group not found',
        errors: { groupId: 'Group not found' },
      });
    }
    const user = new User(
      createUserDto.email,
      createUserDto.displayName,
      group,
    );
    await this.entityManager.persistAndFlush(user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.findAll({ populate: ['group'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne(
      { id },
      { populate: ['group'] },
    );
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const user = await this.usersRepository.findOne(
      { id },
      { populate: ['email', 'hashedPassword', 'group'] },
    );
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    if (updateUserDto.avatar) {
      // TODO: Implement avatar upload to local file system
      // Delete the avatar property from the DTO
    }
    if (updateUserDto.password) {
      if (!updateUserDto.oldPassword) {
        throw new BadRequestException({
          message: 'Old password is required when changing password',
          errors: { oldPassword: 'Old password is required changing password' },
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
      user.hashedPassword = await argon2.hash(updateUserDto.password);
    }
    if (updateUserDto.groupId) {
      const group = await this.entityManager
        .getRepository(Group)
        .findOne({ id: updateUserDto.groupId });
      if (!group) {
        throw new BadRequestException({
          message: 'Group not found',
          errors: { groupId: 'Group not found' },
        });
      }
      user.group = group;
    }
    this.usersRepository.assign(user, {
      displayName: updateUserDto.displayName,
      email: updateUserDto.email,
      bio: updateUserDto.bio,
    });
    await this.entityManager.flush();
    return new UserResponse(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    await this.entityManager.removeAndFlush(user);
    return;
  }
}
