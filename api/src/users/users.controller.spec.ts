 
import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { CreateUserDto } from './dto/create-user.dto';
import { Group, GroupResponse } from '../groups/entities/group.entity';
import { User, UserResponse } from './entities/user.entity';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedRequest, AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';

const moduleMocker = new ModuleMocker(global);

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
    })
      .useMocker((token) => {
        const results = ['test1', 'test2'];
        if (token === UsersService) {
          return {
            create: jest.fn().mockResolvedValue(results),
            usersRepository: {
              count: jest.fn().mockResolvedValue(0),
            },
            entityManager: {
              getRepository: jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue(new Group()),
              }),
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
      roles: [Role.Admin]
    }
    
    const group_: Group = new Group();
    group_.name = 'example';
    group_.description = 'lorem ipsum';

    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      displayName: 'Test User',
      roles: [Role.User],
      group: group_.id
    };

    const user = new User(
      createUserDto.email,
      createUserDto.roles,
      createUserDto.displayName,
      group_,
    )

    const group_res: GroupResponse = new GroupResponse(group_);

    const userRes = new UserResponse(user);

    const authenticatedReq: AuthenticatedRequest = {
      user: authenticatedUser,
     
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn(),
      acceptsCharsets: jest.fn(),
      acceptsEncodings: jest.fn(),
      acceptsLanguages: jest.fn(),
      range: jest.fn(),
      param: jest.fn(),
      params: {},
      query: {},
      body: {},
    };

    jest.spyOn(service, 'create').mockResolvedValue(userRes);
    jest.spyOn(service['usersRepository'], 'count').mockResolvedValue(0);
    jest.spyOn(service['entityManager'].getRepository(Group), 'findOne').mockResolvedValue(group_res);

    const result = await controller.create(authenticatedReq ,createUserDto);

    expect(result).toEqual(userRes);
    expect(service.create).toHaveBeenCalledWith(authenticatedUser, createUserDto);
  });
});