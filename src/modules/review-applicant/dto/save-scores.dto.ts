import { IsArray, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ScoreDto {
  @IsNotEmpty()
  @IsInt()
  scoring_criteria_id: number;

  @IsNotEmpty()
  @IsInt()
  score_value: number;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsNotEmpty()
  @IsInt()
  user_id: number;

  @IsNotEmpty()
  @IsInt()
  form_response_id: number;
}

export class SaveScoresDto {
  @IsInt()
  assignmentId: number;

  @IsArray()
  scores: ScoreDto[];
}
