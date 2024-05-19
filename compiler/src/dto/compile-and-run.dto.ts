import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';
import { OptimizationLevel } from 'src/enums/optimization-level.enum';
import { ProgrammingLanguage } from 'src/enums/programming-language.enum';
import { ResultCode } from 'src/enums/result-code.enum';
import { WarningLevel } from 'src/enums/warning-level.enum';

export class CompileAndRunDto {
  @ApiProperty({ example: 'C++17', enum: ProgrammingLanguage })
  @Transform(({ value }) => value.toLowerCase())
  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;

  @ApiPropertyOptional({ example: 'O1', enum: OptimizationLevel })
  @Transform(
    ({ value }) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
  )
  @IsEnum(OptimizationLevel)
  @IsOptional()
  optimizationLevel: OptimizationLevel = OptimizationLevel.O1;

  @ApiPropertyOptional({ example: 'extra', enum: WarningLevel })
  @Transform(({ value }) => value.toLowerCase())
  @IsEnum(WarningLevel)
  @IsOptional()
  warningLevel: WarningLevel = WarningLevel.Extra;

  @ApiProperty({
    maxLength: ConfigConstants.compiler.maxCodeLength,
    example:
      '"#include <stdio.h>\\n\\nint main() {\\n    int a, b;\\n    scanf(\\"%d %d\\", &a, &b);\\n    printf(\\"%d\\n\\", a + b);\\n    return 0;\\n}"',
  })
  @IsString()
  @MaxLength(ConfigConstants.compiler.maxCodeLength)
  code: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    example: ['1 1', '2 2', '3 3'],
  })
  @IsArray()
  @ArrayMaxSize(ConfigConstants.executor.maxInputCount)
  @MaxLength(ConfigConstants.executor.maxInputSize, { each: true })
  @IsString({ each: true })
  inputs: string[];

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

  @ApiPropertyOptional({
    minimum: 0,
    maximum: ConfigConstants.executor.maxTimeLimit,
    example: ConfigConstants.executor.defaultTimeLimit,
  })
  @IsNumber()
  @Min(0)
  @Max(ConfigConstants.executor.maxTimeLimit)
  @IsOptional()
  timeLimit: number = ConfigConstants.executor.defaultTimeLimit;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: ConfigConstants.executor.maxMemoryLimit,
    example: ConfigConstants.executor.defaultMemoryLimit,
  })
  @IsNumber()
  @Min(0)
  @Max(ConfigConstants.executor.maxMemoryLimit)
  @IsOptional()
  memoryLimit: number = ConfigConstants.executor.defaultMemoryLimit;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: ConfigConstants.compiler.maxTimeLimit,
    example: ConfigConstants.compiler.defaultTimeLimit,
  })
  @IsNumber()
  @Min(0)
  @Max(ConfigConstants.compiler.maxTimeLimit)
  @IsOptional()
  compilationTimeLimit: number = ConfigConstants.compiler.defaultTimeLimit;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: ConfigConstants.compiler.maxMemoryLimit,
    example: ConfigConstants.compiler.defaultMemoryLimit,
  })
  @IsNumber()
  @Min(0)
  @Max(ConfigConstants.compiler.maxMemoryLimit)
  @IsOptional()
  compilationMemoryLimit: number = ConfigConstants.compiler.defaultMemoryLimit;

  @ApiPropertyOptional({
    type: 'boolean',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  formattedDiagnostic: boolean = false;
}

interface ICompileAndRunResponse {
  totalRuntime?: number;
  compilerOutput?: string;
  compilationTime?: number;
  compilationMemory?: number;
  executableSize?: number;
  code?: ResultCode;
  outputs?: {
    runtimeOutput: string;
    executionTime?: number;
    executionMemory?: number;
    code?: ResultCode;
  }[];
}

export class CompileAndRunResponse {
  totalRuntime: number | null;
  compilerOutput: string | null;
  compilationTime: number | null;
  compilationMemory: number | null;
  executableSize: number | null;
  code: ResultCode | null;
  outputs:
    | {
        runtimeOutput: string;
        executionTime?: number;
        executionMemory?: number;
        code?: ResultCode;
      }[]
    | null;

  constructor({
    totalRuntime,
    compilerOutput,
    compilationTime,
    compilationMemory,
    executableSize,
    code,
    outputs,
  }: ICompileAndRunResponse = {}) {
    this.totalRuntime = totalRuntime || null;
    this.compilerOutput = compilerOutput || null;
    this.compilationTime = compilationTime || null;
    this.compilationMemory = compilationMemory || null;
    this.executableSize = executableSize || null;
    this.code = code || null;
    this.outputs = outputs || null;
  }
}
