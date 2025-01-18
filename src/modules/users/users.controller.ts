import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQuery } from './dto/query-pagination-user.dto';
import { updateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { UploadAvatarUserDto } from './dto/upload-avatar-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { multerOptions } from 'src/config/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReqUser } from 'src/common/decorators/user.decorator';
import { IUser } from './interface/users.interface';
import { CreateListUserDto } from './dto/create-list-user.dto';
import { PayloadAuthOtpDto } from './dto/payload-auth-otp.dto';
import { PayloadChangePasswordDto } from './dto/payload-change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ResMessage('Tạo mới người dùng thành công!')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ResMessage('Tạo danh sách người dùng thành công!')
  @Post('/batch')
  createBatch(@Body() createListUserDto: CreateListUserDto) {
    return this.usersService.createBatch(createListUserDto);
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

  @ResMessage('Cập nhật ảnh đại diện người dùng thành công!')
  @Patch('/upload/avatar')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  updateAvatar(
    @ReqUser() user: IUser,
    @Body() data: UploadAvatarUserDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(user.id, data, image);
  }

  @Get('/me/profile')
  getProfile(@ReqUser() user: IUser) {
    return this.usersService.getProfile(user);
  }

  @ResMessage('Cập nhật thông tin cá nhân thành công!')
  @Patch('/me/profile')
  updateProfile(@ReqUser() user: IUser, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUserProfile(user, updateUserDto);
  }

  @ResMessage('Xóa người dùng thành công!')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Public()
  @ResMessage('Cập nhật trạng thái hoạt động của tài khoản')
  @Get('/list-active/status')
  updateActiveStatus() {
    return this.usersService.updateStatusAccountUsersInSystem();
  }

  @Public()
  @ResMessage('Vui lòng kiểm tra email để lấy mã OTP')
  @Post('/send-mail-otp')
  sendMailOTP(@Body() data: { email: string }) {
    console.log(data);
    return this.usersService.sendMailOTP(data.email);
  }

  @Public()
  @ResMessage('Xác thực mã OTP thành công! Vui lòng đổi mật khẩu')
  @Post('/verify-otp')
  verifyOTP(@Body() data: PayloadAuthOtpDto) {
    return this.usersService.verifyOTP(data.email, data.otp);
  }

  @Public()
  @ResMessage('Đổi mật khẩu thành cônng!')
  @Post('/change-password')
  changePassword(@Body() data: PayloadChangePasswordDto) {
    return this.usersService.changePassword(
      data.email,
      data.new_password,
      data.temp_token,
    );
  }
}
