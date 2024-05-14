import { createReadStream } from 'fs';
import { join } from 'path';

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
  NotFoundException,
  ParseUUIDPipe,
  Res,
  StreamableFile,
  Req,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from 'src/auth/public.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

import { CreateGroupDto } from './dto/create-group.dto';
import { FindAllDto } from './dto/find-all.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponse } from './entities/group.entity';
import { GroupsService } from './groups.service';

@ApiBearerAuth()
@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly configService: ConfigService,
    private readonly groupsService: GroupsService,
  ) {}

  @Roles(Role.Admin)
  @Post()
  async create(@Body() createGroupDto: CreateGroupDto): Promise<GroupResponse> {
    return await this.groupsService.create(createGroupDto);
  }

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() findAllDto: FindAllDto,
  ): Promise<PaginatedResponse<GroupResponse>> {
    return await this.groupsService.findAll(request.user, findAllDto);
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
  ): Promise<GroupResponse> {
    return await this.groupsService.findOne(request.user, id);
  }

  @Roles(Role.Admin)
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
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<GroupResponse> {
    return await this.groupsService.update(request.user, id, updateGroupDto);
  }

  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    id: string,
  ): Promise<void> {
    return await this.groupsService.remove(id);
  }

  @Public()
  @Get(':id/avatar')
  async getAvatar(
    @Res({ passthrough: true }) res: Response,
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    id: string,
  ): Promise<StreamableFile> {
    const group = await this.groupsService.findOneInternal(id);
    if (!group.avatarFilename) {
      throw new NotFoundException({
        message: 'Avatar not found',
        errors: { id: 'Avatar not found' },
      });
    }
    const file = createReadStream(
      join(
        this.configService.getOrThrow<string>('storages.avatars.path'),
        group.avatarFilename,
      ),
    );
    res.set({
      'Content-Type': `image/${group.avatarFilename.split('.').pop()}`,
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(file);
  }
}
