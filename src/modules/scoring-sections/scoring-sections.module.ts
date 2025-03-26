import { Module } from '@nestjs/common';
import { ScoringSectionsService } from './scoring-sections.service';
import { ScoringSectionsController } from './scoring-sections.controller';

@Module({
  controllers: [ScoringSectionsController],
  providers: [ScoringSectionsService],
})
export class ScoringSectionsModule {}
