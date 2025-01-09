import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { updateRoleStatusDto } from './dto/update-role-status.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ResMessage('Tạo vai trò thành công!')
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @ResMessage('Lấy danh sách vai trò thành công!')
  @Get()
  findAllWithPagination() {
    return this.rolesService.findAllWithPagination();
  }

  @ResMessage('Lấy tất cả vai trò thành công!')
  @Get('/all')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @ResMessage('Update role success')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @ResMessage('Update role status success')
  @Patch('status/:id')
  updateRoleStatus(
    @Param('id') id: string,
    @Body() updateRoleStatusDto: updateRoleStatusDto,
  ) {
    return this.rolesService.updateRoleStatus(+id, +updateRoleStatusDto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }
}
