import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptRecommendationDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;
}
