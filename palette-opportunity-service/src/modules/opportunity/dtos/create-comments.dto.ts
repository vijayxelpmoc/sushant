import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum CommentsTypesEnum {
  'Generic',
  'Approval',
}
export class CommentsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty()
  @IsEnum(CommentsTypesEnum)
  @IsNotEmpty()
  @IsString()
  commentType: string;
}
