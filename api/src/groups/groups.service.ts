import { EntityManager, EntityRepository, wrap } from '@mikro-orm/mariadb';
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
    private readonly em: EntityManager,
  ) {}

  async create(createGroupDto: CreateGroupDto) {
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
    await this.em.persistAndFlush(group);
    return this.buildGroupResponse(group);
  }

  async findAll() {
    return await this.groupsRepository.findAll();
  }

  async findOne(id: string) {
    const group = await this.groupsRepository.findOne({ id }, { populate: ['members'] });
    if (!group) {
      throw new NotFoundException({
        message: 'Group not found',
        errors: { id: 'Group not found' },
      });
    }
    return group;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto) {
    const group = await this.groupsRepository.findOne({ id });
    if (!group) {
      throw new NotFoundException({
        message: 'Group not found',
        errors: { id: 'Group not found' },
      });
    }
    wrap(group).assign(updateGroupDto);
    this.groupsRepository.assign(group, updateGroupDto);
    await this.em.flush();
    return this.buildGroupResponse(group);
  }

  async remove(id: string) {
    this.groupsRepository.nativeDelete({ id });
    return;
  }

  private buildGroupResponse(group: Group) {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      members: group.members,
      memberCount: group.memberCount,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}
