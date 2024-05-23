import { Injectable } from '@nestjs/common';

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

  async compileAndRun(
    compileAndRunDto: CompileAndRunDto,
  ): Promise<CompileAndRunResponse> {
    return await this.compilerService.compileAndRun(compileAndRunDto);
  }
}
