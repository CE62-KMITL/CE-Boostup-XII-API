import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

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

  async create(createProblemTagDto: CreateProblemTagDto) {
    return 'This action adds a new problemTag';
  }

  async findAll() {
    return `This action returns all problemTags`;
  }

  async findOne(id: string) {
    return `This action returns a #${id} problemTag`;
  }

  async update(id: string, updateProblemTagDto: UpdateProblemTagDto) {
    return `This action updates a #${id} problemTag`;
  }

  async remove(id: string) {
    return `This action removes a #${id} problemTag`;
  }
}
