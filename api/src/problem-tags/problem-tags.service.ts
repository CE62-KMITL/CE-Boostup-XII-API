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
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';
import { UsersService } from 'src/users/users.service';

import { CreateProblemTagDto } from './dto/create-problem-tag.dto';
import { UpdateProblemTagDto } from './dto/update-problem-tag.dto';
import { ProblemTag } from './entities/problem-tag.entity';

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
  ): Promise<ProblemTag> {
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
    problemTag.description = createProblemTagDto.description;
    problemTag.owner = user;
    await this.entityManager.persistAndFlush(problemTag);
    return problemTag;
  }

  async findAll(originUser: AuthenticatedUser): Promise<ProblemTag[]> {
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = ['description', 'createdAt', 'updatedAt'] as const;
      return await this.problemTagsRepository.findAll({ populate });
    }
    const populate = ['description'] as const;
    return await this.problemTagsRepository.findAll({ populate });
  }

  async findOne(
    originUser: AuthenticatedUser,
    id: string,
  ): Promise<ProblemTag> {
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
      return problemTag;
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
    return problemTag;
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
  ): Promise<ProblemTag> {
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
    Object.assign(problemTag, updateProblemTagDto);
    await this.entityManager.flush();
    return problemTag;
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
