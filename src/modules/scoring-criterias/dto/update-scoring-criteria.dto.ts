import { PartialType } from '@nestjs/mapped-types';
import { CreateScoringCriteriaDto } from './create-scoring-criteria.dto';

export class UpdateScoringCriteriaDto extends PartialType(CreateScoringCriteriaDto) {}
