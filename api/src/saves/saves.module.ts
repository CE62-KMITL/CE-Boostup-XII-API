import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Save } from './entities/save.entity';
import { SavesController } from './saves.controller';
import { SavesService } from './saves.service';

@Module({
  imports: [MikroOrmModule.forFeature([Save])],
  controllers: [SavesController],
  providers: [SavesService],
})
export class SavesModule {}
