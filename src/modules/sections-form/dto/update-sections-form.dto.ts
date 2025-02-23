import { PartialType } from '@nestjs/mapped-types';
import { CreateSectionsFormDto } from './create-sections-form.dto';

export class UpdateSectionsFormDto extends PartialType(CreateSectionsFormDto) {}
