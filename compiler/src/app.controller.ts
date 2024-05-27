import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { AppService } from './app.service';
import {
  CompileAndRunDto,
  CompileAndRunResponse,
} from './dto/compile-and-run.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(): string {
    return this.appService.getRoot();
  }

  @Get('box-statuses')
  async getBoxStatuses(): Promise<{ total: number; available: number[] }> {
    return await this.appService.getBoxStatuses();
  }

  @HttpCode(HttpStatus.OK)
  @Post('compile-and-run')
  async compileAndRun(
    @Body() compileAndRunDto: CompileAndRunDto,
  ): Promise<CompileAndRunResponse> {
    return this.appService.compileAndRun(compileAndRunDto);
  }
}