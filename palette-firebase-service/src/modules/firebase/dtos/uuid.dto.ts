import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UuidDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  SFId: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  uuid: string;
}
