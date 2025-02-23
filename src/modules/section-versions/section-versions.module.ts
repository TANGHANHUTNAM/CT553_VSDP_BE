import { Module } from '@nestjs/common';
import { SectionVersionsService } from './section-versions.service';
import { SectionVersionsController } from './section-versions.controller';

@Module({
  controllers: [SectionVersionsController],
  providers: [SectionVersionsService],
})
export class SectionVersionsModule {}
