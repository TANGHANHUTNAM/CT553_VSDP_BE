import { Module } from '@nestjs/common';
import { ScoringCriteriasService } from './scoring-criterias.service';
import { ScoringCriteriasController } from './scoring-criterias.controller';

@Module({
  controllers: [ScoringCriteriasController],
  providers: [ScoringCriteriasService],
})
export class ScoringCriteriasModule {}
