import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Problem } from 'src/problems/entities/problem.entity';
import { User } from 'src/users/entities/user.entity';

import { CreateSaveDto } from './dto/create-save.dto';
import { UpdateSaveDto } from './dto/update-save.dto';
import { Save } from './entities/save.entity';

@Injectable()
export class SavesService {
  constructor(
    @InjectRepository(Save)
    private readonly savesRepository: EntityRepository<Save>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(
    // user: User, // TODO: Add user authentication
    createSaveDto: CreateSaveDto,
  ): Promise<Save> {
    // TODO: Add rate limiting
    const user = (await this.entityManager.getRepository(User).findAll())[0];
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
    save.user = user;
    save.problem = problem;
    save.code = createSaveDto.code;
    await this.entityManager.persistAndFlush(save);
    return save;
  }

  async findAll(): Promise<Save[]> {
    return await this.savesRepository.findAll();
  }

  async findOne(id: string): Promise<Save> {
    const save = await this.savesRepository.findOne({ id });
    if (!save) {
      throw new NotFoundException({
        message: 'Save not found',
        errors: { id: 'Save not found' },
      });
    }
    return save;
  }

  async update(id: string, updateSaveDto: UpdateSaveDto): Promise<Save> {
    const save = await this.savesRepository.findOne({ id });
    if (!save) {
      throw new NotFoundException({
        message: 'Save not found',
        errors: { id: 'Save not found' },
      });
    }
    this.savesRepository.assign(save, updateSaveDto);
    await this.entityManager.flush();
    return save;
  }

  async remove(id: string): Promise<void> {
    const save = await this.savesRepository.findOne({ id });
    if (!save) {
      throw new NotFoundException({
        message: 'Save not found',
        errors: { id: 'Save not found' },
      });
    }
    await this.entityManager.removeAndFlush(save);
    return;
  }
}
