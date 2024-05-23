import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

import { CompilerService } from './compiler/compiler.service';
import {
  CompileAndRunDto,
  CompileAndRunResponse,
} from './compiler/dto/compile-and-run.dto';

@Injectable()
export class AppService {
  constructor(private readonly compilerService: CompilerService) {}

  getRoot(): string {
    return 'Swagger UI is available at <a href="/api">/api</a>';
  }

  compileAndRun(
    compileAndRunDto: CompileAndRunDto,
  ): Observable<AxiosResponse<CompileAndRunResponse>> {
    return this.compilerService.compileAndRunStream(compileAndRunDto);
  }
}
