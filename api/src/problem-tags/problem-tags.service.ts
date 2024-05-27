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
  UnauthorizedException,
} from '@nestjs/common';
import { isSomeRolesIn } from 'src/auth/roles';
import { assignDefined } from 'src/shared/assign-defined';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';
import { parseSort } from 'src/shared/parse-sort';
import { UsersService } from 'src/users/users.service';

import { CreateProblemTagDto } from './dto/create-problem-tag.dto';
import { FindAllDto } from './dto/find-all.dto';
import { UpdateProblemTagDto } from './dto/update-problem-tag.dto';
import { ProblemTag, ProblemTagResponse } from './entities/problem-tag.entity';

@Injectable()
export class ProblemTagsService {
  constructor(
    @InjectRepository(ProblemTag)
    private readonly problemTagsRepository: EntityRepository<ProblemTag>,
    private readonly entityManager: EntityManager,
    private readonly usersService: UsersService,
  ) {}

  async create(
    originUser: AuthenticatedUser,
    createProblemTagDto: CreateProblemTagDto,
  ): Promise<ProblemTagResponse> {
    const user = await this.usersService.findOneInternal({ id: originUser.id });
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
    const nameExists = await this.problemTagsRepository.count({
      name: createProblemTagDto.name,
    });
    if (nameExists) {
      throw new BadRequestException({
        message: 'Name already in use',
        errors: { name: 'Name already in use' },
      });
    }
    const problemTag = new ProblemTag();
    problemTag.name = createProblemTagDto.name;
    problemTag.description = createProblemTagDto.description || '';
    problemTag.owner = user;
    await this.entityManager.persistAndFlush(problemTag);
    return new ProblemTagResponse(problemTag);
  }

  async findAll(
    originUser: AuthenticatedUser,
    findAllDto: FindAllDto,
  ): Promise<PaginatedResponse<ProblemTagResponse>> {
    const where: FilterQuery<ProblemTag> = {};
    if (findAllDto.search) {
      where.$or = [{ name: { $like: `%${findAllDto.search}%` } }];
    }
    const offset = (findAllDto.page - 1) * findAllDto.perPage;
    const limit = findAllDto.perPage;
    let orderBy: Record<string, 'asc' | 'desc'> | null = null;
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = ['description', 'createdAt', 'updatedAt'] as const;
      if (findAllDto.owner) {
        where.owner = findAllDto.owner;
      }
      if (findAllDto.sort) {
        orderBy = parseSort(findAllDto.sort, [
          'name',
          'owner',
          'createdAt',
          'updatedAt',
        ]);
      }
      if (orderBy) {
        const [problemTags, count] =
          await this.problemTagsRepository.findAndCount(where, {
            populate,
            offset,
            limit,
            orderBy,
          });
        return {
          data: problemTags.map(
            (problemTag) => new ProblemTagResponse(problemTag),
          ),
          page: findAllDto.page,
          perPage: findAllDto.perPage,
          total: count,
        };
      }
      const [problemTags, count] =
        await this.problemTagsRepository.findAndCount(where, {
          populate,
          offset,
          limit,
        });
      return {
        data: problemTags.map(
          (problemTag) => new ProblemTagResponse(problemTag),
        ),
        page: findAllDto.page,
        perPage: findAllDto.perPage,
        total: count,
      };
    }
    const populate = ['description'] as const;
    if (findAllDto.owner) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { owner: 'Insufficient permissions' },
      });
    }
    if (findAllDto.sort) {
      orderBy = parseSort(findAllDto.sort, ['name']);
    }
    if (orderBy) {
      const [problemTags, count] =
        await this.problemTagsRepository.findAndCount(where, {
          populate,
          offset,
          limit,
          orderBy,
        });
      return {
        data: problemTags.map(
          (problemTag) => new ProblemTagResponse(problemTag),
        ),
        page: findAllDto.page,
        perPage: findAllDto.perPage,
        total: count,
      };
    }
    const [problemTags, count] = await this.problemTagsRepository.findAndCount(
      where,
      { populate, offset, limit },
    );
    return {
      data: problemTags.map((problemTag) => new ProblemTagResponse(problemTag)),
      page: findAllDto.page,
      perPage: findAllDto.perPage,
      total: count,
    };
  }

  async findOne(
    originUser: AuthenticatedUser,
    id: string,
  ): Promise<ProblemTagResponse> {
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = [
        'description',
        'owner',
        'createdAt',
        'updatedAt',
      ] as const;
      const problemTag = await this.problemTagsRepository.findOne(
        { id },
        { populate },
      );
      if (!problemTag) {
        throw new NotFoundException({
          message: 'ProblemTag not found',
          errors: { id: 'ProblemTag not found' },
        });
      }
      return new ProblemTagResponse(problemTag);
    }
    const populate = ['description'] as const;
    const problemTag = await this.problemTagsRepository.findOne(
      { id },
      { populate },
    );
    if (!problemTag) {
      throw new NotFoundException({
        message: 'ProblemTag not found',
        errors: { id: 'ProblemTag not found' },
      });
    }
    return new ProblemTagResponse(problemTag);
  }

  async findOneInternal(where: FilterQuery<ProblemTag>): Promise<ProblemTag> {
    const problemTag = await this.problemTagsRepository.findOne(where, {
      populate: ['description', 'owner', 'createdAt', 'updatedAt'],
    });
    if (!problemTag) {
      throw new NotFoundException({
        message: 'ProblemTag not found',
        errors: { where: 'ProblemTag not found' },
      });
    }
    return problemTag;
  }

  async update(
    originUser: AuthenticatedUser,
    id: string,
    updateProblemTagDto: UpdateProblemTagDto,
  ): Promise<ProblemTagResponse> {
    const problemTag = await this.findOneInternal({ id });
    if (!problemTag) {
      throw new NotFoundException({
        message: 'ProblemTag not found',
        errors: { id: 'ProblemTag not found' },
      });
    }
    if (
      originUser.id != problemTag.owner.id &&
      !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
    ) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
      });
    }
    assignDefined(problemTag, updateProblemTagDto);
    await this.entityManager.flush();
    return await this.findOne(originUser, id);
  }

  async remove(originUser: AuthenticatedUser, id: string): Promise<void> {
    const problemTag = await this.findOneInternal({ id });
    if (!problemTag) {
      throw new NotFoundException({
        message: 'ProblemTag not found',
        errors: { id: 'ProblemTag not found' },
      });
    }
    if (
      originUser.id != problemTag.owner.id &&
      !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
    ) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
      });
    }
    await this.entityManager.removeAndFlush(problemTag);
    return;
  }
}
