import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { QueryParams } from 'src/shared/utils';
import { UserQuery } from './dto/query-pagination-user.dto';
import { User } from './entities/user.entity';
import { updateUserStatusDto } from './dto/update-user-status.dto';
import { ResMessage } from 'src/common/decorators/response.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ResMessage('Tạo mới người dùng thành công!')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ResMessage('Lấy danh sách người dùng có phân trang thành công!')
  @Get()
  findAll(@Query() query: UserQuery) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @ResMessage('Cập nhật trạng thái người dùng thành công!')
  @Patch('/status/:id')
  updateStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: updateUserStatusDto,
  ) {
    return this.usersService.updateStatus(+id, +updateUserStatusDto.status);
  }

  @ResMessage('Cập nhật thông tin người dùng thành công!')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
