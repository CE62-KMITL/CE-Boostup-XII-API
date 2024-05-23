import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  ParseUUIDPipe,
  Req,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

import { CreateSubmissionDto } from './dto/create-submission.dto';
import { FindAllDto } from './dto/find-all.dto';
import { SubmissionResponse } from './entities/submission.entity';
import { SubmissionsService } from './submissions.service';

@ApiBearerAuth()
@ApiTags('submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createSubmissionDto: CreateSubmissionDto,
  ): Promise<SubmissionResponse> {
    return await this.submissionsService.create(
      request.user,
      createSubmissionDto,
    );
  }

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() findAllDto: FindAllDto,
  ): Promise<PaginatedResponse<SubmissionResponse>> {
    return await this.submissionsService.findAll(request.user, findAllDto);
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
  ): Promise<SubmissionResponse> {
    return await this.submissionsService.findOne(request.user, id);
  }
}
