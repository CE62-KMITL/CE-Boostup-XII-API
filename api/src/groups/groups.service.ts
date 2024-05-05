import * as fs from 'fs';

import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './entities/group.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: EntityRepository<Group>,
    private readonly entityManager: EntityManager,
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

  async findAll(): Promise<Group[]> {
    return await this.groupsRepository.findAll({
      populate: [
        'memberCount',
        'totalScore',
        'uniqueTotalScore',
        'problemSolvedCount',
        'uniqueProblemSolvedCount',
        'lastProblemSolvedAt',
      ],
    });
  }

  async findOne(
    id: string,
    populate: (keyof Group)[] = [
      'members',
      'memberCount',
      'totalScore',
      'uniqueTotalScore',
      'problemSolvedCount',
      'uniqueProblemSolvedCount',
      'lastProblemSolvedAt',
    ],
  ): Promise<Group> {
    const group = await this.groupsRepository.findOne({ id }, { populate });
    if (!group) {
      throw new NotFoundException({
        message: 'Group not found',
        errors: { id: 'Group not found' },
      });
    }
    return group;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupsRepository.findOne({ id });
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
          `${process.env.AVATARS_STORAGE_LOCATION || '.avatars'}/${group.avatarFilename}`,
        );
      }
      group.avatarFilename = filename;
      await fs.promises.writeFile(
        `${process.env.AVATARS_STORAGE_LOCATION || '.avatars'}/${filename}`,
        fileData,
        'base64',
      );
      delete updateGroupDto.avatar;
    }
    this.groupsRepository.assign(group, updateGroupDto);
    await this.entityManager.flush();
    return group;
  }

  async remove(id: string): Promise<void> {
    const group = await this.groupsRepository.findOne({ id });
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
