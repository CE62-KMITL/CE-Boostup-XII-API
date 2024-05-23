import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CompilerModule } from 'src/compiler/compiler.module';
import { UsersModule } from 'src/users/users.module';

import { Submission } from './entities/submission.entity';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Submission]),
    UsersModule,
    CompilerModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
