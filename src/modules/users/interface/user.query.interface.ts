import { PartialType } from '@nestjs/mapped-types';
import { QueryParams } from 'src/shared/utils';

export class UserQuery extends PartialType(QueryParams) {}
