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

  create(createSaveDto: CreateSaveDto) {
    return 'This action adds a new save';
  }

  findAll() {
    return `This action returns all saves`;
  }

  findOne(id: number) {
    return `This action returns a #${id} save`;
  }

  update(id: number, updateSaveDto: UpdateSaveDto) {
    return `This action updates a #${id} save`;
  }

  remove(id: number) {
    return `This action removes a #${id} save`;
  }
}
