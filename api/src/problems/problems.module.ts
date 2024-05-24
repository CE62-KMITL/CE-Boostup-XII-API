import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AttachmentsModule } from 'src/attachments/attachments.module';
import { CompilerModule } from 'src/compiler/compiler.module';
import { ProblemTagsModule } from 'src/problem-tags/problem-tags.module';
import { SubmissionsModule } from 'src/submissions/submissions.module';
import { UsersModule } from 'src/users/users.module';

import { Problem } from './entities/problem.entity';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Problem]),
    UsersModule,
    SubmissionsModule,
    ProblemTagsModule,
    AttachmentsModule,
    CompilerModule,
  ],
  controllers: [ProblemsController],
  providers: [ProblemsService],
  exports: [ProblemsService],
})
export class ProblemsModule {}
