import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CompilerModule } from 'src/compiler/compiler.module';
import { UsersModule } from 'src/users/users.module';

import { Problem } from './entities/problem.entity';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';

@Module({
  imports: [MikroOrmModule.forFeature([Problem]), UsersModule, CompilerModule],
  controllers: [ProblemsController],
  providers: [ProblemsService],
  exports: [ProblemsService],
})
export class ProblemsModule {}
