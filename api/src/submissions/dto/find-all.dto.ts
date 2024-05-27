import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationRequestDto } from 'src/shared/dto/pagination.dto';

import { ProgrammingLanguage } from '../entities/submission.entity';

export class FindAllDto extends PaginationRequestDto {
  @ApiPropertyOptional({ example: 'f6cd1537-ec46-4f9e-986c-ace31fa9a451' })
  @IsUUID('4')
  @IsOptional()
  owner?: string;

  @ApiPropertyOptional({ example: 'f6cd1537-ec46-4f9e-986c-ace31fa9a451' })
  @IsUUID('4')
  @IsOptional()
  problem?: string;

  @ApiPropertyOptional({ example: 'x = y;' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isAccepted?: boolean;

  @ApiPropertyOptional({ example: 'C++17' })
  @Transform(({ value }) => value.toLowerCase())
  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;
}
