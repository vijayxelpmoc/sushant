import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptRecommendationDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  eventId: string;
}
