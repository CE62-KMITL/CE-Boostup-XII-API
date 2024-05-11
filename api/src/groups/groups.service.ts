import * as fs from 'fs';
import { join } from 'path';

import {
  EntityManager,
  EntityRepository,
  FilterQuery,
} from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isSomeRolesIn } from 'src/auth/roles';
import { Role } from 'src/shared/enums/role.enum';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-request.interface';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './entities/group.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: EntityRepository<Group>,
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
  ) {}

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const nameExists = await this.groupsRepository.count({
      name: createGroupDto.name,
    });
    if (nameExists) {
      throw new BadRequestException({
        message: 'Group name already in use',
        errors: { name: 'Group name already in use' },
      });
    }
    const group = new Group();
    group.name = createGroupDto.name;
    group.description = createGroupDto.description;
    await this.entityManager.persistAndFlush(group);
    return group;
  }

  async findAll(originUser: AuthenticatedUser): Promise<Group[]> {
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = [
        'memberCount',
        'totalScore',
        'uniqueTotalScore',
        'problemSolvedCount',
        'uniqueProblemSolvedCount',
        'lastProblemSolvedAt',
        'createdAt',
        'updatedAt',
      ] as const;
      return await this.groupsRepository.findAll({ populate });
    }
    const populate = [
      'memberCount',
      'totalScore',
      'uniqueTotalScore',
      'problemSolvedCount',
      'uniqueProblemSolvedCount',
      'lastProblemSolvedAt',
    ] as const;
    return await this.groupsRepository.findAll({ populate });
  }

  async findOne(originUser: AuthenticatedUser, id: string): Promise<Group> {
    if (isSomeRolesIn(originUser.roles, [Role.Admin, Role.SuperAdmin])) {
      const populate = [
        'description',
        'members',
        'memberCount',
        'totalScore',
        'uniqueTotalScore',
        'problemSolvedCount',
        'uniqueProblemSolvedCount',
        'lastProblemSolvedAt',
      ] as const;
      const group = await this.groupsRepository.findOne({ id }, { populate });
      if (!group) {
        throw new NotFoundException({
          message: 'Group not found',
          errors: { id: 'Group not found' },
        });
      }
      return group;
    }
    const populate = [
      'members',
      'memberCount',
      'totalScore',
      'uniqueTotalScore',
      'problemSolvedCount',
      'uniqueProblemSolvedCount',
      'lastProblemSolvedAt',
      'createdAt',
      'updatedAt',
    ] as const;
    const group = await this.groupsRepository.findOne({ id }, { populate });
    if (!group) {
      throw new NotFoundException({
        message: 'Group not found',
        errors: { id: 'Group not found' },
      });
    }
    return group;
  }

  async findOneInternal(where: FilterQuery<Group>): Promise<Group> {
    const group = await this.groupsRepository.findOne(where, {
      populate: [
        'description',
        'members',
        'avatarFilename',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!group) {
      throw new NotFoundException({
        message: 'Group not found',
        errors: { where: 'Group not found' },
      });
    }
    return group;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOneInternal({ id });
    if (!group) {
      throw new NotFoundException({
        message: 'Group not found',
        errors: { id: 'Group not found' },
      });
    }
    if (updateGroupDto.avatar) {
      const matches = updateGroupDto.avatar.match(
        /^data:image\/(png|jpg|jpeg|webp|avif|gif|bmp);base64,((?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?)$/,
      );
      if (matches?.length !== 3) {
        throw new BadRequestException({
          message: 'Invalid base64 image',
          errors: { avatar: 'Invalid base64 image' },
        });
      }
      const [, fileExt, fileData] = matches;
      const filename = `${id}.${fileExt}`;
      if (group.avatarFilename) {
        await fs.promises.unlink(
          join(
            this.configService.getOrThrow<string>('storages.avatars.path'),
            group.avatarFilename,
          ),
        );
      }
      group.avatarFilename = filename;
      await fs.promises.writeFile(
        join(
          this.configService.getOrThrow<string>('storages.avatars.path'),
          filename,
        ),
        fileData,
        'base64',
      );
      delete updateGroupDto.avatar;
    }
    Object.assign(group, updateGroupDto);
    await this.entityManager.flush();
    return group;
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOneInternal({ id });
    if (!group) {
      throw new NotFoundException({
        message: 'Group not found',
        errors: { id: 'Group not found' },
      });
    }
    await this.entityManager.removeAndFlush(group);
    return;
  }
}
