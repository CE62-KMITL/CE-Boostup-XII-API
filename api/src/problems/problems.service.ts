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
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AttachmentsService } from 'src/attachments/attachments.service';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { isSomeRolesIn } from 'src/auth/roles';
import { CompilerService } from 'src/compiler/compiler.service';
import { ProblemTag } from 'src/problem-tags/entities/problem-tag.entity';
import { ProblemTagsService } from 'src/problem-tags/problem-tags.service';
import { assignDefault } from 'src/shared/assign-default';
import { assignDefined } from 'src/shared/assign-defined';
import { compareOutput } from 'src/shared/compare-output';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { CompletionStatus } from 'src/shared/enums/completion-status.enum';
import { PublicationStatus } from 'src/shared/enums/publication-status.enum';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';
import { parseIntOptional } from 'src/shared/parse-int-optional';
import { parseSort } from 'src/shared/parse-sort';
import { SubmissionsService } from 'src/submissions/submissions.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import {
  CreateProblemDto,
  createProblemDtoDefault,
} from './dto/create-problem.dto';
import { FindAllDto } from './dto/find-all.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { Problem, ProblemResponse } from './entities/problem.entity';

@Injectable()
export class ProblemsService implements OnModuleInit {
  private submissionsService: SubmissionsService;

  constructor(
    @InjectRepository(Problem)
    private readonly problemsRepository: EntityRepository<Problem>,
    private readonly entityManager: EntityManager,
    private readonly moduleRef: ModuleRef,
    private readonly usersService: UsersService,
    private readonly problemTagsService: ProblemTagsService,
    private readonly attachmentsService: AttachmentsService,
    private readonly compilerService: CompilerService,
  ) {}

  onModuleInit(): void {
    this.submissionsService = this.moduleRef.get(SubmissionsService, {
      strict: false,
    });
  }

