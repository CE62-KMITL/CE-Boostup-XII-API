import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
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
        compilerOutput: 'Internal compiler service error\n',
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
          if (error.response) {
            throw new HttpException(error.response.data, error.response.status);
          } else {
            throw new ServiceUnavailableException({
              message: 'Compiler service is unavailable',
            });
          }
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
        if (error.response) {
          throw new HttpException(error.response.data, error.response.status);
        } else {
          throw new ServiceUnavailableException({
            message: 'Compiler service is unavailable',
          });
        }
      }),
    );
  }
}