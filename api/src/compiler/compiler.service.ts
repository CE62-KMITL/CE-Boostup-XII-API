import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import {
  CompileAndRunDto,
  CompileAndRunResponse,
} from './dto/compile-and-run.dto';

@Injectable()
export class CompilerService {
  constructor(private readonly httpService: HttpService) {}

  async compileAndRun(
    compileAndRunDto: CompileAndRunDto,
  ): Promise<CompileAndRunResponse> {
    const observable = this.httpService.post(
      'compile-and-run',
      compileAndRunDto,
    );
    const response = await firstValueFrom(observable);
    return new CompileAndRunResponse(response.data);
  }
}
