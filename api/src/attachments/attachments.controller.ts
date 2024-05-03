import { createReadStream } from 'fs';

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
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { Express } from 'express';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@ApiBearerAuth()
@ApiTags('attachments')
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.ATTACHMENTS_STORAGE_DIR || './attachments',
        filename: (_, file, cb) =>
          cb(null, `${uuidv4()}.${file.originalname.split('.').pop()}`),
      }),
    }),
  )
  async create(
    @Body() createAttachmentDto: CreateAttachmentDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 100 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    return await this.attachmentsService.create(createAttachmentDto, file);
  }

  @Get()
  async findAll() {
    return await this.attachmentsService.findAll();
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
    return await this.attachmentsService.findOne(id);
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
    return await this.attachmentsService.remove(id);
  }

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
    const attachment = await this.attachmentsService.findOne(id);
    const file = createReadStream(
      `${process.env.ATTACHMENTS_STORAGE_DIR}/${attachment.filename}`,
    );
    res.set({
      'Content-Type': attachment.type,
      'Content-Disposition': 'inline',
    });
    return new StreamableFile(file);
  }
}
