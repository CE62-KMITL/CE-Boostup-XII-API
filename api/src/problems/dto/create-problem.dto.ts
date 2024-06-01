import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';
import { OptimizationLevel } from 'src/shared/enums/optimization-level.enum';
import { ProgrammingLanguage } from 'src/shared/enums/programming-language.enum';

export class CreateProblemDto {
  @ApiProperty({
    type: 'string',
    minLength: ConfigConstants.problem.minTitleLength,
    maxLength: ConfigConstants.problem.maxTitleLength,
    example: 'A + B Problem',
  })
  @IsString()
  @MinLength(ConfigConstants.problem.minTitleLength)
  @MaxLength(ConfigConstants.problem.maxTitleLength)
  title: string;

  @ApiPropertyOptional({
    type: 'string',
    maxLength: ConfigConstants.problem.maxDescriptionLength,
    example: 'Calculate the sum of two numbers',
  })
  @IsString()
  @MaxLength(ConfigConstants.problem.maxDescriptionLength)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    maxLength: ConfigConstants.problem.maxInputLength,
    example: '2 numbers separated by a space',
  })
  @IsString()
  @MaxLength(ConfigConstants.problem.maxInputLength)
  @IsOptional()
  input?: string;

  @ApiPropertyOptional({
    type: 'string',
    maxLength: ConfigConstants.problem.maxOutputLength,
    example: 'The sum of the two numbers',
  })
  @IsString()
  @MaxLength(ConfigConstants.problem.maxOutputLength)
  @IsOptional()
  output?: string;

  @ApiPropertyOptional({
    type: 'string',
    maxLength: ConfigConstants.problem.maxHintLength,
    example: 'Use the + operator',
  })
  @IsString()
  @MaxLength(ConfigConstants.problem.maxHintLength)
  @IsOptional()
  hint?: string;

  @ApiPropertyOptional({ type: 'integer', minimum: 0, example: 100 })
  @IsNumber()
  @IsInt()
  @Min(0)
  @ValidateIf((object) => object.hint !== undefined)
  hintCost?: number;

  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    minLength: ConfigConstants.problem.minTestcaseCount,
    maxLength: ConfigConstants.problem.maxTestcaseCount,
    example: [
      { input: '1 1', output: '2' },
      { input: '2 2', output: '4' },
    ],
  })
  @IsArray()
  @ArrayMinSize(ConfigConstants.problem.minTestcaseCount)
  @ArrayMaxSize(ConfigConstants.problem.maxTestcaseCount)
  @ValidateNested({ each: true })
  @Type(() => Testcase)
  testcases: Testcase[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    minLength: ConfigConstants.problem.minExampleTestcaseCount,
    maxLength: ConfigConstants.problem.maxExampleTestcaseCount,
    example: [{ input: '1 1', output: '2' }],
  })
  @IsArray()
  @ArrayMinSize(ConfigConstants.problem.minExampleTestcaseCount)
  @ArrayMaxSize(ConfigConstants.problem.maxExampleTestcaseCount)
  @ValidateNested({ each: true })
  @Type(() => Testcase)
  @IsOptional()
  exampleTestcases?: Testcase[];

  @ApiPropertyOptional({
    type: 'string',
    maxLength: ConfigConstants.problem.maxStarterCodeLength,
    example:
      '#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d\\n", a + b);\n    return 0;\n}',
  })
  @IsString()
  @MaxLength(ConfigConstants.problem.maxStarterCodeLength)
  @IsOptional()
  starterCode?: string;

  @ApiProperty({
    type: 'string',
    maxLength: ConfigConstants.problem.maxSolutionLength,
    example:
      '#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d\\n", a + b);\n    return 0;\n}',
  })
  @IsString()
  @MaxLength(ConfigConstants.problem.maxSolutionLength)
  solution: string;

  @ApiProperty({ example: 'C++17', enum: ProgrammingLanguage })
  @Transform(({ value }) => value.toLowerCase())
  @IsEnum(ProgrammingLanguage)
  solutionLanguage: ProgrammingLanguage;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    example: ['stdio.h'],
  })
  @IsArray()
  @IsString({ each: true })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  allowedHeaders?: string[] | null;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    example: ['system'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  bannedFunctions?: string[];

  @ApiPropertyOptional({
    type: 'number',
    minimum: 0,
    maximum: ConfigConstants.problem.maxTimeLimit,
    example: ConfigConstants.problem.defaultTimeLimit,
  })
  @IsNumber()
  @Min(0)
  @Max(ConfigConstants.problem.maxTimeLimit)
  @IsOptional()
  timeLimit?: number;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 0,
    maximum: ConfigConstants.problem.maxMemoryLimit,
    example: ConfigConstants.problem.defaultMemoryLimit,
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(ConfigConstants.problem.maxMemoryLimit)
  @IsOptional()
  memoryLimit?: number;

  @ApiProperty({
    type: 'integer',
    minimum: ConfigConstants.problem.minDifficulty,
    maximum: ConfigConstants.problem.maxDifficulty,
    example: 1,
  })
  @IsNumber()
  @IsInt()
  @Min(ConfigConstants.problem.minDifficulty)
  @Max(ConfigConstants.problem.maxDifficulty)
  difficulty: number;

  @ApiProperty({ type: 'integer', minimum: 0, example: 100 })
  @IsNumber()
  @IsInt()
  @Min(0)
  score: number;

  @ApiPropertyOptional({ example: 'O1', enum: OptimizationLevel })
  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(OptimizationLevel)
  @IsOptional()
  optimizationLevel?: OptimizationLevel;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    example: ['28fdc367-e76c-4b60-912a-de937aa40f7f'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    example: ['28fdc367-e76c-4b60-912a-de937aa40f7f'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    type: 'string',
    maxLength: ConfigConstants.problem.maxCreditsLength,
    example: 'The great book of knowledge',
  })
  @IsString()
  @MaxLength(ConfigConstants.problem.maxCreditsLength)
  @IsOptional()
  credits?: string;
}

export class Testcase {
  @IsString()
  @MaxLength(ConfigConstants.problem.maxTestcaseInputLength)
  input: string;

  @IsString()
  @MaxLength(ConfigConstants.problem.maxTestcaseOutputLength)
  output: string;
}

export const createProblemDtoDefault: Partial<CreateProblemDto> = {
  description: '',
  input: '',
  output: '',
  hint: '',
  exampleTestcases: [],
  starterCode: '',
  allowedHeaders: [],
  bannedFunctions: [],
  timeLimit: ConfigConstants.problem.defaultTimeLimit,
  memoryLimit: ConfigConstants.problem.defaultMemoryLimit,
  optimizationLevel: OptimizationLevel.O1,
  attachments: [],
  tags: [],
  credits: '',
};
