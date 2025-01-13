import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { Request, Response } from 'express';
import { ReqUser } from 'src/common/decorators/user.decorator';
import { IUser } from 'src/modules/users/interface/users.interface';
import { KEY_COOKIE } from 'src/shared/constant';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @ResMessage('Đăng nhập thành công!')
  @Post('login')
  handleLogin(
    @ReqUser() user: IUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(user, response);
  }

  @Public()
  @ResMessage('Đăng nhập thành công!')
  @UseGuards(FirebaseAuthGuard)
  @Post('login-google')
  handleLoginGoogle(
    @ReqUser() user,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(user, response);
  }

  @ResMessage('Get account success')
  @Get('account')
  handleGetAccount(@ReqUser() user: IUser) {
    return this.authService.getAccount(user);
  }

  @Public()
  @ResMessage('Get access token success')
  @Get('refresh_token')
  handleRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refresh_token = req.cookies[KEY_COOKIE.REFRESH_TOKEN];
    return this.authService.generateNewAccessToken(refresh_token, response);
  }

  @ResMessage('Đăng xuất thành công!')
  @Post('logout')
  handleLogout(
    @Res({ passthrough: true }) response: Response,
    @ReqUser() user: IUser,
  ) {
    return this.authService.logout(user, response);
  }
}
