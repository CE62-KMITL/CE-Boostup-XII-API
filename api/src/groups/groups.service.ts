import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
  ) {}

  async create(createGroupDto: CreateGroupDto) {
    const group = new Group();
    group.name = createGroupDto.name;
    group.description = createGroupDto.description;
    return await this.groupsRepository.save(group);
  }

  async findAll() {
    return await this.groupsRepository.find();
  }

  async findOne(id: string) {
    return await this.groupsRepository.findOne({
      where: { id },
      relations: ['members'],
    });
  }

  async update(id: string, updateGroupDto: UpdateGroupDto) {
    const result = await this.groupsRepository.update(id, updateGroupDto);
    if (!result.affected) {
      return null;
    }
    return await this.groupsRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    return await this.groupsRepository.delete(id);
  }
}
