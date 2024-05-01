import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Problem } from './entities/problem.entity';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';

@Module({
  imports: [MikroOrmModule.forFeature([Problem])],
  controllers: [ProblemsController],
  providers: [ProblemsService],
})
export class ProblemsModule {}
