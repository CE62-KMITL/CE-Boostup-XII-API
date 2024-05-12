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
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { isSomeRolesIn } from 'src/auth/roles';
import { ProblemTag } from 'src/problem-tags/entities/problem-tag.entity';
import { PublicationStatus } from 'src/shared/enums/publication-status.enum';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';
import { UsersService } from 'src/users/users.service';

import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { Problem } from './entities/problem.entity';

@Injectable()
export class ProblemsService {
  constructor(
    @InjectRepository(Problem)
    private readonly problemsRepository: EntityRepository<Problem>,
    private readonly entityManager: EntityManager,
    private readonly usersService: UsersService,
  ) {}

  async create(
    originUser: AuthenticatedUser,
    createProblemDto: CreateProblemDto,
  ): Promise<Problem> {
    const user = await this.usersService.findOneInternal({ id: originUser.id });
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
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

  async findAll(originUser: AuthenticatedUser): Promise<Problem[]> {
    if (
      isSomeRolesIn(originUser.roles, [Role.Staff, Role.Admin, Role.SuperAdmin])
    ) {
      const populate = [
        'description',
        'owner',
        'publicationStatus',
        'userSolvedCount',
        'createdAt',
        'updatedAt',
      ] as const;
      return await this.problemsRepository.findAll({ populate });
    }
    const populate = [
      'description',
      'owner',
      'userSolvedCount',
      'createdAt',
      'updatedAt',
    ] as const;
    return await this.problemsRepository.findAll({
      where: { publicationStatus: PublicationStatus.Published },
      populate,
    });
  }

  async findOne(originUser: AuthenticatedUser, id: string): Promise<Problem> {
    if (
      isSomeRolesIn(originUser.roles, [Role.Staff, Role.Admin, Role.SuperAdmin])
    ) {
      const populate = [
        'description',
        'input',
        'output',
        'hint',
        'hintCost',
        'testcases',
        'exampleTestcases',
        'starterCode',
        'solution',
        'solutionLanguage',
        'allowedHeaders',
        'bannedFunctions',
        'timeLimit',
        'memoryLimit',
        'optimizationLevel',
        'attachments',
        'tags',
        'owner',
        'credits',
        'publicationStatus',
        'userSolvedCount',
        'createdAt',
        'updatedAt',
      ] as const;
      const problem = await this.problemsRepository.findOne(
        { id },
        { populate },
      );
      if (!problem) {
        throw new NotFoundException({
          message: 'Problem not found',
          errors: { id: 'Problem not found' },
        });
      }
      return problem;
    }
    const populate = [
      'description',
      'input',
      'output',
      'hintCost',
      'exampleTestcases',
      'starterCode',
      'allowedHeaders',
      'bannedFunctions',
      'timeLimit',
      'memoryLimit',
      'optimizationLevel',
      'attachments',
      'tags',
      'owner',
      'credits',
      'userSolvedCount',
      'createdAt',
      'updatedAt',
    ] as const;
    const problem = await this.problemsRepository.findOne({ id }, { populate });
    if (!problem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { id: 'Problem not found' },
      });
    }
    if (true) {
      // TODO: If user has unlocked hint
      this.problemsRepository.populate(problem, ['hint']);
    }
    return problem;
  }

  async findOneInternal(where: FilterQuery<Problem>): Promise<Problem> {
    const problem = await this.problemsRepository.findOne(where, {
      populate: [
        'description',
        'input',
        'output',
        'hint',
        'hintCost',
        'testcases',
        'exampleTestcases',
        'starterCode',
        'solution',
        'solutionLanguage',
        'allowedHeaders',
        'bannedFunctions',
        'timeLimit',
        'memoryLimit',
        'optimizationLevel',
        'attachments',
        'tags',
        'owner',
        'credits',
        'publicationStatus',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!problem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { where: 'Problem not found' },
      });
    }
    return problem;
  }

  async update(
    originUser: AuthenticatedUser,
    id: string,
    updateProblemDto: UpdateProblemDto,
  ): Promise<Problem> {
    const problem = await this.findOneInternal({ id });
    if (!problem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { id: 'Problem not found' },
      });
    }
    if (updateProblemDto.publicationStatus) {
      switch (problem.publicationStatus) {
        case PublicationStatus.Draft:
          if (
            updateProblemDto.publicationStatus !==
            PublicationStatus.AwaitingApproval
          ) {
            throw new BadRequestException({
              message: 'Invalid publication status',
              errors: {
                publicationStatus:
                  'Draft problems can only be submitted for approval',
              },
            });
          }
          if (
            originUser.id !== problem.owner.id &&
            !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
          ) {
            throw new ForbiddenException({
              message: 'Insufficient permissions',
              errors: { id: 'Insufficient permissions' },
            });
          }
          break;
        case PublicationStatus.AwaitingApproval:
          switch (updateProblemDto.publicationStatus) {
            case PublicationStatus.Draft:
              if (
                originUser.id !== problem.owner.id &&
                !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
              ) {
                throw new ForbiddenException({
                  message: 'Insufficient permissions',
                  errors: { id: 'Insufficient permissions' },
                });
              }
              break;
            case PublicationStatus.Approved:
            case PublicationStatus.Rejected:
              if (
                !isSomeRolesIn(originUser.roles, [
                  Role.Reviewer,
                  Role.SuperAdmin,
                ]) ||
                (originUser.id === problem.owner.id &&
                  !isSomeRolesIn(originUser.roles, [Role.SuperAdmin]))
              ) {
                throw new ForbiddenException({
                  message: 'Insufficient permissions',
                  errors: { publicationStatus: 'Insufficient permissions' },
                });
              }
              break;
            default:
              throw new BadRequestException({
                message: 'Invalid publication status',
                errors: {
                  publicationStatus:
                    'Awaiting approval problems can only be reverted to draft, approved or rejected',
                },
              });
          }
          break;
        case PublicationStatus.Approved:
          switch (updateProblemDto.publicationStatus) {
            case PublicationStatus.Draft:
            case PublicationStatus.Published:
            case PublicationStatus.Archived:
              if (
                originUser.id !== problem.owner.id &&
                !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
              ) {
                throw new ForbiddenException({
                  message: 'Insufficient permissions',
                  errors: { id: 'Insufficient permissions' },
                });
              }
              break;
            default:
              throw new BadRequestException({
                message: 'Invalid publication status',
                errors: {
                  publicationStatus:
                    'Approved problems can only be reverted to draft, published or archived',
                },
              });
          }
          break;
        case PublicationStatus.Rejected:
          if (updateProblemDto.publicationStatus !== PublicationStatus.Draft) {
            throw new BadRequestException({
              message: 'Invalid publication status',
              errors: {
                publicationStatus:
                  'Rejected problems can only be reverted to draft',
              },
            });
          }
          if (
            originUser.id !== problem.owner.id &&
            !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
          ) {
            throw new ForbiddenException({
              message: 'Insufficient permissions',
              errors: { id: 'Insufficient permissions' },
            });
          }
          break;
        case PublicationStatus.Published:
          if (
            updateProblemDto.publicationStatus !== PublicationStatus.Archived
          ) {
            throw new BadRequestException({
              message: 'Invalid publication status',
              errors: {
                publicationStatus: 'Published problems can only be archived',
              },
            });
          }
          if (
            originUser.id !== problem.owner.id &&
            !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
          ) {
            throw new ForbiddenException({
              message: 'Insufficient permissions',
              errors: { id: 'Insufficient permissions' },
            });
          }
          break;
        case PublicationStatus.Archived:
          throw new BadRequestException({
            message: 'Invalid publication status',
            errors: {
              publicationStatus: 'Archived problems cannot be modified',
            },
          });
      }
      problem.publicationStatus = updateProblemDto.publicationStatus;
      delete updateProblemDto.publicationStatus;
    }
    if (
      problem.owner.id !== originUser.id &&
      !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
    ) {
      await this.entityManager.flush();
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
      });
    }
    if (updateProblemDto.attachments) {
      const attachments: Attachment[] = [];
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
      problem.attachments.set(attachments);
      delete updateProblemDto.attachments;
    }
    if (updateProblemDto.tags) {
      const tags: ProblemTag[] = [];
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
      problem.tags.set(tags);
      delete updateProblemDto.tags;
    }
    Object.assign(problem, updateProblemDto);
    await this.entityManager.flush();
    return problem;
  }

  async remove(originUser: AuthenticatedUser, id: string) {
    const problem = await this.findOneInternal({ id });
    if (!problem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { id: 'Problem not found' },
      });
    }
    if (
      originUser.id !== problem.owner.id &&
      !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
    ) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
      });
    }
    await this.entityManager.removeAndFlush(problem);
    return;
  }
}
