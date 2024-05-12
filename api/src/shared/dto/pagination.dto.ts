import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginationRequest {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsOptional()
  perPage: number = 100;

  @ApiPropertyOptional({ example: 'id' })
  @IsString()
  @IsOptional()
  sort?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
}
