import * as fs from 'fs';

import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { Attachment } from './entities/attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: EntityRepository<Attachment>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(
    // user: User, // TODO: Add user authentication
    createAttachmentDto: CreateAttachmentDto,
    file: Express.Multer.File,
  ): Promise<Attachment> {
    // TODO: Add rate limiting
    const user = (await this.entityManager.getRepository(User).findAll())[0];
    const attachmentId = file.filename.split('.')[0];
    const attachmentName = createAttachmentDto.name || file.originalname;
    const attachment = new Attachment();
    attachment.id = attachmentId;
    attachment.name = attachmentName;
    attachment.filename = file.filename;
    attachment.type = file.mimetype;
    attachment.size = file.size;
    attachment.owner = user;
    await this.entityManager.persistAndFlush(attachment);
    return attachment;
  }

  async findAll(): Promise<Attachment[]> {
    return await this.attachmentsRepository.findAll();
  }

  async findOne(id: string): Promise<Attachment> {
    const attachment = await this.attachmentsRepository.findOne({ id });
    if (!attachment) {
      throw new NotFoundException({
        message: 'Attachment not found',
        errors: { id: 'Attachment not found' },
      });
    }
    return attachment;
  }

  async remove(id: string): Promise<void> {
    const attachment = await this.attachmentsRepository.findOne({ id });
    if (!attachment) {
      throw new NotFoundException({
        message: 'Attachment not found',
        errors: { id: 'Attachment not found' },
      });
    }
    await fs.promises.unlink(
      `${process.env.ATTACHMENTS_STORAGE_LOCATION || './attachments'}/${attachment.id}`,
    );
    this.entityManager.removeAndFlush(attachment);
    return;
  }
}
