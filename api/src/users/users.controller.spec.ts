 
import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { CreateUserDto } from './dto/create-user.dto';
import { Group, GroupResponse } from '../groups/entities/group.entity';
import { User, UserResponse } from './entities/user.entity';
import { Role } from '../shared/enums/role.enum';
import { AuthenticatedRequest, AuthenticatedUser } from '../shared/interfaces/authenticated-request.interface';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { isSomeRolesIn, isRolesHigher } from '../auth/roles';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';
import { join } from 'path';
import * as fs from 'fs';

const moduleMocker = new ModuleMocker(global);

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
    })
      .useMocker((token) => {
        if (token === UsersService) {
          return {
            create: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            findOneInternal: jest.fn(),
            update: jest.fn(),
            findAll: jest.fn(),
            hashPassword: jest.fn(),
            usersRepository: {
              count: jest.fn(),
              findOne: jest.fn()
            },
            entityManager: {
              persistAndFlush: jest.fn(),
              getRepository: jest.fn().mockReturnValue({
                findOne: jest.fn(),
              }),
              removeAndFlush: jest.fn()
            },
            configService: {
              getOrThrow: jest.fn().mockReturnValue('/path/to/avatars'),
            },
          };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get<UsersController>(UsersController);
    service = moduleRef.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  //create

  it('should create and return a user', async () => {
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id,
    };

    const user0 = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    );

    const group_res: GroupResponse = new GroupResponse(group_);
    const userRes = new UserResponse(user0);

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);

    jest.spyOn(service, 'create').mockImplementation(async (originUser = mockAuthenticatedReq.user, dto = createUserDto) => {
      const emailExists = await service['usersRepository'].count({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException({
          message: 'Email already in use',
          errors: { email: 'Email already in use' },
        });
      }
      const group = await service['entityManager'].getRepository(Group).findOne({ id: dto.group });
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
      if (!isRolesHigher(originUser.roles, dto.roles)) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { roles: 'Insufficient permissions' },
        });
      }
      const user = new User(
        dto.email,
        dto.roles,
        dto.displayName,
        group,
      );

      user.id = user0.id;
      user.createdAt = user0.createdAt;
      user.updatedAt = user0.updatedAt;

      await service['entityManager'].persistAndFlush(user);
      return new UserResponse(user);
    });

    const result = await controller.create(mockAuthenticatedReq, createUserDto);

    expect(result).toEqual(userRes);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);
  });

  it('should throw Email already in use', async () => {
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id,
    };

    const user0 = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    );

    const group_res: GroupResponse = new GroupResponse(group_);
    const userRes = new UserResponse(user0);

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(1);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);

    jest.spyOn(service, 'create').mockImplementation(async (originUser = mockAuthenticatedReq.user, dto = createUserDto) => {
      const emailExists = await service['usersRepository'].count({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException({
          message: 'Email already in use',
          errors: { email: 'Email already in use' },
        });
      }
      const group = await service['entityManager'].getRepository(Group).findOne({ id: dto.group });
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
      if (!isRolesHigher(originUser.roles, dto.roles)) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { roles: 'Insufficient permissions' },
        });
      }
      const user = new User(
        dto.email,
        dto.roles,
        dto.displayName,
        group,
      );

      user.id = user0.id;
      user.createdAt = user0.createdAt;
      user.updatedAt = user0.updatedAt;

      await service['entityManager'].persistAndFlush(user);
      return new UserResponse(user);
    });


    expect(async () => {
      await controller.create(mockAuthenticatedReq, createUserDto);
    }).rejects.toThrow(BadRequestException);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);
  });

  it('should throw Group not found', async () => {
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id,
    };

    const user0 = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    );

    const group_res: GroupResponse = new GroupResponse(group_);
    const userRes = new UserResponse(user0);

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(0);

    jest.spyOn(service, 'create').mockImplementation(async (originUser = mockAuthenticatedReq.user, dto = createUserDto) => {
      const emailExists = await service['usersRepository'].count({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException({
          message: 'Email already in use',
          errors: { email: 'Email already in use' },
        });
      }
      const group = await service['entityManager'].getRepository(Group).findOne({ id: dto.group });
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
      if (!isRolesHigher(originUser.roles, dto.roles)) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { roles: 'Insufficient permissions' },
        });
      }
      const user = new User(
        dto.email,
        dto.roles,
        dto.displayName,
        group,
      );

      user.id = user0.id;
      user.createdAt = user0.createdAt;
      user.updatedAt = user0.updatedAt;

      await service['entityManager'].persistAndFlush(user);
      return new UserResponse(user);
    });

    expect(async () => {
      await controller.create(mockAuthenticatedReq, createUserDto);
    }).rejects.toThrow(BadRequestException);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);
  });

  it('should throw forbidden exception', async () => {
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.User],
    };

    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id,
    };

    const user0 = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    );

    const group_res: GroupResponse = new GroupResponse(group_);
    const userRes = new UserResponse(user0);

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);

    jest.spyOn(service, 'create').mockImplementation(async (originUser = mockAuthenticatedReq.user, dto = createUserDto) => {
      const emailExists = await service['usersRepository'].count({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException({
          message: 'Email already in use',
          errors: { email: 'Email already in use' },
        });
      }
      const group = await service['entityManager'].getRepository(Group).findOne({ id: dto.group });
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
      if (!isRolesHigher(originUser.roles, dto.roles)) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { roles: 'Insufficient permissions' },
        });
      }
      const user = new User(
        dto.email,
        dto.roles,
        dto.displayName,
        group,
      );

      user.id = user0.id;
      user.createdAt = user0.createdAt;
      user.updatedAt = user0.updatedAt;

      await service['entityManager'].persistAndFlush(user);
      return new UserResponse(user);
    });

    expect(async () => {
      await controller.create(mockAuthenticatedReq, createUserDto);
    }).rejects.toThrow(ForbiddenException);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);
  });

  //remove

  it('should remove user', async () => {
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id,
    };

    const user0 = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    );

    const group_res: GroupResponse = new GroupResponse(group_);
    const userRes = new UserResponse(user0);

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);

    jest.spyOn(service, 'create').mockImplementation(async (originUser = mockAuthenticatedReq.user, dto = createUserDto) => {
      const emailExists = await service['usersRepository'].count({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException({
          message: 'Email already in use',
          errors: { email: 'Email already in use' },
        });
      }
      const group = await service['entityManager'].getRepository(Group).findOne({ id: dto.group });
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
      if (!isRolesHigher(originUser.roles, dto.roles)) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { roles: 'Insufficient permissions' },
        });
      }
      const user = new User(
        dto.email,
        dto.roles,
        dto.displayName,
        group,
      );

      user.id = user0.id;
      user.createdAt = user0.createdAt;
      user.updatedAt = user0.updatedAt;

      await service['entityManager'].persistAndFlush(user);
      return new UserResponse(user);
    });

    const result = await controller.create(mockAuthenticatedReq, createUserDto);

    expect(result).toEqual(userRes);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);

    jest.spyOn(service, 'findOneInternal').mockResolvedValue(user0);
    jest.spyOn(service, 'remove').mockImplementation( async (originUser = mockAuthenticatedReq.user, id = userRes.id) => {
      const user = await service.findOneInternal({ id });
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
    await service['entityManager'].removeAndFlush(user);
    return;
    })

    const last_result = await controller.remove(mockAuthenticatedReq, userRes.id);

    expect(last_result).toEqual(undefined);
    expect(service.remove).toHaveBeenCalledWith(authenticatedUser, userRes.id);

  });

  it('should throw NotFoundException : remove', async () => {
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id,
    };

    const user0 = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    );

    const group_res: GroupResponse = new GroupResponse(group_);
    const userRes = new UserResponse(user0);

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);

    jest.spyOn(service, 'create').mockImplementation(async (originUser = mockAuthenticatedReq.user, dto = createUserDto) => {
      const emailExists = await service['usersRepository'].count({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException({
          message: 'Email already in use',
          errors: { email: 'Email already in use' },
        });
      }
      const group = await service['entityManager'].getRepository(Group).findOne({ id: dto.group });
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
      if (!isRolesHigher(originUser.roles, dto.roles)) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { roles: 'Insufficient permissions' },
        });
      }
      const user = new User(
        dto.email,
        dto.roles,
        dto.displayName,
        group,
      );

      user.id = user0.id;
      user.createdAt = user0.createdAt;
      user.updatedAt = user0.updatedAt;

      await service['entityManager'].persistAndFlush(user);
      return new UserResponse(user);
    });

    const result = await controller.create(mockAuthenticatedReq, createUserDto);

    expect(result).toEqual(userRes);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);

    jest.spyOn(service['usersRepository'], 'findOne').mockResolvedValue(0);
    jest.spyOn(service, 'findOneInternal').mockImplementation( async ( where ) => {
      const user = await service['usersRepository'].findOne(where, {
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
    });

    jest.spyOn(service, 'remove').mockImplementation( async (originUser = mockAuthenticatedReq.user, id = userRes.id) => {
      const user = await service.findOneInternal({ id });
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
    await service['entityManager'].removeAndFlush(user);
    return;
    })

    expect(async () => {
      await controller.remove(mockAuthenticatedReq, userRes.id);
    }).rejects.toThrow(NotFoundException);
    expect(service.remove).toHaveBeenCalledWith(authenticatedUser, userRes.id);

  });

  it('should throw ForbiddenException : remove', async () => {
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    const authenticatedUser_: AuthenticatedUser = {
      id: '0',
      roles: [Role.User],
    };

    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id,
    };

    const user0 = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    );

    const group_res: GroupResponse = new GroupResponse(group_);
    const userRes = new UserResponse(user0);

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    const mockAuthenticatedReq_: AuthenticatedRequest = {
      user: authenticatedUser_,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);

    jest.spyOn(service, 'create').mockImplementation(async (originUser = mockAuthenticatedReq.user, dto = createUserDto) => {
      const emailExists = await service['usersRepository'].count({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException({
          message: 'Email already in use',
          errors: { email: 'Email already in use' },
        });
      }
      const group = await service['entityManager'].getRepository(Group).findOne({ id: dto.group });
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
      if (!isRolesHigher(originUser.roles, dto.roles)) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { roles: 'Insufficient permissions' },
        });
      }
      const user = new User(
        dto.email,
        dto.roles,
        dto.displayName,
        group,
      );

      user.id = user0.id;
      user.createdAt = user0.createdAt;
      user.updatedAt = user0.updatedAt;

      await service['entityManager'].persistAndFlush(user);
      return new UserResponse(user);
    });

    const result = await controller.create(mockAuthenticatedReq, createUserDto);

    expect(result).toEqual(userRes);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);

    jest.spyOn(service, 'findOneInternal').mockResolvedValue(user0);
    jest.spyOn(service, 'remove').mockImplementation( async (originUser = mockAuthenticatedReq.user, id = userRes.id) => {
      const user = await service.findOneInternal({ id });
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
    await service['entityManager'].removeAndFlush(user);
    return;
    })

    expect(async () => {
      await controller.remove(mockAuthenticatedReq_, userRes.id);
    }).rejects.toThrow(ForbiddenException);
    expect(service.remove).toHaveBeenCalledWith(authenticatedUser_, userRes.id);

  });

  //findOne

  it('should call findOne and return UserResponse', async () => {
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id,
    };

    const user0 = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    );

    const group_res: GroupResponse = new GroupResponse(group_);
    const userRes = new UserResponse(user0);

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);

    jest.spyOn(service, 'create').mockImplementation(async (originUser = mockAuthenticatedReq.user, dto = createUserDto) => {
      const emailExists = await service['usersRepository'].count({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException({
          message: 'Email already in use',
          errors: { email: 'Email already in use' },
        });
      }
      const group = await service['entityManager'].getRepository(Group).findOne({ id: dto.group });
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
      if (!isRolesHigher(originUser.roles, dto.roles)) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { roles: 'Insufficient permissions' },
        });
      }
      const user = new User(
        dto.email,
        dto.roles,
        dto.displayName,
        group,
      );

      user.id = user0.id;
      user.createdAt = user0.createdAt;
      user.updatedAt = user0.updatedAt;

      await service['entityManager'].persistAndFlush(user);
      return new UserResponse(user);
    });

    const result = await controller.create(mockAuthenticatedReq, createUserDto);

    expect(result).toEqual(userRes);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);

    jest.spyOn(service['usersRepository'], 'findOne').mockResolvedValue(user0);
    jest.spyOn(service, 'findOne').mockImplementation( async (originUser = mockAuthenticatedReq.user, id = userRes.id) => {
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
        const user = await service['usersRepository'].findOne({ id }, { populate });
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
      const user = await service['usersRepository'].findOne({ id }, { populate });
      if (!user) {
        throw new NotFoundException({
          message: 'User not found',
          errors: { id: 'User not found' },
        });
      }
      return new UserResponse(user);
    });

    const last_result = await controller.findOne(mockAuthenticatedReq, userRes.id);

    expect(last_result).toEqual(userRes);
    expect(service.findOne).toHaveBeenCalledWith(authenticatedUser, userRes.id);

  });

  it('should call findOne and throw NotFoundException', async () => {
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id,
    };

    const user0 = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    );

    const group_res: GroupResponse = new GroupResponse(group_);
    const userRes = new UserResponse(user0);

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);

    jest.spyOn(service, 'create').mockImplementation(async (originUser = mockAuthenticatedReq.user, dto = createUserDto) => {
      const emailExists = await service['usersRepository'].count({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException({
          message: 'Email already in use',
          errors: { email: 'Email already in use' },
        });
      }
      const group = await service['entityManager'].getRepository(Group).findOne({ id: dto.group });
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
      if (!isRolesHigher(originUser.roles, dto.roles)) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { roles: 'Insufficient permissions' },
        });
      }
      const user = new User(
        dto.email,
        dto.roles,
        dto.displayName,
        group,
      );

      user.id = user0.id;
      user.createdAt = user0.createdAt;
      user.updatedAt = user0.updatedAt;

      await service['entityManager'].persistAndFlush(user);
      return new UserResponse(user);
    });

    const result = await controller.create(mockAuthenticatedReq, createUserDto);

    expect(result).toEqual(userRes);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);

    jest.spyOn(service['usersRepository'], 'findOne').mockResolvedValue(0);
    jest.spyOn(service, 'findOne').mockImplementation( async (originUser = mockAuthenticatedReq.user, id = userRes.id) => {
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
        const user = await service['usersRepository'].findOne({ id }, { populate });
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
      const user = await service['usersRepository'].findOne({ id }, { populate });
      if (!user) {
        throw new NotFoundException({
          message: 'User not found',
          errors: { id: 'User not found' },
        });
      }
      return new UserResponse(user);
    });

    expect(async () => {
      await controller.findOne(mockAuthenticatedReq, userRes.id);
    }).rejects.toThrow(NotFoundException);
    expect(service.findOne).toHaveBeenCalledWith(authenticatedUser, userRes.id);

  });

  //update

  it('should create and return a user', async () => {
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.SuperAdmin],
    };

    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id,
    };
    
    const password: string = 'P@ssw0rd!234f'

    const user0 = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    );

    user0.hashedPassword = await argon2.hash(password);

    const group_res: GroupResponse = new GroupResponse(group_);
    const userRes = new UserResponse(user0);

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);

    jest.spyOn(service, 'create').mockImplementation(async (originUser = mockAuthenticatedReq.user, dto = createUserDto) => {
      const emailExists = await service['usersRepository'].count({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException({
          message: 'Email already in use',
          errors: { email: 'Email already in use' },
        });
      }
      const group = await service['entityManager'].getRepository(Group).findOne({ id: dto.group });
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
      if (!isRolesHigher(originUser.roles, dto.roles)) {
        throw new ForbiddenException({
          message: 'Insufficient permissions',
          errors: { roles: 'Insufficient permissions' },
        });
      }
      const user = new User(
        dto.email,
        dto.roles,
        dto.displayName,
        group,
      );

      user.id = user0.id;
      user.createdAt = user0.createdAt;
      user.updatedAt = user0.updatedAt;

      await service['entityManager'].persistAndFlush(user);
      return new UserResponse(user);
    });

    const result = await controller.create(mockAuthenticatedReq, createUserDto);

    expect(result).toEqual(userRes);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);

    const updateUserDto: UpdateUserDto = {
      bio: 'rfjyhbefb ihjdn',
      displayName: 'Kangaroo',
      email: 'bigD123@example.com',
      avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAC/klEQVQ4y4WTXUxbZRzGf+/p6aErHyudNJQKBsaQijKnN1vi/EZ08wKNYZkxcZF4w3DRmGjiMk0wkt0YZ7hwJsSAH7twGkzMwo1GXMjcIlMKq1uZJWEFy4AU2pVCz3nP+3pBsrjM6O/un+ef57l5HvT/oZS+fCWppZT/Kpv8B0ODX/DCvha+/T5Bem0aNLz/+m4qA4GbP0JrrQFs28ayLABmk5PI5WlsV1PXuB2A3s8XEVY5Wmv2Nps8274bAAPg+kKaTOoC+esX+eXyDOl1L/NL68Tm7JtJLf4p3tiv2BbeRnylgonxMQBMAKWhoryUZMaHKObwj7+NdGsov+Nhro19SUnuLA/5YfYPL23hWi5dukJd6IlNA6UUf549xcy5UWqjLUTkGRCCkEjjpIoY5hSOECgNVlASqQ1THQ6hNEwmZjEGuttZW17kwQOHqFwYxlm1WVuPsOLeT1XL4zhZG2e1SH61jGDDTvx+H6bpwXVdkiqE8VfgXj4dmeRY3wCsbSBvbCDLouQKJThFe/O+UaTQ+ByWz+KlV44yODSMEGBaPoyyXR24SrPUUMVkcw+yKPEkvia4MIL6sQ+54SI3HErPn+DiR4dZjlTS0fEkA4PfYWfmMHLFecZ3NOKrCBBLxfhwy2MoCa6EoWgX/a2HiJfuZDjdxMtb2qm7swb7wjvE7/KTtQuIxMxVffDkcU5HJ4hlq/lA3YevTIFTgdcC4RjYWmNLhyPFCeqNRabtMF+FdvHeA22YTfWNOKEw9sp57vHM8oi1h+ZgJSeuXmOPWqc+P4dXCe72LlFu5LEoEJUZns6WsLfr6GYPRl7s5mT/PBEjz7uHn8L0eGj47TO+kU0EhUOMKqKrcVJGNb1Vz2D5DU7t77y1yiM/j/La2A9I5dBrTXHMbsVrClwXTMPkp842YskUR35N8OaOKN0HDt5qAJDNZWn9uA+vaXA8M8pbgUfRSoAADwZKa8Ze7aGmOnz7mP5JoVDgk+HT9Md/RxgeurY30/N8J4GtW29b7N+AcIVs/VCRxQAAAABJRU5ErkJggg==',
      password: 'P@ssw0rd!234',
      oldPassword: 'P@ssw0rd!234f'
    }
    service['entityManager'].flush = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(service, 'findOneInternal').mockResolvedValue(user0);
    jest.spyOn(service['usersRepository'], 'findOne').mockResolvedValue(user0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);
    jest.spyOn(service, 'findOne').mockImplementation( async (originUser, id) => {
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
        const user = await service['usersRepository'].findOne({ id }, { populate });
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
      const user = await service['usersRepository'].findOne({ id }, { populate });
      if (!user) {
        throw new NotFoundException({
          message: 'User not found',
          errors: { id: 'User not found' },
        });
      }
      return new UserResponse(user);
    })
    jest.spyOn(service, 'hashPassword').mockImplementation( async ( password: string ) => {
      return argon2.hash(password);
    })
    jest.spyOn(service, 'update').mockImplementation( async (originUser: AuthenticatedUser = mockAuthenticatedReq.user , id: string = user0.id, updateDto: UpdateUserDto = updateUserDto) => {
      const user = await service.findOneInternal({ id });
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
        const group = await service['entityManager'].getRepository(Group).findOne({ id: updateDto.group });
        if (!group) {
          throw new BadRequestException({
            message: 'Group not found',
            errors: { groupId: 'Group not found' },
          });
        }
        user.group = group;
        delete updateUserDto.group;
      }
      if (id !== originUser.id && !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
      ) {
        await service['entityManager'].flush();
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
        user.avatarFilename = filename;

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
        user.hashedPassword = await service.hashPassword(updateUserDto.password);
        delete updateUserDto.oldPassword;
        delete updateUserDto.password;
      }
      Object.assign(user, updateUserDto);
      await service['entityManager'].flush();
      return await service.findOne(originUser, id);
    })
    userRes.bio = updateUserDto.bio;
    userRes.displayName = updateUserDto.displayName;
    userRes.email = updateUserDto.email;

    const last_result = await controller.update(mockAuthenticatedReq, user0.id, updateUserDto);
    expect(last_result.bio).toEqual(updateUserDto.bio);
    expect(last_result.displayName).toEqual(updateUserDto.displayName);
    expect(last_result.email).toEqual(updateUserDto.email);


  });

});