import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TodoResourceDto } from './create-todo-resource.dto';
import { TodoType } from './create-todo.dto';

export class UpdateTodoDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  Id: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  Description: string;

  @ApiProperty({ required: false })
  @IsEnum(TodoType)
  @IsOptional()
  @IsString()
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  venue: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  eventAt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  completeBy: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deletedResources: string[];

  @ApiProperty({ type: Array.of(TodoResourceDto), required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TodoResourceDto)
  @IsArray()
  newResources: TodoResourceDto[];
}

export class UpdateStatusDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string;
}
