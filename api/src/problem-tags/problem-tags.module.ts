import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { ProblemTag } from './entities/problem-tag.entity';
import { ProblemTagsController } from './problem-tags.controller';
import { ProblemTagsService } from './problem-tags.service';

@Module({
  imports: [MikroOrmModule.forFeature([ProblemTag])],
  controllers: [ProblemTagsController],
  providers: [ProblemTagsService],
})
export class ProblemTagsModule {}
