import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable, catchError, firstValueFrom, map } from 'rxjs';
import { ResultCode } from 'src/shared/enums/result-code.enum';

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
    try {
      const response = await this.getCompileAndRunResponse(compileAndRunDto);
      return new CompileAndRunResponse(response.data);
    } catch (error) {
      return new CompileAndRunResponse({
        code: ResultCode.IE,
      });
    }
  }

  private async getCompileAndRunResponse(
    compileAndRunDto: CompileAndRunDto,
  ): Promise<AxiosResponse<CompileAndRunResponse>> {
    const observable = this.httpService
      .post('compile-and-run', compileAndRunDto)
      .pipe(
        catchError((error) => {
          throw new HttpException(error.response.data, error.response.status);
        }),
      );
    return await firstValueFrom(observable);
  }

  compileAndRunStream(
    compileAndRunDto: CompileAndRunDto,
  ): Observable<AxiosResponse<CompileAndRunResponse>> {
    return this.httpService.post('compile-and-run', compileAndRunDto).pipe(
      map((response) => response.data),
      catchError((error) => {
        throw new HttpException(error.response.data, error.response.status);
      }),
    );
  }
}
