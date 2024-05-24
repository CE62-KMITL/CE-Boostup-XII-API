import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module, forwardRef } from '@nestjs/common';
import { CompilerModule } from 'src/compiler/compiler.module';
import { ProblemsModule } from 'src/problems/problems.module';
import { UsersModule } from 'src/users/users.module';

import { Submission } from './entities/submission.entity';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Submission]),
    UsersModule,
    forwardRef(() => ProblemsModule),
    CompilerModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
