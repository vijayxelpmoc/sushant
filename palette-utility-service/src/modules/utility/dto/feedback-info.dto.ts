import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

enum RatingType {
  GOOD = 'GOOD',
  MEH = 'MEH',
  BAD = 'BAD',
}

export class FeedbackInfoDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  feedback: string;

  @ApiProperty({ enum: RatingType, enumName: 'RatingTypes', required: true })
  @IsNotEmpty()
  @IsEnum(RatingType)
  rating: string;
}
