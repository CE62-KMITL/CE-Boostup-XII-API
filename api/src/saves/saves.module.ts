import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ProblemsModule } from 'src/problems/problems.module';
import { UsersModule } from 'src/users/users.module';

import { Save } from './entities/save.entity';
import { SavesController } from './saves.controller';
import { SavesService } from './saves.service';

@Module({
  imports: [MikroOrmModule.forFeature([Save]), UsersModule, ProblemsModule],
  controllers: [SavesController],
  providers: [SavesService],
})
export class SavesModule {}
