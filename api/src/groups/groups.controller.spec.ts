import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { Group, GroupResponse } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { BadRequestException, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Role } from '../shared/enums/role.enum';
import { AuthenticatedRequest, AuthenticatedUser } from '../shared/interfaces/authenticated-request.interface';
import { RolesGuard } from '../auth/roles.guard';
import { Reflector } from '@nestjs/core';
import { v4 as uuidv4 } from 'uuid';
import { isSomeRolesIn } from '../auth/roles';


const moduleMocker = new ModuleMocker(global);

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: GroupsService;

  const mockRolesGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      request.user = {
        id: '0',
        roles: [Role.Admin]
      };
      return true;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        Reflector,
        { provide: RolesGuard, useValue: mockRolesGuard },
      ],
    })
      .useMocker((token) => {
        if (token === GroupsService) {
          return {
            create: jest.fn(),
            findOne: jest.fn(),
            groupsRepository: {
              count: jest.fn(),
              findOne: jest.fn()
            },
            entityManager: {
              persistAndFlush: jest.fn(),
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

    controller = module.get<GroupsController>(GroupsController);
    service = module.get<GroupsService>(GroupsService);
  });

  it('controller should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should allow access for Admin role', async () => {
    mockRolesGuard.canActivate.mockImplementation((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      request.user = {
        id: '0',
        roles: [Role.Admin],
      };
      return true;
    });

    const createGroup: CreateGroupDto = {
      name: 'NewGroup',
      description: 'A new group description.',
    };

    const group: Group = new Group();
    group.name = createGroup.name;
    group.description = createGroup.description;

    const groupRes: GroupResponse = new GroupResponse(group);

    jest.spyOn(service, 'create').mockResolvedValue(groupRes);
    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(0);

    const result = await controller.create(createGroup);

    expect(result).toEqual(groupRes);
    expect(service.create).toHaveBeenCalledWith(createGroup);
  });

  it('should throw BadRequestException when name already exists', async () => {
    const createGroup: CreateGroupDto = {
      name: 'ExistingGroup',
      description: 'A group description.',
    };

    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(1);
    jest.spyOn(service, 'create').mockImplementation(async (dto) => {
      const nameExists = await service['groupsRepository'].count({ name: dto.name });
      if (nameExists) {
        throw new BadRequestException({
          message: 'Group name already in use',
          errors: { name: 'Group name already in use' },
        });
      }
      const group = new Group();
      group.name = dto.name;
      group.description = dto.description;
      await service['entityManager'].persistAndFlush(group);
      return new GroupResponse(group);
    });

    await expect(controller.create(createGroup)).rejects.toThrow(BadRequestException);
    expect(service.create).toHaveBeenCalledWith(createGroup);
  });

  it('should allow access for Admin and SuperAdmin role to call findOne', async () => {

    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    const createGroup: CreateGroupDto = {
      name: 'NewGroup',
      description: 'A new group description.',
    };

    const group: Group = new Group();
    group.name = createGroup.name;
    group.description = createGroup.description;

    const groupRes: GroupResponse = new GroupResponse(group);

    jest.spyOn(service, 'create').mockResolvedValue(groupRes);
    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service, 'findOne').mockResolvedValue(groupRes);

    // Assuming you have a create method that needs to be called before findOne
    const result_1 = await controller.create(createGroup);

    expect(result_1).toEqual(groupRes);
    expect(service.create).toHaveBeenCalledWith(createGroup);

    // Test the findOne method
    const result = await controller.findOne(mockAuthenticatedReq, groupRes.id);

    expect(result).toEqual(groupRes);
    expect(service.findOne).toHaveBeenCalledWith(authenticatedUser, groupRes.id);
  });

  it('should throw NotFoundException when it not found the group', async () => {

    const mockID : string =  uuidv4();

    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    const createGroup: CreateGroupDto = {
      name: 'NewGroup',
      description: 'A new group description.',
    };

    const group: Group = new Group();
    group.name = createGroup.name;
    group.description = createGroup.description;

    const groupRes: GroupResponse = new GroupResponse(group);

    jest.spyOn(service, 'create').mockResolvedValue(groupRes);
    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service, 'findOne').mockImplementation(async (originUser, id) => {
      if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {  
      const populate = [
        'description',
        'members',
        'memberCount',
        'totalScore',
        'uniqueTotalScore',
        'problemSolvedCount',
        'uniqueProblemSolvedCount',
        'lastProblemSolvedAt',
      ] as const;
      const group = await service['groupsRepository'].findOne({ id} , {populate});
      if (!group) {
        throw new NotFoundException({
          message: 'Group not found',
          errors: { id: 'Group not found' },
        });
      }
      return new GroupResponse(group);
    }

    const populate = [
      'members',
      'memberCount',
      'totalScore',
      'uniqueTotalScore',
      'problemSolvedCount',
      'uniqueProblemSolvedCount',
      'lastProblemSolvedAt',
      'createdAt',
      'updatedAt',
    ] as const;
    const group = await service['groupsRepository'].findOne({ id} , {populate});
    if (!group) {
      throw new NotFoundException({
        message: 'Group not found',
        errors: { id: 'Group not found' },
      });
    }
    return new GroupResponse(group);
    });

    const result_1 = await controller.create(createGroup);

    expect(result_1).toEqual(groupRes);
    expect(service.create).toHaveBeenCalledWith(createGroup);

    await expect(controller.findOne(mockAuthenticatedReq, mockID)).rejects.toThrow(NotFoundException);
    expect(service.findOne).toHaveBeenCalledWith(authenticatedUser, mockID);
  });
});

