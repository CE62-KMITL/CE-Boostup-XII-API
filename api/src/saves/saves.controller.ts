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
import { Throttle } from '@nestjs/throttler';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

import { CreateSaveDto } from './dto/create-save.dto';
import { FindAllDto } from './dto/find-all.dto';
import { UpdateSaveDto } from './dto/update-save.dto';
import { SaveResponse } from './entities/save.entity';
import { SavesService } from './saves.service';

@ApiBearerAuth()
@ApiTags('saves')
@Controller('saves')
export class SavesController {
  constructor(private readonly savesService: SavesService) {}

  @Throttle({
    short: { limit: 5 },
    medium: { limit: 10 },
    long: { limit: 20 },
  })
  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createSaveDto: CreateSaveDto,
  ): Promise<SaveResponse> {
    return await this.savesService.create(request.user, createSaveDto);
  }

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() findAllDto: FindAllDto,
  ): Promise<PaginatedResponse<SaveResponse>> {
    return await this.savesService.findAll(request.user, findAllDto);
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
  ): Promise<SaveResponse> {
    return await this.savesService.findOne(request.user, id);
  }

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
    @Body() updateSaveDto: UpdateSaveDto,
  ): Promise<SaveResponse> {
    return await this.savesService.update(request.user, id, updateSaveDto);
  }

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
    return await this.savesService.remove(request.user, id);
  }
}
