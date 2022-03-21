import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Status } from './create-todo.dto';

export class BulkUpdateTodoStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  todoIds: string[];

  @ApiProperty({ enum: Status })
  @IsEnum(Status)
  @IsNotEmpty()
  @IsString()
  todoStatus: string;
}
