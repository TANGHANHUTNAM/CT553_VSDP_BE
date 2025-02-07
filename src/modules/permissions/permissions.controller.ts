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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { PermssionQuery } from './dto/query-pagination-permission.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ResMessage('Tạo quyền hạn thành công!')
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @ResMessage('Lấy danh sách quyền có phân trang thành công!')
  @Get()
  findAllWithPagination(@Query() query: PermssionQuery) {
    return this.permissionsService.findAllWithPagination(query);
  }

  @ResMessage('Lấy tất cả quyền hạn thành công!')
  @Get('/all')
  findAll() {
    return this.permissionsService.findAll();
  }

  @ResMessage('Lấy tất cả quyền hạn của vai trò thành công!')
  @Get('/role/:id')
  findAllByRoleId(@Param('id') id: string) {
    return this.permissionsService.findAllByRoleId(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(+id);
  }

  @ResMessage('Cập nhật quyền hạn thành công!')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(+id, updatePermissionDto);
  }

  @ResMessage('Xóa quyền hạn thành công!')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(+id);
  }
}
