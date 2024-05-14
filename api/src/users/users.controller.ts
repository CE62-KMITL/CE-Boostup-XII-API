import { createReadStream } from 'fs';
import { join } from 'path';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from 'src/auth/public.decorator';
import { PaginatedResponse } from 'src/shared/dto/pagination.dto';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

import { Roles } from '../auth/roles.decorator';

import { CreateUserDto } from './dto/create-user.dto';
import { FindAllDto } from './dto/find-all.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  @Roles(Role.Admin)
  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponse> {
    return await this.usersService.create(request.user, createUserDto);
  }

  @Roles(Role.User, Role.Staff, Role.Admin)
  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() findAllDto: FindAllDto,
  ): Promise<PaginatedResponse<UserResponse>> {
    return await this.usersService.findAll(request.user, findAllDto);
  }

  @Roles(Role.User, Role.Staff)
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
  ): Promise<UserResponse> {
    return await this.usersService.findOne(request.user, id);
  }

  @Roles(Role.User, Role.Staff, Role.Admin)
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
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    return await this.usersService.update(request.user, id, updateUserDto);
  }

  @Roles(Role.Admin)
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
    return await this.usersService.remove(request.user, id);
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
    const user = await this.usersService.findOneInternal({ id });
    if (!user.avatarFilename) {
      throw new NotFoundException({
        message: 'Avatar not found',
        errors: { id: 'Avatar not found' },
      });
    }
    const file = createReadStream(
      join(
        this.configService.getOrThrow<string>('storages.avatars.path'),
        user.avatarFilename,
      ),
    );
    res.set({
      'Content-Type': `image/${user.avatarFilename.split('.').pop()}`,
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(file);
  }
}
