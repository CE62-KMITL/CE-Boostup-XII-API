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
import { UpdateGroupDto } from './dto/update-group.dto';
import { join } from 'path';
import * as fs from 'fs';
import { FindAllDto } from './dto/find-all.dto';
import { PaginatedResponse } from '../shared/dto/pagination.dto';
import { parseSort } from '../shared/parse-sort';
import { StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';


const moduleMocker = new ModuleMocker(global);

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: GroupsService;
  let conFigService: ConfigService;

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
        if (token === GroupsService || ConfigService) {
          return {
            create: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            findOneInternal: jest.fn(),
            update: jest.fn(),
            findAll: jest.fn(),
            groupsRepository: {
              count: jest.fn(),
              findOne: jest.fn(),
              findAndCount: jest.fn(),
            },
            entityManager: {
              persistAndFlush: jest.fn(),
              removeAndFlush: jest.fn(),
              flush: jest.fn(),
              findAndCount: jest.fn(),
            },
            configService: {
              getOrThrow: jest.fn()
            },
            getOrThrow: jest.fn().mockReturnValue('/path/to/avatars')
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
    conFigService = module.get<ConfigService>(ConfigService);
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

  it('should call findOne', async () => {

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

  it('should throw NotFoundException when it not found the group : findOne', async () => {

    const mockID: string = uuidv4();

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
        const group = await service['groupsRepository'].findOne({ id }, { populate });
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
      const group = await service['groupsRepository'].findOne({ id }, { populate });
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

  it('should call remove', async () => {
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

    jest.spyOn(service, 'findOneInternal').mockResolvedValue(group);

    jest.spyOn(service, 'remove').mockImplementation(async (id) => {
      const group = await service.findOneInternal({ id });
      if (!group) {
        throw new NotFoundException({
          message: 'Group not found',
          errors: { id: 'Group not found' },
        });
      }
      await service['entityManager'].removeAndFlush(group);
      return;
    });

    const lastResult = await controller.remove(group.id);

    expect(lastResult).toEqual(undefined);
    expect(service.remove).toHaveBeenCalledWith(group.id);
  });

  it('should throw NotFoundException when it not found the group : remove', async () => {

    const mockID: string = uuidv4();

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
    jest.spyOn(service['groupsRepository'], 'findOne').mockResolvedValue(0);
    jest.spyOn(service, 'findOneInternal').mockImplementation(async (where) => {
      const group = await service['groupsRepository'].findOne(where, {
        populate: [
          'description',
          'members',
          'avatarFilename',
          'createdAt',
          'updatedAt',
        ],
      });
      if (!group) {
        throw new NotFoundException({
          message: 'Group not found',
          errors: { where: 'Group not found' },
        });
      }
      return group;
    });
    jest.spyOn(service, 'remove').mockImplementation(async (id) => {
      const group = await service.findOneInternal({ id });
      if (!group) {
        throw new NotFoundException({
          message: 'Group not found',
          errors: { id: 'Group not found' },
        });
      }
      await service['entityManager'].removeAndFlush(group);
      return;
    });

    const result_1 = await controller.create(createGroup);

    expect(result_1).toEqual(groupRes);
    expect(service.create).toHaveBeenCalledWith(createGroup);

    await expect(controller.remove(mockID)).rejects.toThrow(NotFoundException);
    expect(service.remove).toHaveBeenCalledWith(mockID);
  });

  it('should update', async () => {
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

    const updateGroup: UpdateGroupDto = {
      name: 'Nigga56',
      description: 'respelling of nigger (typically representing African American speech) with big D',
      avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAC/klEQVQ4y4WTXUxbZRzGf+/p6aErHyudNJQKBsaQijKnN1vi/EZ08wKNYZkxcZF4w3DRmGjiMk0wkt0YZ7hwJsSAH7twGkzMwo1GXMjcIlMKq1uZJWEFy4AU2pVCz3nP+3pBsrjM6O/un+ef57l5HvT/oZS+fCWppZT/Kpv8B0ODX/DCvha+/T5Bem0aNLz/+m4qA4GbP0JrrQFs28ayLABmk5PI5WlsV1PXuB2A3s8XEVY5Wmv2Nps8274bAAPg+kKaTOoC+esX+eXyDOl1L/NL68Tm7JtJLf4p3tiv2BbeRnylgonxMQBMAKWhoryUZMaHKObwj7+NdGsov+Nhro19SUnuLA/5YfYPL23hWi5dukJd6IlNA6UUf549xcy5UWqjLUTkGRCCkEjjpIoY5hSOECgNVlASqQ1THQ6hNEwmZjEGuttZW17kwQOHqFwYxlm1WVuPsOLeT1XL4zhZG2e1SH61jGDDTvx+H6bpwXVdkiqE8VfgXj4dmeRY3wCsbSBvbCDLouQKJThFe/O+UaTQ+ByWz+KlV44yODSMEGBaPoyyXR24SrPUUMVkcw+yKPEkvia4MIL6sQ+54SI3HErPn+DiR4dZjlTS0fEkA4PfYWfmMHLFecZ3NOKrCBBLxfhwy2MoCa6EoWgX/a2HiJfuZDjdxMtb2qm7swb7wjvE7/KTtQuIxMxVffDkcU5HJ4hlq/lA3YevTIFTgdcC4RjYWmNLhyPFCeqNRabtMF+FdvHeA22YTfWNOKEw9sp57vHM8oi1h+ZgJSeuXmOPWqc+P4dXCe72LlFu5LEoEJUZns6WsLfr6GYPRl7s5mT/PBEjz7uHn8L0eGj47TO+kU0EhUOMKqKrcVJGNb1Vz2D5DU7t77y1yiM/j/La2A9I5dBrTXHMbsVrClwXTMPkp842YskUR35N8OaOKN0HDt5qAJDNZWn9uA+vaXA8M8pbgUfRSoAADwZKa8Ze7aGmOnz7mP5JoVDgk+HT9Md/RxgeurY30/N8J4GtW29b7N+AcIVs/VCRxQAAAABJRU5ErkJggg==',
    };

    const group: Group = new Group();
    group.avatarFilename = `${group.id}.png`;
    delete updateGroup.avatar;
    Object.assign(group, updateGroup);

    const groupRes: GroupResponse = new GroupResponse(group);

    jest.spyOn(service, 'create').mockResolvedValue(groupRes);
    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(0);

    const result = await controller.create(createGroup);

    expect(result).toEqual(groupRes);
    expect(service.create).toHaveBeenCalledWith(createGroup);

    jest.spyOn(service, 'findOneInternal').mockResolvedValue(group);
    jest.spyOn(service, 'update').mockResolvedValue(Promise.resolve(groupRes));

    const lastResult = await controller.update(mockAuthenticatedReq, group.id, updateGroup);

    expect(lastResult.name).toEqual(updateGroup.name);
    expect(lastResult.description).toEqual(updateGroup.description);
    expect(service.update).toHaveBeenCalledWith(authenticatedUser, group.id, updateGroup);
  });



  it('should throw NotFoundException : update', async () => {
    const mockID: string = uuidv4();

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

    const updateGroup: UpdateGroupDto = {
      name: 'Nigga56',
      description: 'respelling of nigger (typically representing African American speech) with big D',
      avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAC/klEQVQ4y4WTXUxbZRzGf+/p6aErHyudNJQKBsaQijKnN1vi/EZ08wKNYZkxcZF4w3DRmGjiMk0wkt0YZ7hwJsSAH7twGkzMwo1GXMjcIlMKq1uZJWEFy4AU2pVCz3nP+3pBsrjM6O/un+ef57l5HvT/oZS+fCWppZT/Kpv8B0ODX/DCvha+/T5Bem0aNLz/+m4qA4GbP0JrrQFs28ayLABmk5PI5WlsV1PXuB2A3s8XEVY5Wmv2Nps8274bAAPg+kKaTOoC+esX+eXyDOl1L/NL68Tm7JtJLf4p3tiv2BbeRnylgonxMQBMAKWhoryUZMaHKObwj7+NdGsov+Nhro19SUnuLA/5YfYPL23hWi5dukJd6IlNA6UUf549xcy5UWqjLUTkGRCCkEjjpIoY5hSOECgNVlASqQ1THQ6hNEwmZjEGuttZW17kwQOHqFwYxlm1WVuPsOLeT1XL4zhZG2e1SH61jGDDTvx+H6bpwXVdkiqE8VfgXj4dmeRY3wCsbSBvbCDLouQKJThFe/O+UaTQ+ByWz+KlV44yODSMEGBaPoyyXR24SrPUUMVkcw+yKPEkvia4MIL6sQ+54SI3HErPn+DiR4dZjlTS0fEkA4PfYWfmMHLFecZ3NOKrCBBLxfhwy2MoCa6EoWgX/a2HiJfuZDjdxMtb2qm7swb7wjvE7/KTtQuIxMxVffDkcU5HJ4hlq/lA3YevTIFTgdcC4RjYWmNLhyPFCeqNRabtMF+FdvHeA22YTfWNOKEw9sp57vHM8oi1h+ZgJSeuXmOPWqc+P4dXCe72LlFu5LEoEJUZns6WsLfr6GYPRl7s5mT/PBEjz7uHn8L0eGj47TO+kU0EhUOMKqKrcVJGNb1Vz2D5DU7t77y1yiM/j/La2A9I5dBrTXHMbsVrClwXTMPkp842YskUR35N8OaOKN0HDt5qAJDNZWn9uA+vaXA8M8pbgUfRSoAADwZKa8Ze7aGmOnz7mP5JoVDgk+HT9Md/RxgeurY30/N8J4GtW29b7N+AcIVs/VCRxQAAAABJRU5ErkJggg==',
    };

    const group: Group = new Group();
    group.avatarFilename = `${group.id}.png`;
    Object.assign(group, updateGroup);

    const groupRes: GroupResponse = new GroupResponse(group);

    jest.spyOn(service, 'create').mockResolvedValue(groupRes);
    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(0);

    const result = await controller.create(createGroup);

    expect(result).toEqual(groupRes);
    expect(service.create).toHaveBeenCalledWith(createGroup);

    jest.spyOn(service['groupsRepository'], 'findOne').mockResolvedValue(0);

    jest.spyOn(service, 'findOneInternal').mockImplementation(async (where) => {
      const group = await service['groupsRepository'].findOne(where, {
        populate: [
          'description',
          'members',
          'avatarFilename',
          'createdAt',
          'updatedAt',
        ],
      });
      if (!group) {
        throw new NotFoundException({
          message: 'Group not found',
          errors: { where: 'Group not found' },
        });
      }
      return group;
    });

    jest.spyOn(service, 'update').mockImplementation(async (originUser, id, dto) => {
      const group = await service.findOneInternal({ id });
      if (!group) {
        throw new NotFoundException({
          message: 'Group not found',
          errors: { id: 'Group not found' },
        });
      }
      if (dto.avatar) {
        const matches = dto.avatar.match(
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
        if (group.avatarFilename) {
          await fs.promises.unlink(
            join(
              service['configService'].getOrThrow<string>('storages.avatars.path'),
              group.avatarFilename,
            ),
          );
        }
        group.avatarFilename = filename;
        await fs.promises.writeFile(
          join(
            service['configService'].getOrThrow<string>('storages.avatars.path'),
            filename,
          ),
          fileData,
          'base64',
        );
        delete dto.avatar;
      }
      Object.assign(group, dto);
      await service['entityManager'].flush();
      return await service.findOne(originUser, id);
    });

    await expect(controller.update(mockAuthenticatedReq, mockID, updateGroup)).rejects.toThrow(NotFoundException);
    expect(service.update).toHaveBeenCalledWith(authenticatedUser, mockID, updateGroup);
  });

  it('should return all groups', async () => {
    // Setup authenticated user
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    // Setup authenticated request
    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    // Create group DTOs
    const createGroupList: Array<CreateGroupDto> = [
      { name: 'NewGroup', description: 'A new group description.' },
      { name: 'NewGroup_0', description: 'A new group description pop' },
      { name: 'NewGroup_1', description: 'A new group description poppy' },
      { name: 'Nigga', description: 'A new group description poppy big d' },
    ];

    // Create expected group responses
    const groupList: Array<Group> = [];
    const groupResList: Array<GroupResponse> = createGroupList.map((dto, index) => {
      const group = new Group();
      group.name = dto.name;
      group.description = dto.description;
      groupList.push(group);
      return new GroupResponse(group);
    });

    // Mock service methods
    jest.spyOn(service, 'create').mockImplementation((dto: CreateGroupDto) => {
      const index = createGroupList.findIndex(group => group.name === dto.name);
      return Promise.resolve(groupResList[index]);
    });
    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['groupsRepository'], 'findAndCount').mockImplementation(async (where, options) => {
      return [groupList, groupList.length];
    });

    // Test group creation
    for (const dto of createGroupList) {
      const result = await controller.create(dto);
      const expected = groupResList.find(group => group.name === dto.name);
      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    }

    // Prepare DTO for findAll
    const dto: FindAllDto = { page: 1, perPage: 100 };

    // Mock findAll method
    jest.spyOn(service, 'findAll').mockImplementation(async (authenticatedUser, dto) => {
      const offset = (dto.page - 1) * dto.perPage;
      const limit = dto.perPage;
      const [groups, count] = await service['groupsRepository'].findAndCount({}, { offset, limit });
      return {
        data: groups.map(group => new GroupResponse(group)),
        page: dto.page,
        perPage: dto.perPage,
        total: count,
      };
    });

    // Call findAll and assert the result
    const expectedFindAllRes: PaginatedResponse<GroupResponse> = {
      data: groupResList,
      page: dto.page,
      perPage: dto.perPage,
      total: groupList.length,
    };

    const lastResult = await controller.findAll(mockAuthenticatedReq, dto);

    expect(lastResult).toEqual(expectedFindAllRes);
    expect(service.findAll).toHaveBeenCalledWith(authenticatedUser, dto);
  });

  it('should return filtered groups', async () => {
    // Setup authenticated user
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };

    // Setup authenticated request
    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;

    // Create group DTOs
    const createGroupList: Array<CreateGroupDto> = [
      { name: 'NewGroup', description: 'A new group description.' },
      { name: 'NewGroup_0', description: 'A new group description pop' },
      { name: 'NewGroup_1', description: 'A new group description poppy' },
      { name: 'Nigga', description: 'A new group description poppy big d' },
    ];

    // Create expected group responses
    const groupList: Array<Group> = [];
    const groupResList: Array<GroupResponse> = createGroupList.map((dto, index) => {
      const group = new Group();
      group.name = dto.name;
      group.description = dto.description;
      groupList.push(group);
      return new GroupResponse(group);
    });

    // Mock service methods
    jest.spyOn(service, 'create').mockImplementation((dto: CreateGroupDto) => {
      const index = createGroupList.findIndex(group => group.name === dto.name);
      return Promise.resolve(groupResList[index]);
    });
    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(0);

    // Test group creation
    for (const dto of createGroupList) {
      const result = await controller.create(dto);
      const expected = groupResList.find(group => group.name === dto.name);
      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    }

    // Prepare DTO for findAll
    const dto: FindAllDto = {
      page: 1,
      perPage: 100,
      search: 'NewGroup'
    };

    const where: { $or?: Array<{ name: { $like: string } }> } = {};
    if (dto.search) {
      where.$or = [{ name: { $like: `%${dto.search}%` } }];
    }

    // Apply filter condition to groupResList
    const groupResFilteredlist: Array<GroupResponse> = groupResList.filter(group => {
      if (where.$or) {
        return where.$or.some(condition => group.name?.includes(condition.name.$like.replace(/%/g, '')));
      }
      return true;
    });

    jest.spyOn(service['groupsRepository'], 'findAndCount').mockImplementation(async (where, options) => {
      return [groupResFilteredlist, groupResFilteredlist.length];
    });

    // Mock findAll method
    jest.spyOn(service, 'findAll').mockImplementation(async (authenticatedUser, dto) => {
      const offset = (dto.page - 1) * dto.perPage;
      const limit = dto.perPage;
      const [groups, count] = await service['groupsRepository'].findAndCount({}, { offset, limit });
      return {
        data: groups.map(group => new GroupResponse(group)),
        page: dto.page,
        perPage: dto.perPage,
        total: count,
      };
    });

    // Call findAll and assert the result
    const expectedFindAllRes: PaginatedResponse<GroupResponse> = {
      data: groupResFilteredlist,
      page: dto.page,
      perPage: dto.perPage,
      total: groupResFilteredlist.length,
    };

    const lastResult = await controller.findAll(mockAuthenticatedReq, dto);

    expect(lastResult).toEqual(expectedFindAllRes);
    expect(service.findAll).toHaveBeenCalledWith(authenticatedUser, dto);
  });

  it('should return descending groups by total score', async () => {
    // Setup authenticated user
    const authenticatedUser: AuthenticatedUser = {
      id: '0',
      roles: [Role.Admin],
    };
  
    // Setup authenticated request
    const mockAuthenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
      headers: {},
      body: {},
      params: {},
      query: {},
      method: 'GET',
      url: '/test-url',
    } as unknown as AuthenticatedRequest;
  
    // Create group DTOs
    const createGroupList: Array<CreateGroupDto> = [
      { name: 'NewGroup', description: 'A new group description.' },
      { name: 'NewGroup_0', description: 'A new group description pop' },
      { name: 'NewGroup_1', description: 'A new group description poppy' },
      { name: 'Nigga', description: 'A new group description poppy big d' },
    ];
  
    // Create expected group responses
    const groupList: Array<Group> = [];
    const groupResList: Array<GroupResponse> = createGroupList.map((dto, index) => {
      const group = new Group();
      group.name = dto.name;
      group.description = dto.description;
      if(index %2){
        group.totalScore = 100 - index;
      }
      else{
        group.totalScore = 100 + index;
      }
      groupList.push(group);
      return new GroupResponse(group);
    });
  
    // Mock service methods
    jest.spyOn(service, 'create').mockImplementation((dto: CreateGroupDto) => {
      const index = createGroupList.findIndex(group => group.name === dto.name);
      return Promise.resolve(groupResList[index]);
    });
    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(0);
  
    // Test group creation
    for (const dto of createGroupList) {
      const result = await controller.create(dto);
      const expected = groupResList.find(group => group.name === dto.name);
      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    }
  
    // Prepare DTO for findAll
    const fdto: FindAllDto = {
      page: 1,
      perPage: 100,
      sort: '-totalScore,-name'
    };
  
    // Modified group response list sorted by the provided criteria
    const modifiedGroupResList: Array<GroupResponse> = [...groupResList].sort((a, b) => {
      const scoreA = a.totalScore ?? 0;
      const scoreB = b.totalScore ?? 0;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Descending order
      }
  
      const nameA = a.name ?? '';
      const nameB = b.name ?? '';
      
      return nameA.localeCompare(nameB); // Secondary sort by name
    });
  
    jest.spyOn(service['groupsRepository'], 'findAndCount').mockImplementation(async (where, options) => {
      return [modifiedGroupResList, modifiedGroupResList.length];
    });
  
    // Mock findAll method
    jest.spyOn(service, 'findAll').mockImplementation(async (authenticatedUser, dto) => {
      const offset = (fdto.page - 1) * fdto.perPage;
      const populate = [
        'memberCount',
        'totalScore',
        'uniqueTotalScore',
        'problemSolvedCount',
        'uniqueProblemSolvedCount',
        'lastProblemSolvedAt',
        'createdAt',
        'updatedAt',
      ] as const;
  
      let orderBy: Record<string, 'asc' | 'desc'> | null = null;
      const limit = fdto.perPage;
      if (fdto.sort) {
        // Update the allowedProperties array to include all the valid sort properties
        const allowedProperties = [
          'name',
          'memberCount',
          'totalScore',
          'uniqueTotalScore',
          'problemSolvedCount',
          'uniqueProblemSolvedCount',
          'lastProblemSolvedAt',
          'createdAt',
          'updatedAt',
        ];
        orderBy = parseSort(fdto.sort, allowedProperties);
        const [groups, count] = await service['groupsRepository'].findAndCount({}, {
          populate,
          offset,
          limit,
          orderBy,
        });
        return {
          data: groups.map(group => new GroupResponse(group)),
          page: fdto.page,
          perPage: fdto.perPage,
          total: count,
        };
      }
  
      const [groups, count] = await service['groupsRepository'].findAndCount({}, {
        populate,
        offset,
        limit,
      });
      return {
        data: groups.map(group => new GroupResponse(group)),
        page: fdto.page,
        perPage: fdto.perPage,
        total: count,
      };
    });
  
    const expectedFindAllRes: PaginatedResponse<GroupResponse> = {
      data: modifiedGroupResList,
      page: fdto.page,
      perPage: fdto.perPage,
      total: modifiedGroupResList.length,
    };
  
    const lastResult = await controller.findAll(mockAuthenticatedReq, fdto);
  
    expect(lastResult).toEqual(expectedFindAllRes);
    expect(service.findAll).toHaveBeenCalledWith(authenticatedUser, fdto);
  });
  
  it('should throw NotFoundException when it not found the group : getAvatar', async () => {

    const mockResponse = () => {
      const res: Partial<Response> = {}; 
      res.status = jest.fn().mockReturnThis(); 
      res.send = jest.fn().mockReturnThis(); 
      res.set = jest.fn().mockReturnThis(); 
      return res as Response; 
    };

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

    const updateGroup: UpdateGroupDto = {
      name: 'Nigga56',
      description: 'respelling of nigger (typically representing African American speech) with big D',
      avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAC/klEQVQ4y4WTXUxbZRzGf+/p6aErHyudNJQKBsaQijKnN1vi/EZ08wKNYZkxcZF4w3DRmGjiMk0wkt0YZ7hwJsSAH7twGkzMwo1GXMjcIlMKq1uZJWEFy4AU2pVCz3nP+3pBsrjM6O/un+ef57l5HvT/oZS+fCWppZT/Kpv8B0ODX/DCvha+/T5Bem0aNLz/+m4qA4GbP0JrrQFs28ayLABmk5PI5WlsV1PXuB2A3s8XEVY5Wmv2Nps8274bAAPg+kKaTOoC+esX+eXyDOl1L/NL68Tm7JtJLf4p3tiv2BbeRnylgonxMQBMAKWhoryUZMaHKObwj7+NdGsov+Nhro19SUnuLA/5YfYPL23hWi5dukJd6IlNA6UUf549xcy5UWqjLUTkGRCCkEjjpIoY5hSOECgNVlASqQ1THQ6hNEwmZjEGuttZW17kwQOHqFwYxlm1WVuPsOLeT1XL4zhZG2e1SH61jGDDTvx+H6bpwXVdkiqE8VfgXj4dmeRY3wCsbSBvbCDLouQKJThFe/O+UaTQ+ByWz+KlV44yODSMEGBaPoyyXR24SrPUUMVkcw+yKPEkvia4MIL6sQ+54SI3HErPn+DiR4dZjlTS0fEkA4PfYWfmMHLFecZ3NOKrCBBLxfhwy2MoCa6EoWgX/a2HiJfuZDjdxMtb2qm7swb7wjvE7/KTtQuIxMxVffDkcU5HJ4hlq/lA3YevTIFTgdcC4RjYWmNLhyPFCeqNRabtMF+FdvHeA22YTfWNOKEw9sp57vHM8oi1h+ZgJSeuXmOPWqc+P4dXCe72LlFu5LEoEJUZns6WsLfr6GYPRl7s5mT/PBEjz7uHn8L0eGj47TO+kU0EhUOMKqKrcVJGNb1Vz2D5DU7t77y1yiM/j/La2A9I5dBrTXHMbsVrClwXTMPkp842YskUR35N8OaOKN0HDt5qAJDNZWn9uA+vaXA8M8pbgUfRSoAADwZKa8Ze7aGmOnz7mP5JoVDgk+HT9Md/RxgeurY30/N8J4GtW29b7N+AcIVs/VCRxQAAAABJRU5ErkJggg==',
    };
    const groupX: Group = new Group();
    
    const group: Group = new Group();
    group.avatarFilename = `${group.id}.png`;
    delete updateGroup.avatar;
    Object.assign(group, updateGroup);

    const groupRes: GroupResponse = new GroupResponse(group);

    jest.spyOn(service, 'create').mockResolvedValue(groupRes);
    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(0);

    const result = await controller.create(createGroup);

    expect(result).toEqual(groupRes);
    expect(service.create).toHaveBeenCalledWith(createGroup);

    jest.spyOn(service, 'findOneInternal').mockResolvedValue(group);
    jest.spyOn(service, 'update').mockResolvedValue(Promise.resolve(groupRes));

    const lastResult = await controller.update(mockAuthenticatedReq, group.id, updateGroup);

    expect(lastResult.name).toEqual(updateGroup.name);
    expect(lastResult.description).toEqual(updateGroup.description);
    expect(service.update).toHaveBeenCalledWith(authenticatedUser, group.id, updateGroup);
  
    const res: Response = mockResponse();
    
    jest.spyOn(service, 'findOneInternal').mockResolvedValue(groupX);
    jest.spyOn(controller, 'getAvatar').mockImplementation( async( Res, id)=>{
      const group = await service.findOneInternal(id);
    if (!group.avatarFilename) {
      throw new NotFoundException({
        message: 'Avatar not found',
        errors: { id: 'Avatar not found' },
      });
    }
    const file = createReadStream(
      join(
        conFigService.getOrThrow<string>('storages.avatars.path'),
        group.avatarFilename,
      ),
    );
    Res.set({
      'Content-Type': `image/${group.avatarFilename.split('.').pop()}`,
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(file);
  });
  
  await expect(controller.getAvatar(res, groupX.id)).rejects.toThrow(NotFoundException);
    
  }); 

  it('should return avatar', async () => {

    const mockResponse = () => {
      const res: Partial<Response> = {}; 
      res.status = jest.fn().mockReturnThis(); 
      res.send = jest.fn().mockReturnThis(); 
      res.set = jest.fn().mockReturnThis(); 
      return res as Response; 
    };

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

    const updateGroup: UpdateGroupDto = {
      name: 'Nigga56',
      description: 'respelling of nigger (typically representing African American speech) with big D',
      avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAC/klEQVQ4y4WTXUxbZRzGf+/p6aErHyudNJQKBsaQijKnN1vi/EZ08wKNYZkxcZF4w3DRmGjiMk0wkt0YZ7hwJsSAH7twGkzMwo1GXMjcIlMKq1uZJWEFy4AU2pVCz3nP+3pBsrjM6O/un+ef57l5HvT/oZS+fCWppZT/Kpv8B0ODX/DCvha+/T5Bem0aNLz/+m4qA4GbP0JrrQFs28ayLABmk5PI5WlsV1PXuB2A3s8XEVY5Wmv2Nps8274bAAPg+kKaTOoC+esX+eXyDOl1L/NL68Tm7JtJLf4p3tiv2BbeRnylgonxMQBMAKWhoryUZMaHKObwj7+NdGsov+Nhro19SUnuLA/5YfYPL23hWi5dukJd6IlNA6UUf549xcy5UWqjLUTkGRCCkEjjpIoY5hSOECgNVlASqQ1THQ6hNEwmZjEGuttZW17kwQOHqFwYxlm1WVuPsOLeT1XL4zhZG2e1SH61jGDDTvx+H6bpwXVdkiqE8VfgXj4dmeRY3wCsbSBvbCDLouQKJThFe/O+UaTQ+ByWz+KlV44yODSMEGBaPoyyXR24SrPUUMVkcw+yKPEkvia4MIL6sQ+54SI3HErPn+DiR4dZjlTS0fEkA4PfYWfmMHLFecZ3NOKrCBBLxfhwy2MoCa6EoWgX/a2HiJfuZDjdxMtb2qm7swb7wjvE7/KTtQuIxMxVffDkcU5HJ4hlq/lA3YevTIFTgdcC4RjYWmNLhyPFCeqNRabtMF+FdvHeA22YTfWNOKEw9sp57vHM8oi1h+ZgJSeuXmOPWqc+P4dXCe72LlFu5LEoEJUZns6WsLfr6GYPRl7s5mT/PBEjz7uHn8L0eGj47TO+kU0EhUOMKqKrcVJGNb1Vz2D5DU7t77y1yiM/j/La2A9I5dBrTXHMbsVrClwXTMPkp842YskUR35N8OaOKN0HDt5qAJDNZWn9uA+vaXA8M8pbgUfRSoAADwZKa8Ze7aGmOnz7mP5JoVDgk+HT9Md/RxgeurY30/N8J4GtW29b7N+AcIVs/VCRxQAAAABJRU5ErkJggg==',
    };

    const group: Group = new Group();
    group.avatarFilename = `${group.id}.png`;
    delete updateGroup.avatar;
    Object.assign(group, updateGroup);

    const groupRes: GroupResponse = new GroupResponse(group);

    jest.spyOn(service, 'create').mockResolvedValue(groupRes);
    jest.spyOn(service['groupsRepository'], 'count').mockResolvedValue(0);

    const result = await controller.create(createGroup);

    expect(result).toEqual(groupRes);
    expect(service.create).toHaveBeenCalledWith(createGroup);

    jest.spyOn(service, 'findOneInternal').mockResolvedValue(group);
    jest.spyOn(service, 'update').mockResolvedValue(Promise.resolve(groupRes));

    const lastResult = await controller.update(mockAuthenticatedReq, group.id, updateGroup);

    expect(lastResult.name).toEqual(updateGroup.name);
    expect(lastResult.description).toEqual(updateGroup.description);
    expect(service.update).toHaveBeenCalledWith(authenticatedUser, group.id, updateGroup);
  
    const res: Response = mockResponse();
    
    jest.spyOn(service, 'findOneInternal').mockResolvedValue(group);
    jest.spyOn(controller, 'getAvatar').mockImplementation( async( Res, id)=>{
      const group = await service.findOneInternal(id);
    if (!group.avatarFilename) {
      throw new NotFoundException({
        message: 'Avatar not found',
        errors: { id: 'Avatar not found' },
      });
    }
    const file = createReadStream(
      join(
        conFigService.getOrThrow<string>('storages.avatars.path'),
        group.avatarFilename,
      ),
    );
    Res.set({
      'Content-Type': `image/${group.avatarFilename.split('.').pop()}`,
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(file);
  });
  
    const avatar = await controller.getAvatar(res, group.id);
  
    expect(avatar).toBeInstanceOf(StreamableFile);
    expect(res.set).toHaveBeenCalledWith({
      'Content-Type': `image/${group.avatarFilename.split('.').pop()}`,
      'Content-Disposition': 'inline',
    });
    
  }); 
});

