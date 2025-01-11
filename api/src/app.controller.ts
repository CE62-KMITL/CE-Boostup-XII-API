import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

import { AppService } from './app.service';
import { Public } from './auth/public.decorator';
import {
  CompileAndRunDto,
  CompileAndRunResponse,
} from './compiler/dto/compile-and-run.dto';
import { ConfigConstants } from './config/config-constants';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getRoot(): string {
    return this.appService.getRoot();
  }

  @ApiTags('compiler')
  @ApiBearerAuth()
  @Throttle(ConfigConstants.secondaryRateLimits.compileAndRun)
  @HttpCode(HttpStatus.OK)
  @Post('/compile-and-run')
  compileAndRun(
    @Body() compileAndRunDto: CompileAndRunDto,
  ): Observable<AxiosResponse<CompileAndRunResponse>> {
    return this.appService.compileAndRun(compileAndRunDto);
  }

  @ApiTags('compiler')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Get('compiler-status')
  getCompilerStatus(): Observable<AxiosResponse> {
    return this.appService.getCompilerStatus();
  }
}
