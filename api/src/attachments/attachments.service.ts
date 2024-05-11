import * as fs from 'fs';
import { join } from 'path';

import {
  EntityManager,
  EntityRepository,
  FilterQuery,
} from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isSomeRolesIn } from 'src/auth/roles';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';
import { User } from 'src/users/entities/user.entity';

import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { Attachment } from './entities/attachment.entity';

@Injectable()
export class AttachmentsService implements OnModuleInit {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: EntityRepository<Attachment>,
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.createAttachmentDirectory();
  }

  async createAttachmentDirectory(): Promise<void> {
    const attachmentsPath = this.configService.getOrThrow<string>(
      'storages.attachments.path',
    );
    try {
      await fs.promises.access(attachmentsPath);
    } catch (error) {
      await fs.promises.mkdir(attachmentsPath, { recursive: true });
    }
  }

  async create(
    originUser: AuthenticatedUser,
    createAttachmentDto: CreateAttachmentDto,
    file: Express.Multer.File,
  ): Promise<Attachment> {
    // TODO: Add rate limiting
    const user = await this.entityManager
      .getRepository(User)
      .findOne({ id: originUser.id });
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        errors: { token: 'Invalid token' },
      });
    }
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

  async findAll(originUser: AuthenticatedUser): Promise<Attachment[]> {
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = ['owner', 'filename', 'createdAt'] as const;
      return await this.attachmentsRepository.findAll({ populate });
    }
    const populate = ['owner'] as const;
    return await this.attachmentsRepository.findAll({ populate });
  }

  async findOne(
    originUser: AuthenticatedUser,
    id: string,
  ): Promise<Attachment> {
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = ['owner', 'filename', 'createdAt'] as const;
      const attachment = await this.attachmentsRepository.findOne(
        { id },
        { populate },
      );
      if (!attachment) {
        throw new NotFoundException({
          message: 'Attachment not found',
          errors: { id: 'Attachment not found' },
        });
      }
      return attachment;
    }
    const populate = ['owner'] as const;
    const attachment = await this.attachmentsRepository.findOne(
      { id },
      { populate },
    );
    if (!attachment) {
      throw new NotFoundException({
        message: 'Attachment not found',
        errors: { id: 'Attachment not found' },
      });
    }
    return attachment;
  }

  async findOneInternal(where: FilterQuery<Attachment>): Promise<Attachment> {
    const attachment = await this.attachmentsRepository.findOne(where, {
      populate: ['owner', 'filename', 'createdAt'],
    });
    if (!attachment) {
      throw new NotFoundException({
        message: 'Attachment not found',
        errors: { where: 'Attachment not found' },
      });
    }
    return attachment;
  }

  async remove(originUser: AuthenticatedUser, id: string): Promise<void> {
    const attachment = await this.findOneInternal({ id });
    if (!attachment) {
      throw new NotFoundException({
        message: 'Attachment not found',
        errors: { id: 'Attachment not found' },
      });
    }
    if (
      originUser.id !== attachment.owner.id &&
      !isSomeRolesIn(originUser.roles, [Role.SuperAdmin])
    ) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        errors: { id: 'Insufficient permissions' },
      });
    }
    await fs.promises.unlink(
      join(
        this.configService.getOrThrow<string>('storages.attachments.path'),
        attachment.filename,
      ),
    );
    this.entityManager.removeAndFlush(attachment);
    return;
  }
}
