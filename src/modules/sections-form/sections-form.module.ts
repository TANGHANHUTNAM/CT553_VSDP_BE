import { Module } from '@nestjs/common';
import { SectionsFormService } from './sections-form.service';
import { SectionsFormController } from './sections-form.controller';

@Module({
  controllers: [SectionsFormController],
  providers: [SectionsFormService],
})
export class SectionsFormModule {}
