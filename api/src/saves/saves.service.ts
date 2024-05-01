import { EntityManager, EntityRepository } from '@mikro-orm/mariadb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { CreateSaveDto } from './dto/create-save.dto';
import { UpdateSaveDto } from './dto/update-save.dto';
import { Save } from './entities/save.entity';

@Injectable()
export class SavesService {
  constructor(
    @InjectRepository(Save)
    private readonly savesRepository: EntityRepository<Save>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(createSaveDto: CreateSaveDto) {
    return 'This action adds a new save';
  }

  async findAll() {
    return `This action returns all saves`;
  }

  async findOne(id: string) {
    return `This action returns a #${id} save`;
  }

  async update(id: string, updateSaveDto: UpdateSaveDto) {
    return `This action updates a #${id} save`;
  }

  async remove(id: string) {
    return `This action removes a #${id} save`;
  }
}
