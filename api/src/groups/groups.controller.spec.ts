import { Test, TestingModule } from '@nestjs/testing';

import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { Group, GroupResponse } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { Role } from '../shared/enums/role.enum';
import { AuthenticatedRequest } from '../shared/interfaces/authenticated-request.interface';
import { RolesGuard } from '../auth/roles.guard';


const moduleMocker = new ModuleMocker(global);

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: GroupsService;

  beforeEach(async () => {
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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
    })
      .useMocker((token) => {
        if (token === GroupsService) {
          return {
            create: jest.fn(),
            groupsRepository: {
              count: jest.fn(),
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
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<GroupsController>(GroupsController);
    service = module.get<GroupsService>(GroupsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return group', async () => {
    const createGroup: CreateGroupDto = {
      name: 'Nigga',
      description: 'Nigga originated as a variant of the infamous racial slur nigger, reflecting one of its pronunciations, and for many people it is an equally offensive word. In the late 20th century, however, the two forms began to diverge in use among some African Americans, with nigga becoming the preferred term for neutral and positive self-referential uses. Despite their prevalence in hip-hop, a highly influential music and cultural movement of African American origin whose millions of fans now span the globe, these uses of nigga are themselves controversial and the use of nigga by a person who is not Black—in any context—is considered highly offensive.',
    }

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
});
