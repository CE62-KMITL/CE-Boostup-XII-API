import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.decorator';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

import { CreateProblemDto } from './dto/create-problem.dto';
import { FindAllDto } from './dto/find-all.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { ProblemResponse } from './entities/problem.entity';
import { ProblemsService } from './problems.service';

@ApiBearerAuth()
@ApiTags('problems')
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Roles(Role.Staff, Role.Admin)
  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createProblemDto: CreateProblemDto,
  ): Promise<ProblemResponse> {
    return await this.problemsService.create(request.user, createProblemDto);
  }

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() findAllDto: FindAllDto,
  ): Promise<PaginatedResponse<ProblemResponse>> {
    return await this.problemsService.findAll(request.user, findAllDto);
  }

  @Get(':id')
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    id: string,
  ): Promise<ProblemResponse> {
    return await this.problemsService.findOne(request.user, id);
  }

  @Roles(Role.Staff, Role.Admin)
  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    id: string,
    @Body() updateProblemDto: UpdateProblemDto,
  ): Promise<ProblemResponse> {
    return await this.problemsService.update(
      request.user,
      id,
      updateProblemDto,
    );
  }

  @Roles(Role.Staff, Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    id: string,
  ): Promise<void> {
    return await this.problemsService.remove(request.user, id);
  }
}
