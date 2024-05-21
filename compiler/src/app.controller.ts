import { Body, Controller, Get, Post } from '@nestjs/common';

import { AppService } from './app.service';
import {
  CompileAndRunDto,
  CompileAndRunResponse,
} from './dto/compile-and-run.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('box-statuses')
  async getBoxStatuses(): Promise<{ total: number; available: number[] }> {
    return await this.appService.getBoxStatuses();
  }

  @Post('compile-and-run')
  async compileAndRun(
    @Body() compileAndRunDto: CompileAndRunDto,
  ): Promise<CompileAndRunResponse> {
    return this.appService.compileAndRun(compileAndRunDto);
  }
}
