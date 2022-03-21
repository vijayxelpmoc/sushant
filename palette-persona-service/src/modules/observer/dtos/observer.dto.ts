import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ObserverDto {
  @IsNotEmpty()
  @Length(4)
  institute_details: string;

  // @IsNotEmpty()
  // designation: string;

  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  // @IsArray()
  @IsString({ each: true })
  Interests: Array<string>;
}
