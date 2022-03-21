import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class TodoResourceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;
}

export class CreateTodoResourcesDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  todoId: string[];

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => TodoResourceDto)
  @IsArray()
  resources: TodoResourceDto[];
}
