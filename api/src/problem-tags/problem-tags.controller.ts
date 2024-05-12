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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

import { CreateProblemTagDto } from './dto/create-problem-tag.dto';
import { UpdateProblemTagDto } from './dto/update-problem-tag.dto';
import { ProblemTagsService } from './problem-tags.service';

@ApiBearerAuth()
@ApiTags('problem-tags')
@Controller('problem-tags')
export class ProblemTagsController {
  constructor(private readonly problemTagsService: ProblemTagsService) {}

  @Roles(Role.Staff, Role.Admin)
  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createProblemTagDto: CreateProblemTagDto,
  ) {
    return await this.problemTagsService.create(
      request.user,
      createProblemTagDto,
    );
  }

  @Get()
  async findAll(@Req() request: AuthenticatedRequest) {
    return await this.problemTagsService.findAll(request.user);
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
  ) {
    return await this.problemTagsService.findOne(request.user, id);
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
    @Body() updateProblemTagDto: UpdateProblemTagDto,
  ) {
    return await this.problemTagsService.update(
      request.user,
      id,
      updateProblemTagDto,
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
  ) {
    return await this.problemTagsService.remove(request.user, id);
  }
}
