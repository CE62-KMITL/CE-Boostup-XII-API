import { createReadStream } from 'fs';
import { join } from 'path';

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { Express } from 'express';
import type { Response } from 'express';
import { Public } from 'src/auth/public.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@ApiBearerAuth()
@ApiTags('attachments')
@Controller('attachments')
export class AttachmentsController {
  constructor(
    private readonly configService: ConfigService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createAttachmentDto: CreateAttachmentDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 100 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    return await this.attachmentsService.create(
      request.user,
      createAttachmentDto,
      file,
    );
  }

  @Roles(Role.Admin)
  @Get()
  async findAll(@Req() request: AuthenticatedRequest) {
    return await this.attachmentsService.findAll(request.user);
  }

  @Public()
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
    return await this.attachmentsService.findOne(request.user, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
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
    return await this.attachmentsService.remove(request.user, id);
  }

  @Public()
  @Get(':id/:name')
  @ApiParam({ name: 'name', type: 'string' })
  async download(
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
    const attachment = await this.attachmentsService.findOneInternal(id);
    const file = createReadStream(
      join(
        this.configService.getOrThrow<string>('storages.attachments.path'),
        attachment.filename,
      ),
    );
    res.set({
      'Content-Type': attachment.type,
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(file);
  }
}
