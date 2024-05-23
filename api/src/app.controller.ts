import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { AppService } from './app.service';
import { Public } from './auth/public.decorator';
import {
  CompileAndRunDto,
  CompileAndRunResponse,
} from './compiler/dto/compile-and-run.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getRoot(): string {
    return this.appService.getRoot();
  }

  @ApiBearerAuth()
  @Post('/compile-and-run')
  async compileAndRun(
    @Body() compileAndRunDto: CompileAndRunDto,
  ): Promise<CompileAndRunResponse> {
    return await this.appService.compileAndRun(compileAndRunDto);
  }
}
