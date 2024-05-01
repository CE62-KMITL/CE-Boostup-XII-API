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
    return await this.groupsRepository.findAll();
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupsRepository.findOne(
      { id },
      { populate: ['members'] },
    );
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
    if (updateGroupDto.name) {
      group.name = updateGroupDto.name;
    }
    if (updateGroupDto.description) {
      group.description = updateGroupDto.description;
    }
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
