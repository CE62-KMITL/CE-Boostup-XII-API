import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

import { CompilerService } from './compiler/compiler.service';
import {
  CompileAndRunDto,
  CompileAndRunResponse,
} from './compiler/dto/compile-and-run.dto';

@Injectable()
export class AppService {
  constructor(
    private readonly compilerService: CompilerService,
    private readonly configService: ConfigService,
  ) {}

  getRoot(): string {
    const urlPrefix = this.configService.getOrThrow<string>('url.prefix');
    return `Swagger UI is available at <a href="${urlPrefix}/docs">${urlPrefix}/docs</a>`;
  }

  compileAndRun(
    compileAndRunDto: CompileAndRunDto,
  ): Observable<AxiosResponse<CompileAndRunResponse>> {
    return this.compilerService.compileAndRunStream(compileAndRunDto);
  }
}
