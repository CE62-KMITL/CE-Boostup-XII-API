import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginationRequestDto {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsInt()
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsInt()
  @IsOptional()
  perPage: number = 100;

  @ApiPropertyOptional({ example: 'createdAt' })
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
