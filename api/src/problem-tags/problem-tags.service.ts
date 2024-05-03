import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateProblemTagDto } from './dto/create-problem-tag.dto';
import { UpdateProblemTagDto } from './dto/update-problem-tag.dto';
import { ProblemTag } from './entities/problem-tag.entity';

@Injectable()
export class ProblemTagsService {
  constructor(
    @InjectRepository(ProblemTag)
    private readonly problemTagsRepository: EntityRepository<ProblemTag>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(createProblemTagDto: CreateProblemTagDto): Promise<ProblemTag> {
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
    await this.entityManager.persistAndFlush(problemTag);
    return problemTag;
  }

  async findAll(): Promise<ProblemTag[]> {
    return await this.problemTagsRepository.findAll();
  }

  async findOne(id: string): Promise<ProblemTag> {
    const problemTag = await this.problemTagsRepository.findOne({ id });
    if (!problemTag) {
      throw new NotFoundException({
        message: 'ProblemTag not found',
        errors: { id: 'ProblemTag not found' },
      });
    }
    return problemTag;
  }

  async update(
    id: string,
    updateProblemTagDto: UpdateProblemTagDto,
  ): Promise<ProblemTag> {
    const problemTag = await this.problemTagsRepository.findOne({ id });
    if (!problemTag) {
      throw new NotFoundException({
        message: 'ProblemTag not found',
        errors: { id: 'ProblemTag not found' },
      });
    }
    this.problemTagsRepository.assign(problemTag, updateProblemTagDto);
    await this.entityManager.flush();
    return problemTag;
  }

  async remove(id: string): Promise<void> {
    const problemTag = await this.problemTagsRepository.findOne({ id });
    if (!problemTag) {
      throw new NotFoundException({
        message: 'ProblemTag not found',
        errors: { id: 'ProblemTag not found' },
      });
    }
    await this.entityManager.removeAndFlush(problemTag);
    return;
  }
}
