import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginationRequestDto {
  @ApiPropertyOptional({ type: 'integer', example: 1 })
  @IsNumber()
  @IsInt()
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ type: 'integer', example: 100 })
  @IsNumber()
  @IsInt()
  @IsOptional()
  perPage: number = 100;

  @ApiPropertyOptional({ type: 'string', example: 'createdAt' })
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
