import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { CreateProblemTagDto } from './dto/create-problem-tag.dto';
import { UpdateProblemTagDto } from './dto/update-problem-tag.dto';
import { ProblemTagsService } from './problem-tags.service';

@Controller('problem-tags')
export class ProblemTagsController {
  constructor(private readonly problemTagsService: ProblemTagsService) {}

  @Post()
  create(@Body() createProblemTagDto: CreateProblemTagDto) {
    return this.problemTagsService.create(createProblemTagDto);
  }

  @Get()
  findAll() {
    return this.problemTagsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.problemTagsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProblemTagDto: UpdateProblemTagDto,
  ) {
    return this.problemTagsService.update(+id, updateProblemTagDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.problemTagsService.remove(+id);
  }
}
