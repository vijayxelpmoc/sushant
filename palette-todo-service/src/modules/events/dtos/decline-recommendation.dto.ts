import { IsArray, IsString } from 'class-validator';

export class DeclineRecommendationDto {
  @IsArray()
  @IsString({ each: true })
  recommendationId: string[];
}
