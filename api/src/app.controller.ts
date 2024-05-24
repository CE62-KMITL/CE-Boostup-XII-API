import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

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
  @HttpCode(HttpStatus.OK)
  @Post('/compile-and-run')
  compileAndRun(
    @Body() compileAndRunDto: CompileAndRunDto,
  ): Observable<AxiosResponse<CompileAndRunResponse>> {
    return this.appService.compileAndRun(compileAndRunDto);
  }
}
