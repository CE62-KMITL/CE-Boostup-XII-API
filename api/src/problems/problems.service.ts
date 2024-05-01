import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { Problem } from './entities/problem.entity';

@Injectable()
export class ProblemsService {
  constructor(
    @InjectRepository(Problem)
    private readonly problemsRepository: EntityRepository<Problem>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(createProblemDto: CreateProblemDto) {
    return 'This action adds a new problem';
  }

  async findAll() {
    return `This action returns all problems`;
  }

  async findOne(id: string) {
    return `This action returns a #${id} problem`;
  }

  async update(id: string, updateProblemDto: UpdateProblemDto) {
    return `This action updates a #${id} problem`;
  }

  async remove(id: string) {
    return `This action removes a #${id} problem`;
  }
}
