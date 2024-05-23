import {
  EntityManager,
  EntityRepository,
  FilterQuery,
} from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { isSomeRolesIn } from 'src/auth/roles';
import { Problem } from 'src/problems/entities/problem.entity';
import { assignDefined } from 'src/shared/assign-defined';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';
import { parseSort } from 'src/shared/parse-sort';
import { UsersService } from 'src/users/users.service';

import { CreateSaveDto } from './dto/create-save.dto';
import { FindAllDto } from './dto/find-all.dto';
import { UpdateSaveDto } from './dto/update-save.dto';
import { Save, SaveResponse } from './entities/save.entity';

@Injectable()
export class SavesService {
  constructor(
    @InjectRepository(Save)
    private readonly savesRepository: EntityRepository<Save>,
    private readonly entityManager: EntityManager,
    private readonly usersService: UsersService,
  ) {}

  async create(
    originUser: AuthenticatedUser,
    createSaveDto: CreateSaveDto,
  ): Promise<SaveResponse> {
    // TODO: Add rate limiting
    const user = await this.usersService.findOneInternal({ id: originUser.id });
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
    const problem = await this.entityManager
      .getRepository(Problem)
      .findOne({ id: createSaveDto.problemId });
    if (!problem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { problemId: 'Problem not found' },
      });
    }
    const save = new Save();
    save.owner = user;
    save.problem = problem;
    save.code = createSaveDto.code;
    await this.entityManager.persistAndFlush(save);
    return new SaveResponse(save);
  }

  async findAll(
    originUser: AuthenticatedUser,
    findAllDto: FindAllDto,
  ): Promise<PaginatedResponse<SaveResponse>> {
    const where: FilterQuery<Save> = {};
    if (findAllDto.owner) {
      where.owner = findAllDto.owner;
    }
    if (findAllDto.problem) {
      where.problem = findAllDto.problem;
    }
    const offset = (findAllDto.page - 1) * findAllDto.perPage;
    const limit = findAllDto.perPage;
    let orderBy: Record<string, 'asc' | 'desc'> | null = null;
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = ['owner', 'problem', 'createdAt', 'updatedAt'] as const;
      if (findAllDto.sort) {
        orderBy = parseSort(findAllDto.sort, ['createdAt', 'updatedAt']);
      }
      if (orderBy) {
        const [saves, count] = await this.savesRepository.findAndCount(where, {
          populate,
          offset,
          limit,
          orderBy,
        });
        return {
          data: saves.map((save) => new SaveResponse(save)),
          page: findAllDto.page,
          perPage: findAllDto.perPage,
          total: count,
        };
      }
      const [saves, count] = await this.savesRepository.findAndCount(where, {
        populate,
        offset,
        limit,
      });
      return {
        data: saves.map((save) => new SaveResponse(save)),
        page: findAllDto.page,
        perPage: findAllDto.perPage,
        total: count,
      };
    }
    const populate = ['problem', 'createdAt', 'updatedAt'] as const;
    where.owner = originUser.id;
    if (findAllDto.sort) {
      orderBy = parseSort(findAllDto.sort, ['createdAt', 'updatedAt']);
    }
    if (orderBy) {
      const [saves, count] = await this.savesRepository.findAndCount(where, {
        populate,
        offset,
        limit,
        orderBy,
      });
      return {
        data: saves.map((save) => new SaveResponse(save)),
        page: findAllDto.page,
        perPage: findAllDto.perPage,
        total: count,
      };
    }
    const [saves, count] = await this.savesRepository.findAndCount(where, {
      populate,
      offset,
      limit,
    });
    return {
      data: saves.map((save) => new SaveResponse(save)),
      page: findAllDto.page,
      perPage: findAllDto.perPage,
      total: count,
    };
  }

  async findOne(
    originUser: AuthenticatedUser,
    id: string,
  ): Promise<SaveResponse> {
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = [
        'owner',
        'problem',
        'code',
        'createdAt',
        'updatedAt',
      ] as const;
      const save = await this.savesRepository.findOne({ id }, { populate });
      if (!save) {
        throw new NotFoundException({
          message: 'Save not found',
          errors: { id: 'Save not found' },
        });
      }
      return new SaveResponse(save);
    }
    const populate = ['problem', 'code', 'createdAt', 'updatedAt'] as const;
    const save = await this.savesRepository.findOne({ id }, { populate });
    if (!save) {
      throw new NotFoundException({
        message: 'Save not found',
        errors: { id: 'Save not found' },
      });
    }
    return new SaveResponse(save);
  }

  async findOneInternal(where: FilterQuery<Save>): Promise<Save> {
    const save = await this.savesRepository.findOne(where, {
      populate: ['owner', 'problem', 'code'],
    });
    if (!save) {
      throw new NotFoundException({
        message: 'Save not found',
        errors: { where: 'Save not found' },
      });
    }
    return save;
  }

  async update(
    originUser: AuthenticatedUser,
    id: string,
    updateSaveDto: UpdateSaveDto,
  ): Promise<SaveResponse> {
    const save = await this.findOneInternal({ id });
    if (!save) {
      throw new NotFoundException({
        message: 'Save not found',
        errors: { id: 'Save not found' },
      });
    }
    if (
      save.owner.id !== originUser.id &&
      !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
    ) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
      });
    }
    assignDefined(save, updateSaveDto);
    await this.entityManager.flush();
    return await this.findOne(originUser, id);
  }

  async remove(originUser: AuthenticatedUser, id: string): Promise<void> {
    const save = await this.findOneInternal({ id });
    if (!save) {
      throw new NotFoundException({
        message: 'Save not found',
        errors: { id: 'Save not found' },
      });
    }
    if (
      save.owner.id !== originUser.id &&
      !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
    ) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
      });
    }
    await this.entityManager.removeAndFlush(save);
    return;
  }
}
