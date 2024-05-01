import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { Attachment } from './entities/attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: EntityRepository<Attachment>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(createAttachmentDto: CreateAttachmentDto) {
    return 'This action adds a new attachment';
  }

  async findAll() {
    return `This action returns all attachments`;
  }

  async findOne(id: string) {
    return `This action returns a #${id} attachment`;
  }

  async update(id: string, updateAttachmentDto: UpdateAttachmentDto) {
    return `This action updates a #${id} attachment`;
  }

  async remove(id: string) {
    return `This action removes a #${id} attachment`;
  }
}
