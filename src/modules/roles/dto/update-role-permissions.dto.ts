import { IsNumber, IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';

export class updateRolePermissionsDto {
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  permissions: number[];
}
