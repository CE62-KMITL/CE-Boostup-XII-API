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
import { isRolesHigher, isSomeRolesIn } from 'src/auth/roles';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';
import { parseSort } from 'src/shared/parse-sort';

import { Group } from '../groups/entities/group.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { FindAllDto } from './dto/find-all.dto';
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

  onModuleInit(): void {
    this.createSuperAdmin();
    this.createAvatarDirectory();
  }

  async createSuperAdmin(): Promise<void> {
    const em = this.entityManager.fork();
    const superAdmin = await em.getRepository(User).findOne(
      {
        email: this.configService.getOrThrow<string>('auth.superAdminEmail'),
      },
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
      em.persistAndFlush(user);
      return;
    }
    if (!superAdmin.hashedPassword) {
      superAdmin.hashedPassword = await this.hashPassword(
        this.configService.getOrThrow<string>('auth.superAdminPassword'),
      );
      await em.flush();
    }
  }

  async createAvatarDirectory(): Promise<void> {
    const avatarsPath = this.configService.getOrThrow<string>(
      'storages.avatars.path',
    );
    try {
      await fs.promises.access(avatarsPath);
    } catch (error) {
      await fs.promises.mkdir(avatarsPath, { recursive: true });
    }
  }

  async create(
    originUser: AuthenticatedUser,
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
    if (!isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { roles: 'Insufficient permissions' },
      });
    }
    if (!isRolesHigher(originUser.roles, createUserDto.roles)) {
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

  async findAll(
    originUser: AuthenticatedUser,
    findAllDto: FindAllDto,
  ): Promise<PaginatedResponse<UserResponse>> {
    const where: FilterQuery<User> = {};
    if (findAllDto.group !== undefined) {
      where.group = findAllDto.group;
    }
    if (findAllDto.roles) {
      where.$and = [];
      for (const role of findAllDto.roles.split(',')) {
        where.$and.push({ roles: { $like: `%${role}%` } });
      }
    }
    const offset: number = (findAllDto.page - 1) * findAllDto.perPage;
    const limit: number = findAllDto.perPage;
    let orderBy: Record<string, 'asc' | 'desc'> | null = null;
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = [
        'email',
        'roles',
        'bio',
        'group',
        'totalScore',
        'totalScoreOffset',
        'problemSolvedCount',
        'lastProblemSolvedAt',
        'createdAt',
        'updatedAt',
      ] as const;
      if (findAllDto.search) {
        where.$or = [
          { displayName: { $like: `%${findAllDto.search}%` } },
          { email: { $like: `%${findAllDto.search}%` } },
        ];
      }
      if (findAllDto.sort) {
        orderBy = parseSort(findAllDto.sort, [
          'email',
          'displayName',
          'bio',
          'totalScore',
          'problemSolvedCount',
          'lastProblemSolvedAt',
          'createdAt',
          'updatedAt',
        ]);
      }
      if (orderBy) {
        const [users, count] = await this.usersRepository.findAndCount(where, {
          populate,
          offset,
          limit,
          orderBy,
        });
        return {
          data: users.map((user) => new UserResponse(user)),
          page: findAllDto.page,
          perPage: findAllDto.perPage,
          total: count,
        };
      }
      const [users, count] = await this.usersRepository.findAndCount(where, {
        populate,
        offset,
        limit,
      });
      return {
        data: users.map((user) => new UserResponse(user)),
        page: findAllDto.page,
        perPage: findAllDto.perPage,
        total: count,
      };
    }
    const populate = [
      'bio',
      'group',
      'totalScore',
      'problemSolvedCount',
      'lastProblemSolvedAt',
    ] as const;
    if (findAllDto.search) {
      where.$or = [{ displayName: { $like: `%${findAllDto.search}%` } }];
    }
    if (findAllDto.sort) {
      orderBy = parseSort(findAllDto.sort, [
        'displayName',
        'bio',
        'totalScore',
        'problemSolvedCount',
        'lastProblemSolvedAt',
      ]);
    }
    if (orderBy) {
      const [users, count] = await this.usersRepository.findAndCount(where, {
        populate,
        offset,
        limit,
        orderBy,
      });
      return {
        data: users.map((user) => new UserResponse(user)),
        page: findAllDto.page,
        perPage: findAllDto.perPage,
        total: count,
      };
    }
    const [users, count] = await this.usersRepository.findAndCount(where, {
      populate,
      offset,
      limit,
    });
    return {
      data: users.map((user) => new UserResponse(user)),
      page: findAllDto.page,
      perPage: findAllDto.perPage,
      total: count,
    };
  }

  async findOne(
    originUser: AuthenticatedUser,
    id: string,
  ): Promise<UserResponse> {
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = [
        'email',
        'roles',
        'bio',
        'group',
        'totalScore',
        'totalScoreOffset',
        'problemSolvedCount',
        'lastProblemSolvedAt',
        'lastEmailRequestedAt',
        'createdAt',
        'updatedAt',
      ] as const;
      const user = await this.usersRepository.findOne({ id }, { populate });
      if (!user) {
        throw new NotFoundException({
          message: 'User not found',
          errors: { id: 'User not found' },
        });
      }
      return new UserResponse(user);
    }
    const populate = [
      'bio',
      'group',
      'totalScore',
      'problemSolvedCount',
      'lastProblemSolvedAt',
      'createdAt',
      'updatedAt',
    ] as const;
    const user = await this.usersRepository.findOne({ id }, { populate });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    return new UserResponse(user);
  }

  async findOneInternal(where: FilterQuery<User>): Promise<User> {
    const user = await this.usersRepository.findOne(where, {
      populate: [
        'email',
        'roles',
        'hashedPassword',
        'bio',
        'totalScoreOffset',
        'unlockedHints',
        'lastEmailRequestedAt',
        'avatarFilename',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { where: 'User not found' },
      });
    }
    return user;
  }

  async update(
    originUser: AuthenticatedUser,
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const user = await this.findOneInternal({ id });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    if (updateUserDto.group) {
      if (!isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
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
    if (
      id !== originUser.id &&
      !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
    ) {
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
    Object.assign(user, updateUserDto);
    await this.entityManager.flush();
    return await this.findOne(originUser, id);
  }

  async updateInternal(
    where: FilterQuery<User>,
    data: UpdateUserInternalDto,
  ): Promise<User> {
    const user = await this.findOneInternal(where);
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { where: 'User not found' },
      });
    }
    Object.assign(user, data);
    await this.entityManager.flush();
    return user;
  }

  async remove(originUser: AuthenticatedUser, id: string): Promise<void> {
    const user = await this.findOneInternal({ id });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: { id: 'User not found' },
      });
    }
    if (!isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
      });
    }
    if (!isRolesHigher(originUser.roles, user.roles)) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
      });
    }
    await this.entityManager.removeAndFlush(user);
    return;
  }

  async removeInternal(where: FilterQuery<User>): Promise<void> {
    const user = await this.findOneInternal(where);
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
    const user = await this.findOneInternal({ email });
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
