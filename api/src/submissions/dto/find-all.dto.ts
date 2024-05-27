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
  @ApiPropertyOptional({
    type: 'string',
    example: 'f6cd1537-ec46-4f9e-986c-ace31fa9a451',
  })
  @IsUUID('4')
  @IsOptional()
  owner?: string;

  @ApiPropertyOptional({
    type: 'string',
    example: 'f6cd1537-ec46-4f9e-986c-ace31fa9a451',
  })
  @IsUUID('4')
  @IsOptional()
  problem?: string;

  @ApiPropertyOptional({ type: 'string', example: 'x = y;' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ type: 'boolean', example: true })
  @IsBoolean()
  @IsOptional()
  isAccepted?: boolean;

  @ApiPropertyOptional({ example: 'C++17', enum: ProgrammingLanguage })
  @Transform(({ value }) => value.toLowerCase())
  @IsEnum(ProgrammingLanguage)
  @IsOptional()
  language?: ProgrammingLanguage;
}
