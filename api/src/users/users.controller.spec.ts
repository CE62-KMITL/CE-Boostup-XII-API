 
import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { CreateUserDto } from './dto/create-user.dto';
import { Group, GroupResponse } from '../groups/entities/group.entity';
import { User, UserResponse } from './entities/user.entity';
import { Role } from '../shared/enums/role.enum';
import { AuthenticatedRequest, AuthenticatedUser } from '../shared/interfaces/authenticated-request.interface';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isSomeRolesIn, isRolesHigher } from '../auth/roles';

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
            usersRepository: {
              count: jest.fn(),
            },
            entityManager: {
              persistAndFlush: jest.fn(),
              getRepository: jest.fn().mockReturnValue({
                findOne: jest.fn(),
              }),
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
});