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
} from '@nestjs/common';
import { isSomeRolesIn } from 'src/auth/roles';
import { Problem } from 'src/problems/entities/problem.entity';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';
import { UsersService } from 'src/users/users.service';

import { CreateSaveDto } from './dto/create-save.dto';
import { UpdateSaveDto } from './dto/update-save.dto';
import { Save } from './entities/save.entity';

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
  ): Promise<Save> {
    // TODO: Add rate limiting
    const user = await this.usersService.findOneInternal({ id: originUser.id });
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
    return save;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findAll(originUser: AuthenticatedUser): Promise<Save[]> {
    // TODO: Add permission control
    const populate = ['owner', 'problem'] as const;
    return await this.savesRepository.findAll({ populate });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findOne(originUser: AuthenticatedUser, id: string): Promise<Save> {
    // TODO: Add permission control
    const populate = ['owner', 'problem', 'code'] as const;
    const save = await this.savesRepository.findOne({ id }, { populate });
    if (!save) {
      throw new NotFoundException({
        message: 'Save not found',
        errors: { id: 'Save not found' },
      });
    }
    return save;
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
  ): Promise<Save> {
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
    Object.assign(save, updateSaveDto);
    await this.entityManager.flush();
    return save;
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
