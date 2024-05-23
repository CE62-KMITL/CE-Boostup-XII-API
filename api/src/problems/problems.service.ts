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
import { CompilerService } from 'src/compiler/compiler.service';
import { ProblemTag } from 'src/problem-tags/entities/problem-tag.entity';
import { assignDefined } from 'src/shared/assign-defined';
import { compareOutput } from 'src/shared/compare-output';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { CompletionStatus } from 'src/shared/enums/completion-status.enum';
import { PublicationStatus } from 'src/shared/enums/publication-status.enum';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';
import { parseIntOptional } from 'src/shared/parse-int-optional';
import { parseSort } from 'src/shared/parse-sort';
import { Submission } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { CreateProblemDto } from './dto/create-problem.dto';
import { FindAllDto } from './dto/find-all.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { Problem, ProblemResponse } from './entities/problem.entity';

@Injectable()
export class ProblemsService {
  constructor(
    @InjectRepository(Problem)
    private readonly problemsRepository: EntityRepository<Problem>,
    private readonly entityManager: EntityManager,
    private readonly usersService: UsersService,
    private readonly compilerService: CompilerService,
  ) {}

  async create(
    originUser: AuthenticatedUser,
    createProblemDto: CreateProblemDto,
  ): Promise<ProblemResponse> {
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
    assignDefined(problem, {
      ...createProblemDto,
      attachments: attachments,
      tags: tags,
      owner: user,
      publicationStatus: PublicationStatus.Draft,
    });
    await this.entityManager.persistAndFlush(problem);
    return new ProblemResponse(problem);
  }

