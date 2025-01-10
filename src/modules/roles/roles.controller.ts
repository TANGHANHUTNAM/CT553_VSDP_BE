import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { updateRoleStatusDto } from './dto/update-role-status.dto';
import { RoleQuery } from './dto/query-pagination-role.dto';
import { updateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ResMessage('Tạo vai trò thành công!')
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @ResMessage('Lấy danh sách vai trò phân trang thành công!')
  @Get()
  findAllWithPagination(@Query() query: RoleQuery) {
    return this.rolesService.findAllWithPagination(query);
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

  @ResMessage('Cập nhật vai trò thành công!')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @ResMessage('Cập nhật trạng thái vai trò thành công!')
  @Patch('status/:id')
  updateRoleStatus(
    @Param('id') id: string,
    @Body() updateRoleStatusDto: updateRoleStatusDto,
  ) {
    return this.rolesService.updateRoleStatus(+id, +updateRoleStatusDto.status);
  }

  @ResMessage('Cấp quyền hạn vai trò thành công!')
  @Patch('/:id/permissions')
  updateRolePermission(
    @Param('id') id: string,
    @Body() body: updateRolePermissionsDto,
  ) {
    return this.rolesService.updateRolePermission(+id, body);
  }

  @ResMessage('Xóa vai trò thành công!')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }
}
