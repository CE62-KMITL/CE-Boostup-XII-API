import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';
import { PaginationRequestDto } from 'src/shared/dto/pagination.dto';

export class FindAllDto extends PaginationRequestDto {
  @ApiPropertyOptional({ example: 'Arrary' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    example: ['28fdc367-e76c-4b60-912a-de937aa40f7f'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  tags: string[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'integer',
      minimum: ConfigConstants.problem.minDifficulty,
      maximum: ConfigConstants.problem.maxDifficulty,
    },
    example: [2, 3],
  })
  @IsArray()
  @ArrayUnique()
  @IsNumber({}, { each: true })
  @Min(ConfigConstants.problem.minDifficulty, { each: true })
  @Max(ConfigConstants.problem.maxDifficulty, { each: true })
  difficulties: number[];
}
