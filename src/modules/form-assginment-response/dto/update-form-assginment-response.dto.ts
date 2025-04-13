import { PartialType } from '@nestjs/mapped-types';
import { CreateFormAssginmentResponseDto } from './create-form-assginment-response.dto';

export class UpdateFormAssginmentResponseDto extends PartialType(CreateFormAssginmentResponseDto) {}