  async create(
    originUser: AuthenticatedUser,
    createProblemDto: CreateProblemDto,
  ): Promise<ProblemResponse> {
    assignDefault(createProblemDto, createProblemDtoDefault);
    if (!createProblemDto.hint) {
      createProblemDto.hintCost = 0;
    }
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
    if (createProblemDto.attachments) {
      for (const attachmentId of createProblemDto.attachments) {
        const attachment = await this.attachmentsService.findOneInternal({
          id: attachmentId,
        });
        if (!attachment) {
          throw new BadRequestException({
            message: 'Attachment not found',
            errors: { attachments: `Attachment not found: ${attachmentId}` },
          });
        }
        attachments.push(attachment);
      }
    }
    if (createProblemDto.tags) {
      for (const tagId of createProblemDto.tags) {
        const tag = await this.problemTagsService.findOneInternal({
          id: tagId,
        });
        if (!tag) {
          throw new BadRequestException({
            message: 'Tag not found',
            errors: { tags: `Tag not found: ${tagId}` },
          });
        }
        tags.push(tag);
      }
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
    if (findAllDto.owner) {
      where.owner = findAllDto.owner;
    }
    if (findAllDto.tags) {
      const tags = findAllDto.tags.split(',');
      where.$and = [];
      for (const tag of tags) {
        where.$and.push({ tags: { $some: tag } });
      }
    }
    if (findAllDto.difficulties) {
      const difficulties = findAllDto.difficulties.split(',').map(Number);
      where.difficulty = { $in: difficulties };
    }
    if (findAllDto.publicationStatus) {
      where.publicationStatus = findAllDto.publicationStatus;
    }
    if (findAllDto.completionStatus) {
      switch (findAllDto.completionStatus) {
        case CompletionStatus.Solved:
          where.submissions = { $some: { owner: user, accepted: true } };
          break;
        case CompletionStatus.Attempted:
          where.submissions = {
            $some: { owner: user },
            $none: { owner: user, accepted: true },
          };
          break;
        case CompletionStatus.Unattempted:
          where.submissions = { $none: { owner: user } };
          break;
      }
    }
    const offset: number = (findAllDto.page - 1) * findAllDto.perPage;
    const limit: number = findAllDto.perPage;
    let orderBy: Record<string, 'asc' | 'desc'> | null = null;
    const completionStatuses = await this.getCompletionStatuses(user);
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
          data: problems.map(
            (problem) =>
              new ProblemResponse(problem, {
                completionStatus: this.getCompletionStatus(
                  completionStatuses,
                  problem,
                ),
              }),
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
        data: problems.map(
          (problem) =>
            new ProblemResponse(problem, {
              completionStatus: this.getCompletionStatus(
                completionStatuses,
                problem,
              ),
            }),
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
        data: problems.map(
          (problem) =>
            new ProblemResponse(problem, {
              completionStatus: this.getCompletionStatus(
                completionStatuses,
                problem,
              ),
            }),
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
      data: problems.map(
        (problem) =>
          new ProblemResponse(problem, {
            completionStatus: this.getCompletionStatus(
              completionStatuses,
              problem,
            ),
          }),
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
    const user = await this.usersService.findOneInternal({ id: originUser.id });
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
    const checkProblem = await this.findOneInternal({ id });
    if (!checkProblem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { id: 'Problem not found' },
      });
    }
    if (
      originUser.id === checkProblem.owner.id ||
      isSomeRolesIn(originUser.roles, [
        Role.Reviewer,
        Role.Admin,
        Role.SuperAdmin,
      ])
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
        'reviewer',
        'reviewComment',
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
      return new ProblemResponse(problem, {
        completionStatus: await this.getCompletionStatusOne(problem, user),
      });
    }
    const populate = [
      'description',
      'input',
      'output',
      'hint',
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
      'usersUnlockedHint',
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
    const hint =
      problem.hintCost === 0 || problem.usersUnlockedHint.contains(user);
    return new ProblemResponse(problem, {
      completionStatus: await this.getCompletionStatusOne(problem, user),
      removeHint: !hint,
    });
  }

  async findOneInternal(where: FilterQuery<Problem>): Promise<Problem | null> {
    return await this.problemsRepository.findOne(where, {
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
        'reviewer',
        'reviewComment',
        'createdAt',
        'updatedAt',
      ],
    });
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
    const user = await this.usersService.findOneInternal({
      id: originUser.id,
    });
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
    if (updateProblemDto.unlockHint) {
      if (!problem.usersUnlockedHint.isInitialized()) {
        await problem.usersUnlockedHint.init();
      }
      if (user.totalScore < problem.hintCost) {
        throw new BadRequestException({
          message: 'Insufficient score',
          errors: { unlockHint: 'Insufficient score' },
        });
      }
      await this.usersService.updateInternal(
        { id: user.id },
        {
          totalScoreOffset: user.totalScoreOffset - problem.hintCost,
        },
      );
      problem.usersUnlockedHint.add(user);
      delete updateProblemDto.unlockHint;
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
          problem.reviewComment = null;
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
              problem.reviewer = user;
              problem.reviewComment = updateProblemDto.reviewComment || null;
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
      delete updateProblemDto.reviewComment;
    }
    if (Object.keys(updateProblemDto).length === 0) {
      await this.entityManager.flush();
      return await this.findOne(originUser, id);
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
    if (
      problem.publicationStatus !== PublicationStatus.Draft &&
      !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
    ) {
      await this.entityManager.flush();
      throw new BadRequestException({
        message: `${problem.publicationStatus} problem cannot be modified`,
        errors: {
          id: `${problem.publicationStatus} problem cannot be modified`,
        },
      });
    }
    if (updateProblemDto.attachments) {
      const attachments: Attachment[] = [];
      for (const attachmentId of updateProblemDto.attachments) {
        const attachment = await this.attachmentsService.findOneInternal({
          id: attachmentId,
        });
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
        const tag = await this.problemTagsService.findOneInternal({
          id: tagId,
        });
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

  private async getCompletionStatusOne(
    problem: Problem,
    user: User,
  ): Promise<CompletionStatus> {
    const submissions = await this.submissionsService.findAllInternal({
      owner: user,
      problem,
    });
    for (const submission of submissions) {
      console.log(submission);
    }
    if (submissions.some((submission) => submission.accepted)) {
      return CompletionStatus.Solved;
    }
    if (submissions.length > 0) {
      return CompletionStatus.Attempted;
    }
    return CompletionStatus.Unattempted;
  }

  private getCompletionStatus(
    completionStatuses: Record<string, CompletionStatus>,
    problem: Problem,
  ): CompletionStatus {
    if (completionStatuses.hasOwnProperty(problem.id)) {
      return completionStatuses[problem.id];
    }
    return CompletionStatus.Unattempted;
  }

  private async getCompletionStatuses(
    user: User,
  ): Promise<Record<string, CompletionStatus>> {
    const completionStatuses: Record<string, CompletionStatus> = {};
    const submissions = await this.submissionsService.findAllInternal({
      owner: user,
    });
    for (const submission of submissions) {
      if (submission.accepted) {
        completionStatuses[submission.problem.id] = CompletionStatus.Solved;
        continue;
      }
      if (!completionStatuses.hasOwnProperty(submission.problem.id)) {
        completionStatuses[submission.problem.id] = CompletionStatus.Attempted;
      }
    }
    return completionStatuses;
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
      optimizationLevel: problem.optimizationLevel,
      allowedHeaders: problem.allowedHeaders,
      bannedFunctions: problem.bannedFunctions,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
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
