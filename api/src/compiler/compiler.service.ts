import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable, catchError, firstValueFrom, map } from 'rxjs';

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
    const observable = this.httpService
      .post('compile-and-run', compileAndRunDto)
      .pipe(
        catchError((error) => {
          throw new HttpException(error.response.data, error.response.status);
        }),
      );
    const response = await firstValueFrom(observable);
    return new CompileAndRunResponse(response.data);
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