  async findAll(
    originUser: AuthenticatedUser,
    findAllDto: FindAllDto,
  ): Promise<PaginatedResponse<ProblemResponse>> {
    const user = await this.usersService.findOneInternal({ id: originUser.id });
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
    const where: FilterQuery<Problem> = {};
    if (findAllDto.search) {
      where.$or = [{ title: { $like: `%${findAllDto.search}%` } }];
      if (!isNaN(parseInt(findAllDto.search))) {
        where.$or.push({ number: parseInt(findAllDto.search) });
      }
    }
    if (findAllDto.tags) {
      const tags = findAllDto.tags.split(',');
      where.tags = { $none: { id: { $nin: tags } } };
    }
    if (findAllDto.difficulties) {
      const difficulties = findAllDto.difficulties.split(',').map(Number);
      where.difficulty = { $in: difficulties };
    }
    const offset: number = (findAllDto.page - 1) * findAllDto.perPage;
    const limit: number = findAllDto.perPage;
    let orderBy: Record<string, 'asc' | 'desc'> | null = null;
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
      if (findAllDto.sort) {
        orderBy = parseSort(findAllDto.sort, [
          'number',
          'title',
          'difficulty',
          'score',
          'publicationStatus',
          'userSolvedCount',
          'createdAt',
          'updatedAt',
        ]);
      }
      if (orderBy) {
        const [problems, count] = await this.problemsRepository.findAndCount(
          where,
          {
            populate,
            offset,
            limit,
            orderBy,
          },
        );
        return {
          data: await Promise.all(
            problems.map(
              async (problem) =>
                new ProblemResponse(problem, {
                  completionStatus: await this.getCompletionStatus(
                    problem,
                    user,
                  ),
                }),
            ),
          ),
          page: findAllDto.page,
          perPage: findAllDto.perPage,
          total: count,
        };
      }
      const [problems, count] = await this.problemsRepository.findAndCount(
        where,
        {
          populate,
          offset,
          limit,
        },
      );
      return {
        data: await Promise.all(
          problems.map(
            async (problem) =>
              new ProblemResponse(problem, {
                completionStatus: await this.getCompletionStatus(problem, user),
              }),
          ),
        ),
        page: findAllDto.page,
        perPage: findAllDto.perPage,
        total: count,
      };
    }
    const populate = [
      'description',
      'owner',
      'userSolvedCount',
      'createdAt',
      'updatedAt',
    ] as const;
    where.publicationStatus = PublicationStatus.Published;
    if (findAllDto.sort) {
      orderBy = parseSort(findAllDto.sort, [
        'number',
        'title',
        'difficulty',
        'score',
        'userSolvedCount',
        'createdAt',
        'updatedAt',
      ]);
    }
    if (orderBy) {
      const [problems, count] = await this.problemsRepository.findAndCount(
        where,
        {
          populate,
          offset,
          limit,
          orderBy,
        },
      );
      return {
        data: await Promise.all(
          problems.map(
            async (problem) =>
              new ProblemResponse(problem, {
                completionStatus: await this.getCompletionStatus(problem, user),
              }),
          ),
        ),
        page: findAllDto.page,
        perPage: findAllDto.perPage,
        total: count,
      };
    }
    const [problems, count] = await this.problemsRepository.findAndCount(
      where,
      {
        populate,
        offset,
        limit,
      },
    );
    return {
      data: await Promise.all(
        problems.map(
          async (problem) =>
            new ProblemResponse(problem, {
              completionStatus: await this.getCompletionStatus(problem, user),
            }),
        ),
      ),
      page: findAllDto.page,
      perPage: findAllDto.perPage,
      total: count,
    };
  }

  async findOne(
    originUser: AuthenticatedUser,
    id: string,
  ): Promise<ProblemResponse> {
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
      return new ProblemResponse(problem);
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
    const userUnlockedHint = await this.usersService.findOneInternal({
      id: originUser.id,
      unlockedHints: { $some: problem },
    });
    if (userUnlockedHint) {
      this.problemsRepository.populate(problem, ['hint']);
    }
    return new ProblemResponse(problem);
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
  ): Promise<ProblemResponse> {
    const problem = await this.findOneInternal({ id });
    if (!problem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { id: 'Problem not found' },
      });
    }
    if (updateProblemDto.unlockHint) {
      const user = await this.usersService.findOneInternal({
        id: originUser.id,
      });
      if (!user) {
        throw new UnauthorizedException({
          message: 'Invalid token',
          errors: { token: 'Invalid token' },
        });
      }
      if (user.unlockedHints.contains(problem)) {
        throw new BadRequestException({
          message: 'Hint already unlocked',
          errors: { unlockHint: 'Hint already unlocked' },
        });
      }
      if (parseIntOptional(user.totalScore) < problem.hintCost) {
        throw new BadRequestException({
          message: 'Insufficient score',
          errors: { unlockHint: 'Insufficient score' },
        });
      }
      await this.usersService.updateInternal(
        { id: user.id },
        {
          totalScoreOffset: user.totalScoreOffset - problem.hintCost,
          unlockedHints: [...user.unlockedHints, problem],
        },
      );
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
          await this.verifyTestcases(problem);
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
    assignDefined(problem, updateProblemDto);
    await this.entityManager.flush();
    return await this.findOne(originUser, id);
  }

  async remove(originUser: AuthenticatedUser, id: string): Promise<void> {
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

  private async getCompletionStatus(
    problem: Problem,
    user: User,
  ): Promise<CompletionStatus> {
    // Switch this to submission service
    const acceptedSubmissions = await this.entityManager
      .getRepository(Submission)
      .count({ problem, owner: user, accepted: true });
    if (acceptedSubmissions) {
      return CompletionStatus.Solved;
    }
    const submissions = await this.entityManager
      .getRepository(Submission)
      .count({ problem, owner: user });
    if (submissions) {
      return CompletionStatus.Attempted;
    }
    return CompletionStatus.Unattempted;
  }

  private async verifyTestcases(problem: Problem): Promise<void> {
    const exampleTestcases: { input: string; output: string }[] =
      problem.exampleTestcases;
    const testcases: { input: string; output: string }[] = problem.testcases;
    const allTestcases = exampleTestcases.concat(testcases);
    const exampleTestcasesCount = exampleTestcases.length;
    const result = await this.compilerService.compileAndRun({
      code: problem.solution,
      language: problem.solutionLanguage,
      inputs: allTestcases.map((testcase) => testcase.input),
    });
    if (result.code || !result.outputs) {
      throw new BadRequestException({
        message: 'Solution compilation error',
        errors: { solution: result.compilerOutput },
      });
    }
    for (const [i, testcase] of allTestcases.entries()) {
      const type: 'example' | 'testcase' =
        i < exampleTestcasesCount ? 'example' : 'testcase';
      const index = i < exampleTestcasesCount ? i : i - exampleTestcasesCount;
      if (result.outputs[i].code) {
        throw new BadRequestException({
          message: 'Solution runtime error',
          errors: {
            solution: 'Runtime error',
            testcase: {
              type,
              index,
              testcase,
              output: result.outputs[i].runtimeOutput,
              exitSignal: result.outputs[i].exitSignal,
            },
          },
        });
      }
      if (!compareOutput(testcase.output, result.outputs[i].runtimeOutput)) {
        throw new BadRequestException({
          message: 'Solution incorrect output',
          errors: {
            solution: 'Incorrect output',
            testcase: {
              type,
              index,
              testcase,
              output: result.outputs[i].runtimeOutput,
            },
          },
        });
      }
    }
    return;
  }
}
