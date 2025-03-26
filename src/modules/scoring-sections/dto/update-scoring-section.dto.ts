import { PartialType } from '@nestjs/mapped-types';
import { CreateScoringSectionDto } from './create-scoring-section.dto';

export class UpdateScoringSectionDto extends PartialType(CreateScoringSectionDto) {}
