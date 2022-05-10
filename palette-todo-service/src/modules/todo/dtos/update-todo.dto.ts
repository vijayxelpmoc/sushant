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
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  Id: string[];

  @IsOptional()
  @IsString()
  reminderAt: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  Status: string;

  @IsOptional()
  @IsString()
  Task_Status: string;

  @IsOptional()
  @IsString()
  Description: string;

  @IsEnum(TodoType)
  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  venue: string;

  @IsOptional()
  @IsString()
  eventAt: string;

  @IsOptional()
  @IsString()
  completeBy: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deletedResources: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignees: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TodoResourceDto)
  @IsArray()
  newResources: TodoResourceDto[];
}