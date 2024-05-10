import * as fs from 'fs';
import { join } from 'path';

import {
  EntityManager,
  EntityRepository,
  FilterQuery,
} from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';
import { compareRoles, sortRoles } from 'src/shared/roles';

import { Group } from '../groups/entities/group.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserInternalDto } from './dto/update-user.dto';
import { User, UserResponse } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: EntityRepository<User>,
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.createSuperAdmin();
  }

  async createSuperAdmin(): Promise<void> {
    const superAdmin = await this.usersRepository.findOne(
      { email: this.configService.getOrThrow<string>('auth.superAdminEmail') },
      { populate: ['hashedPassword'] },
    );
    if (!superAdmin) {
      const user = new User(
        this.configService.getOrThrow<string>('auth.superAdminEmail'),
        [Role.SuperAdmin],
        'Super Admin',
      );
      user.hashedPassword = await this.hashPassword(
        this.configService.getOrThrow<string>('auth.superAdminPassword'),
      );
      this.entityManager.persistAndFlush(user);
      return;
    }
    if (!superAdmin.hashedPassword) {
      superAdmin.hashedPassword = await this.hashPassword(
        this.configService.getOrThrow<string>('auth.superAdminPassword'),
      );
      await this.entityManager.flush();
    }
  }

  async create(
    originUser: AuthenticatedRequest['user'],
    createUserDto: CreateUserDto,
  ): Promise<UserResponse> {
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
      .findOne({ id: createUserDto.group });
    if (!group) {
      throw new BadRequestException({
        message: 'Group not found',
        errors: { groupId: 'Group not found' },
      });
    }
    const originUserTopRole =
      sortRoles(originUser.roles)[0] === Role.Reviewer
        ? Role.Staff
        : sortRoles(originUser.roles)[0];
    const creatingUserTopRole = sortRoles(createUserDto.roles)[0];
    if (creatingUserTopRole === Role.SuperAdmin) {
      throw new BadRequestException({
        message: "Super Admin can't be created",
        errors: { roles: "Super Admin can't be created" },
      });
    }
    if (compareRoles(originUserTopRole, creatingUserTopRole) >= 0) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { roles: 'Insufficient permissions' },
      });
    }
    const user = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group,
    );
    await this.entityManager.persistAndFlush(user);
    return new UserResponse(user);
  }

  async findAll(originUser: AuthenticatedRequest['user']): Promise<User[]> {
    const populate: (keyof User)[] = [
      'bio',
      'group',
      'totalScore',
      'problemSolvedCount',
      'lastProblemSolvedAt',
    ];
    if (
      originUser.roles.includes(Role.Admin) ||
      originUser.roles.includes(Role.SuperAdmin)
    ) {
      populate.push('email');
      populate.push('roles');
      populate.push('createdAt');
      populate.push('updatedAt');
    }
    return await this.usersRepository.findAll({ populate });
  }

  async findOne(
    originUser: AuthenticatedRequest['user'],
    id: string,
  ): Promise<User> {
    const populate: (keyof User)[] = [
      'bio',
      'group',
      'totalScore',
      'problemSolvedCount',
      'lastProblemSolvedAt',
    ];
    if (
      originUser.roles.includes(Role.Admin) ||
      originUser.roles.includes(Role.SuperAdmin)
    ) {
      populate.push('email');
      populate.push('roles');
      populate.push('lastEmailRequestedAt');
      populate.push('createdAt');
      populate.push('updatedAt');
    }
    const user = await this.usersRepository.findOne({ id }, { populate });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    return user;
  }

  async findOneInternal(
    where: FilterQuery<User>,
    populate: (keyof User)[] = [],
  ): Promise<User> {
    const user = await this.usersRepository.findOne(where, { populate });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { where: 'User not found' },
      });
    }
    return user;
  }

  async update(
    originUser: AuthenticatedRequest['user'],
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    if (
      id !== originUser.id &&
      !originUser.roles.includes(Role.SuperAdmin) &&
      !originUser.roles.includes(Role.Admin)
    ) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
      });
    }
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
    if (updateUserDto.group) {
      if (
        !originUser.roles.includes(Role.SuperAdmin) &&
        !originUser.roles.includes(Role.Admin)
      ) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { id: 'Insufficient permissions' },
        });
      }
      const group = await this.entityManager
        .getRepository(Group)
        .findOne({ id: updateUserDto.group });
      if (!group) {
        throw new BadRequestException({
          message: 'Group not found',
          errors: { groupId: 'Group not found' },
        });
      }
      user.group = group;
      delete updateUserDto.group;
    }
    if (id !== originUser.id) {
      await this.entityManager.flush();
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
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
          join(
            this.configService.getOrThrow<string>('storages.avatars.path'),
            user.avatarFilename,
          ),
        );
      }
      user.avatarFilename = filename;
      await fs.promises.writeFile(
        join(
          this.configService.getOrThrow<string>('storages.avatars.path'),
          filename,
        ),
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
      user.hashedPassword = await this.hashPassword(updateUserDto.password);
      delete updateUserDto.oldPassword;
      delete updateUserDto.password;
    }
    this.usersRepository.assign(user, updateUserDto);
    await this.entityManager.flush();
    return new UserResponse(user);
  }

  async updateInternal(
    where: FilterQuery<User>,
    data: UpdateUserInternalDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne(where);
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { where: 'User not found' },
      });
    }
    this.usersRepository.assign(user, data);
    await this.entityManager.flush();
    return user;
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

  async removeInternal(where: FilterQuery<User>): Promise<void> {
    const user = await this.usersRepository.findOne(where);
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { where: 'User not found' },
      });
    }
    await this.entityManager.removeAndFlush(user);
    return;
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async validatePassword(email: string, password: string): Promise<User> {
    const user = await this.usersRepository.findOne(
      { email },
      { populate: ['hashedPassword', 'roles'] },
    );
    if (!user) {
      throw new BadRequestException({
        message: 'Invalid email or password',
        errors: {
          email: 'Potentially invalid email',
          password: 'Potentially invalid password',
        },
      });
    }
    if (!(await argon2.verify(user.hashedPassword, password))) {
      throw new BadRequestException({
        message: 'Invalid email or password',
        errors: {
          email: 'Potentially invalid email',
          password: 'Potentially invalid password',
        },
      });
    }
    if (argon2.needsRehash(user.hashedPassword)) {
      await this.updateInternal(
        { id: user.id },
        { hashedPassword: await this.hashPassword(password) },
      );
    }
    return user;
  }
}
