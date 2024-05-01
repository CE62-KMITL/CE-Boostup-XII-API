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

  create(createProblemTagDto: CreateProblemTagDto) {
    return 'This action adds a new problemTag';
  }

  findAll() {
    return `This action returns all problemTags`;
  }

  findOne(id: number) {
    return `This action returns a #${id} problemTag`;
  }

  update(id: number, updateProblemTagDto: UpdateProblemTagDto) {
    return `This action updates a #${id} problemTag`;
  }

  remove(id: number) {
    return `This action removes a #${id} problemTag`;
  }
}
