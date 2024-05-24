import {
  EntityManager,
  EntityRepository,
  FilterQuery,
} from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { isSomeRolesIn } from 'src/auth/roles';
import { CompilerService } from 'src/compiler/compiler.service';
import { Problem } from 'src/problems/entities/problem.entity';
import { ProblemsService } from 'src/problems/problems.service';
import { assignDefined } from 'src/shared/assign-defined';
import { compareOutput } from 'src/shared/compare-output';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { ResultCode } from 'src/shared/enums/result-code.enum';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';
import { parseSort } from 'src/shared/parse-sort';
import { UsersService } from 'src/users/users.service';

import { CreateSubmissionDto } from './dto/create-submission.dto';
import { FindAllDto } from './dto/find-all.dto';
import {
  ProgrammingLanguage,
  Submission,
  SubmissionResponse,
} from './entities/submission.entity';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionsRepository: EntityRepository<Submission>,
    private readonly entityManager: EntityManager,
    private readonly usersService: UsersService,
    private readonly problemsService: ProblemsService,
    private readonly compilerService: CompilerService,
  ) {}

  async create(
    originUser: AuthenticatedUser,
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<SubmissionResponse> {
    const user = await this.usersService.findOneInternal({ id: originUser.id });
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
    const problem = await this.problemsService.findOneInternal({
      id: createSubmissionDto.problem,
    });
    if (!problem) {
      throw new NotFoundException({
        message: 'Problem not found',
        errors: { problemId: 'Problem not found' },
      });
    }
    const code = createSubmissionDto.code;
    const language = createSubmissionDto.language;
    const {
      outputCodes,
      compilationTime,
      compilationMemory,
      executionTime,
      executionMemory,
    } = await this.runTestcases(code, language, problem);
    const accepted = outputCodes.every((code) => code === ResultCode.AC);
    const submission = new Submission();
    assignDefined(submission, {
      owner: user,
      problem,
      code,
      language,
      outputCodes,
      accepted,
      compilationTime,
      compilationMemory,
      executionTime,
      executionMemory,
    });
    await this.entityManager.persistAndFlush(submission);
    return new SubmissionResponse(submission);
  }

  async findAll(
    originUser: AuthenticatedUser,
    findAllDto: FindAllDto,
  ): Promise<PaginatedResponse<SubmissionResponse>> {
    const where: FilterQuery<Submission> = {};
    if (findAllDto.owner) {
      where.owner = findAllDto.owner;
    }
    if (findAllDto.problem) {
      where.problem = findAllDto.problem;
    }
    if (findAllDto.search) {
      where.code = { $like: `%${findAllDto.search}%` };
    }
    if (findAllDto.isAccepted) {
      where.accepted = findAllDto.isAccepted;
    }
    if (findAllDto.language) {
      where.language = findAllDto.language;
    }
    const offset = (findAllDto.page - 1) * findAllDto.perPage;
    const limit = findAllDto.perPage;
    let orderBy: Record<string, 'asc' | 'desc'> | null = null;
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = [
        'owner',
        'problem',
        'code',
        'language',
        'outputCodes',
        'accepted',
        'compilationTime',
        'compilationMemory',
        'executionTime',
        'executionMemory',
        'createdAt',
      ] as const;
      if (findAllDto.sort) {
        orderBy = parseSort(findAllDto.sort, [
          'compilationTime',
          'compilationMemory',
          'executionTime',
          'executionMemory',
          'createdAt',
        ]);
      }
      if (orderBy) {
        const [submissions, count] =
          await this.submissionsRepository.findAndCount(where, {
            populate,
            offset,
            limit,
            orderBy,
          });
        return {
          data: submissions.map(
            (submission) => new SubmissionResponse(submission),
          ),
          page: findAllDto.page,
          perPage: findAllDto.perPage,
          total: count,
        };
      }
      const [submissions, count] =
        await this.submissionsRepository.findAndCount(where, {
          populate,
          offset,
          limit,
        });
      return {
        data: submissions.map(
          (submission) => new SubmissionResponse(submission),
        ),
        page: findAllDto.page,
        perPage: findAllDto.perPage,
        total: count,
      };
    }
    where.owner = originUser.id;
    const populate = [
      'problem',
      'code',
      'language',
      'outputCodes',
      'accepted',
      'compilationTime',
      'compilationMemory',
      'executionTime',
      'executionMemory',
      'createdAt',
    ] as const;
    if (findAllDto.sort) {
      orderBy = parseSort(findAllDto.sort, [
        'compilationTime',
        'compilationMemory',
        'executionTime',
        'executionMemory',
        'createdAt',
      ]);
    }
    if (orderBy) {
      const [submissions, count] =
        await this.submissionsRepository.findAndCount(where, {
          populate,
          offset,
          limit,
          orderBy,
        });
      return {
        data: submissions.map(
          (submission) => new SubmissionResponse(submission),
        ),
        page: findAllDto.page,
        perPage: findAllDto.perPage,
        total: count,
      };
    }
    const [submissions, count] = await this.submissionsRepository.findAndCount(
      where,
      {
        populate,
        offset,
        limit,
      },
    );
    return {
      data: submissions.map((submission) => new SubmissionResponse(submission)),
      page: findAllDto.page,
      perPage: findAllDto.perPage,
      total: count,
    };
  }

  async findOne(
    originUser: AuthenticatedUser,
    id: string,
  ): Promise<SubmissionResponse> {
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = [
        'owner',
        'problem',
        'code',
        'language',
        'outputCodes',
        'accepted',
        'compilationTime',
        'compilationMemory',
        'executionTime',
        'executionMemory',
        'createdAt',
      ] as const;
      const submission = await this.submissionsRepository.findOne(
        { id },
        { populate },
      );
      if (!submission) {
        throw new NotFoundException({
          message: 'Submission not found',
          errors: { id: 'Submission not found' },
        });
      }
      return new SubmissionResponse(submission);
    }
    const populate = [
      'problem',
      'code',
      'language',
      'outputCodes',
      'accepted',
      'compilationTime',
      'compilationMemory',
      'executionTime',
      'executionMemory',
      'createdAt',
    ] as const;
    const submission = await this.submissionsRepository.findOne(
      { id },
      { populate },
    );
    if (!submission) {
      throw new NotFoundException({
        message: 'Submission not found',
        errors: { id: 'Submission not found' },
      });
    }
    return new SubmissionResponse(submission);
  }

  async runTestcases(
    code: string,
    language: ProgrammingLanguage,
    problem: Problem,
  ): Promise<{
    outputCodes: ResultCode[];
    compilationTime: number | undefined;
    compilationMemory: number | undefined;
    executionTime: number | undefined;
    executionMemory: number | undefined;
  }> {
    const testcases = problem.testcases;
    const result = await this.compilerService.compileAndRun({
      code,
      language,
      inputs: testcases.map((testcase) => testcase.input),
      optimizationLevel: problem.optimizationLevel,
      allowedHeaders: problem.allowedHeaders,
      bannedFunctions: problem.bannedFunctions,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
    });
    if (result.code || !result.outputs) {
      const resultCode = result.code || ResultCode.CE;
      return {
        outputCodes: Array.from({ length: testcases.length }, () => resultCode),
        compilationTime: result.compilationTime,
        compilationMemory: result.compilationMemory,
        executionTime: result.totalExecutionTime,
        executionMemory: result.maxExecutionMemory,
      };
    }
    const outputCodes: ResultCode[] = [];
    for (const [index, output] of result.outputs.entries()) {
      if (output.code) {
        outputCodes.push(output.code);
        continue;
      }
      const expectedOutput = testcases[index].output;
      if (compareOutput(output.runtimeOutput, expectedOutput)) {
        outputCodes.push(ResultCode.AC);
      } else {
        outputCodes.push(ResultCode.WA);
      }
    }
    return {
      outputCodes,
      compilationTime: result.compilationTime,
      compilationMemory: result.compilationMemory,
      executionTime: result.totalExecutionTime,
      executionMemory: result.maxExecutionMemory,
    };
  }
}
