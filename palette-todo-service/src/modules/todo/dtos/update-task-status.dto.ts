import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

enum Status {
  Open = 'Open',
  Completed = 'Completed',
  In_progress = 'Closed',
}

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsString()
  taskId: string;

  @IsEnum(Status)
  @IsNotEmpty()
  status: string;
}
