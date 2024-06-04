import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { PaginationRequestDto } from 'src/shared/dto/pagination.dto';
import { CompletionStatus } from 'src/shared/enums/completion-status.enum';
import { PublicationStatus } from 'src/shared/enums/publication-status.enum';

export class FindAllDto extends PaginationRequestDto {
  @ApiPropertyOptional({ type: 'string', example: 'Arrary' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    type: 'string',
    example: 'f6cd1537-ec46-4f9e-986c-ace31fa9a451',
  })
  @IsUUID('4')
  @IsOptional()
  owner?: string;

  @ApiPropertyOptional({
    type: 'string',
    example: '28fdc367-e76c-4b60-912a-de937aa40f7f',
  })
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({
    type: 'string',
    example: '2,3',
  })
  @Matches(/^[0-9]+(,[0-9]+)*$/, {
    message: 'Difficulties must be a comma-separated list of integers',
  })
  @IsOptional()
  difficulties?: string;

  @ApiPropertyOptional({ example: 'Published', enum: PublicationStatus })
  @IsEnum(PublicationStatus)
  @IsOptional()
  publicationStatus?: PublicationStatus;

  @ApiPropertyOptional({ example: 'Unattempted', enum: CompletionStatus })
  @IsEnum(CompletionStatus)
  @IsOptional()
  completionStatus?: CompletionStatus;
}
