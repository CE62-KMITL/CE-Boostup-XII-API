import * as fs from 'fs';

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
    return await this.usersRepository.findAll({
      populate: [
        'bio',
        'group',
        'totalScore',
        'problemSolvedCount',
        'lastProblemSolvedAt',
      ],
    });
  }

  async findOne(
    id: string,
    populate: (keyof User)[] = [
      'bio',
      'group',
      'totalScore',
      'problemSolvedCount',
      'lastProblemSolvedAt',
    ],
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ id }, { populate });
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
      { populate: ['email', 'hashedPassword'] },
    );
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    if (updateUserDto.avatar) {
      const matches = updateUserDto.avatar.match(
        /^data:image\/(png|jpg|jpeg|webp|avif|gif|bmp);base64,((?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?)$/,
      );
      if (matches?.length !== 3) {
        throw new BadRequestException({
          message: 'Invalid base64 image',
          errors: { avatar: 'Invalid base64 image' },
        });
      }
      const [, fileExt, fileData] = matches;
      const filename = `${id}.${fileExt}`;
      if (user.avatarFilename) {
        await fs.promises.unlink(
          `${process.env.AVATARS_STORAGE_LOCATION || '.avatars'}/${user.avatarFilename}`,
        );
      }
      user.avatarFilename = filename;
      await fs.promises.writeFile(
        `${process.env.AVATARS_STORAGE_LOCATION || '.avatars'}/${filename}`,
        fileData,
        'base64',
      );
      delete updateUserDto.avatar;
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
      delete updateUserDto.oldPassword;
      delete updateUserDto.password;
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
      delete updateUserDto.groupId;
    }
    this.usersRepository.assign(user, updateUserDto);
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
