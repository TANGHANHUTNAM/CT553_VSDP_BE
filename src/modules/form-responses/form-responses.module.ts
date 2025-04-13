import { Module } from '@nestjs/common';
import { FormResponsesService } from './form-responses.service';
import { FormResponsesController } from './form-responses.controller';
import { SectionsFormModule } from '../sections-form/sections-form.module';

@Module({
  controllers: [FormResponsesController],
  providers: [FormResponsesService],
  imports: [SectionsFormModule],
  exports: [FormResponsesService],
})
export class FormResponsesModule {}
