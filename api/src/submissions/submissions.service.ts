import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { Submission } from './entities/submission.entity';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionsRepository: EntityRepository<Submission>,
    private readonly entityManager: EntityManager,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(createSubmissionDto: CreateSubmissionDto) {
    return 'This action adds a new submission';
  }

  async findAll() {
    return `This action returns all submissions`;
  }

  async findOne(id: string) {
    return `This action returns a #${id} submission`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: string, updateSubmissionDto: UpdateSubmissionDto) {
    return `This action updates a #${id} submission`;
  }

  async remove(id: string) {
    return `This action removes a #${id} submission`;
  }
}
