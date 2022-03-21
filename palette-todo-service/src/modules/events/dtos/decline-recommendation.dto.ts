import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DeclineRecommendationDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  recommendationId: string[];
}
