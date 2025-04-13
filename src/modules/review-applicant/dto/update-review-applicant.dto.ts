import { PartialType } from '@nestjs/mapped-types';
import { CreateReviewApplicantDto } from './create-review-applicant.dto';

export class UpdateReviewApplicantDto extends PartialType(CreateReviewApplicantDto) {}
