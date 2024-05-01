import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OptimizationLevel } from 'src/shared/enums/optimization-level.enum';
import { ProgrammingLanguage } from 'src/shared/enums/programming-language.enum';

export class CreateProblemDto {
  @ApiProperty({ maxLength: 32, example: 'A + B Problem' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    maxLength: 65535,
    example: 'Calculate the sum of two numbers',
  })
  @IsString()
  @MaxLength(65535)
  description: string;

  @ApiProperty({
    maxLength: 65535,
    example: '2 numbers separated by a space',
  })
  @IsString()
  @MaxLength(65535)
  input: string;

  @ApiProperty({
    maxLength: 65535,
    example: 'The sum of the two numbers',
  })
  @IsString()
  @MaxLength(65535)
  output: string;

  @ApiProperty({
    maxLength: 65535,
    example: 'Use the + operator',
  })
  @IsString()
  @MaxLength(65535)
  hint: string;

  @ApiProperty({ minimum: 0, example: 100 })
  @IsNumber()
  @Min(0)
  hihtCost: number;

  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    minLength: 1,
    example: [
      { input: '1 1', output: '2' },
      { input: '2 2', output: '4' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Testcase)
  testcases: Testcase[];

  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    minLength: 1,
    example: [{ input: '1 1', output: '2' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Testcase)
  exampleTestcases: Testcase[];

  @ApiProperty({
    maxLength: 65535,
    example:
      '"#include <stdio.h>\\n\\nint main() {\\n    int a, b;\\n    scanf(\\"%d %d\\", &a, &b);\\n    printf(\\"%d\\n\\", a + b);\\n    return 0;\\n}"',
  })
  @IsString()
  @MaxLength(65535)
  starterCode: string;

  @ApiProperty({
    maxLength: 65535,
    example:
      '"#include <stdio.h>\\n\\nint main() {\\n    int a, b;\\n    scanf(\\"%d %d\\", &a, &b);\\n    printf(\\"%d\\n\\", a + b);\\n    return 0;\\n}"',
  })
  @IsString()
  @MaxLength(65535)
  solution: string;

  @ApiProperty({ example: 'C++17' })
  @IsEnum(ProgrammingLanguage)
  solutionLanguage: ProgrammingLanguage;

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    example: ['stdio.h'],
  })
  @IsArray()
  @IsString({ each: true })
  allowedHeaders: string[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    example: ['system'],
  })
  @IsArray()
  @IsString({ each: true })
  bannedFunctions: string[];

  @ApiProperty({ minimum: 0, example: 0.01 })
  @IsNumber()
  @Min(0)
  timeLimit: number;

  @ApiProperty({ minimum: 0, example: 16384 })
  @IsNumber()
  @Min(0)
  memoryLimit: number;

  @ApiProperty({ minimum: 0, maximum: 5, example: 1 })
  @IsNumber()
  @Min(0)
  @Max(5)
  difficulty: number;

  @ApiProperty({ minimum: 0, example: 100 })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiProperty({ example: 'O1' })
  @IsEnum(OptimizationLevel)
  optimizationLevel: OptimizationLevel;

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    example: ['28fdc367-e76c-4b60-912a-de937aa40f7f'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  attachments: string[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    example: ['28fdc367-e76c-4b60-912a-de937aa40f7f'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  tags: string[];

  @ApiProperty({ maxLength: 65535, example: 'The great book of knowledge' })
  @IsString()
  @MaxLength(65535)
  credits: string;
}

export class Testcase {
  @IsString()
  @MaxLength(65535)
  input: string;

  @IsString()
  @MaxLength(65535)
  output: string;
}
