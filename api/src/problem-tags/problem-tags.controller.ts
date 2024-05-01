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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateProblemTagDto } from './dto/create-problem-tag.dto';
import { UpdateProblemTagDto } from './dto/update-problem-tag.dto';
import { ProblemTagsService } from './problem-tags.service';

@ApiBearerAuth()
@ApiTags('problem-tags')
@Controller('problem-tags')
export class ProblemTagsController {
  constructor(private readonly problemTagsService: ProblemTagsService) {}

  @Post()
  async create(@Body() createProblemTagDto: CreateProblemTagDto) {
    return await this.problemTagsService.create(createProblemTagDto);
  }

  @Get()
  async findAll() {
    return await this.problemTagsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    id: string,
  ) {
    return await this.problemTagsService.findOne(id);
  }

  @Patch(':id')
  async update(
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
    return await this.problemTagsService.update(id, updateProblemTagDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    id: string,
  ) {
    return await this.problemTagsService.remove(id);
  }
}
