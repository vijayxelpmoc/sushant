import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class TodoResourceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}

export class CreateTodoResourcesDto {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  todoId: string[];

  @ValidateNested({ each: true })
  @Type(() => TodoResourceDto)
  @IsArray()
  resources: TodoResourceDto[];
}
