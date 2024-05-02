import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { ProblemTag } from 'src/problem-tags/entities/problem-tag.entity';
import { PublicationStatus } from 'src/shared/enums/publication-status.enum';
import { User } from 'src/users/entities/user.entity';

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

  async create(
    // user: User, // TODO: Add user authentication
    createProblemDto: CreateProblemDto,
  ): Promise<Problem> {
    const user = (await this.entityManager.getRepository(User).findAll())[0];
    const problem = new Problem();
    const attachments: Attachment[] = [];
    const tags: ProblemTag[] = [];
    for (const attachmentId of createProblemDto.attachments) {
      const attachment = await this.entityManager
        .getRepository(Attachment)
        .findOne({ id: attachmentId });
      if (!attachment) {
        throw new BadRequestException({
          message: 'Attachment not found',
          errors: { attachments: `Attachment not found: ${attachmentId}` },
        });
      }
      attachments.push(attachment);
    }
    for (const tagId of createProblemDto.tags) {
      const tag = await this.entityManager
        .getRepository(ProblemTag)
        .findOne({ id: tagId });
      if (!tag) {
        throw new BadRequestException({
          message: 'Tag not found',
          errors: { tags: `Tag not found: ${tagId}` },
        });
      }
      tags.push(tag);
    }
    Object.assign(problem, {
      ...createProblemDto,
      attachments: attachments,
      tags: tags,
      owner: user,
      publicationStatus: PublicationStatus.Draft,
    });
    await this.entityManager.persistAndFlush(problem);
    return problem;
  }

  async findAll(): Promise<Problem[]> {
    return await this.problemsRepository.findAll();
  }

  async findOne(id: string): Promise<Problem> {
    const problem = await this.problemsRepository.findOne({ id });
    if (!problem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { id: 'Problem not found' },
      });
    }
    return problem;
  }

  async update(
    id: string,
    updateProblemDto: UpdateProblemDto,
  ): Promise<Problem> {
    const problem = await this.problemsRepository.findOne({ id });
    if (!problem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { id: 'Problem not found' },
      });
    }
    let attachments: Attachment[] | undefined = undefined;
    let tags: ProblemTag[] | undefined = undefined;
    if (updateProblemDto.attachments) {
      attachments = [];
      for (const attachmentId of updateProblemDto.attachments) {
        const attachment = await this.entityManager
          .getRepository(Attachment)
          .findOne({ id: attachmentId });
        if (!attachment) {
          throw new BadRequestException({
            message: 'Attachment not found',
            errors: { attachments: `Attachment not found: ${attachmentId}` },
          });
        }
        attachments.push(attachment);
      }
    }
    if (updateProblemDto.tags) {
      tags = [];
      for (const tagId of updateProblemDto.tags) {
        const tag = await this.entityManager
          .getRepository(ProblemTag)
          .findOne({ id: tagId });
        if (!tag) {
          throw new BadRequestException({
            message: 'Tag not found',
            errors: { tags: `Tag not found: ${tagId}` },
          });
        }
        tags.push(tag);
      }
    }
    this.problemsRepository.assign(problem, {
      ...updateProblemDto,
      attachments: attachments,
      tags: tags,
    });
    await this.entityManager.flush();
    return problem;
  }

  async remove(id: string) {
    const problem = await this.problemsRepository.findOne({ id });
    if (!problem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { id: 'Problem not found' },
      });
    }
    await this.entityManager.removeAndFlush(problem);
    return;
  }
}
