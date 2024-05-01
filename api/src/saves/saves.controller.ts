import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SavesService } from './saves.service';
import { CreateSaveDto } from './dto/create-save.dto';
import { UpdateSaveDto } from './dto/update-save.dto';

@Controller('saves')
export class SavesController {
  constructor(private readonly savesService: SavesService) {}

  @Post()
  create(@Body() createSaveDto: CreateSaveDto) {
    return this.savesService.create(createSaveDto);
  }

  @Get()
  findAll() {
    return this.savesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.savesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSaveDto: UpdateSaveDto) {
    return this.savesService.update(+id, updateSaveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.savesService.remove(+id);
  }
}
