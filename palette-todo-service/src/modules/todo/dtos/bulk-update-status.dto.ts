import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Status } from './create-todo.dto';

export class BulkUpdateTodoStatusDto {
  @IsNotEmpty()
  @IsArray()
  todoIds: string[];

  @IsEnum(Status)
  @IsNotEmpty()
  @IsString()
  todoStatus: string;
}
