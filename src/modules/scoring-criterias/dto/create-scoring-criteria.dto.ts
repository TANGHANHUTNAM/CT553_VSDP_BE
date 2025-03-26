import { IsNumber, IsString } from 'class-validator';

export class CreateScoringCriteriaDto {
  @IsNumber()
  scoring_section_id: number;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  max_score: number;

  @IsNumber()
  min_score: number;
}
