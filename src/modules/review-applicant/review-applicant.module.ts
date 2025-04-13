import { Module } from '@nestjs/common';
import { ReviewApplicantService } from './review-applicant.service';
import { ReviewApplicantController } from './review-applicant.controller';
import { FormResponsesModule } from '../form-responses/form-responses.module';

@Module({
  controllers: [ReviewApplicantController],
  providers: [ReviewApplicantService],
  imports: [FormResponsesModule],
})
export class ReviewApplicantModule {}
