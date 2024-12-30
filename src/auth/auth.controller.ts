import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { Request, Response } from 'express';
import { ReqUser } from 'src/common/decorators/user.decorator';
import { IUser } from 'src/modules/users/interface/users.interface';
import { KEY_COOKIE } from 'src/shared/constant';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @ResMessage('Login success')
  @Post('login')
  handleLogin(@ReqUser() user, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(user, response);
  }

  @ResMessage('Get account success')
  @Get('account')
  handleGetAccount(@ReqUser() user: IUser) {
    return { user };
  }

  @Public()
  @ResMessage('Get refresh token success')
  @Get('refresh_token')
  handleRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refresh_token = req.cookies[KEY_COOKIE.REFRESH_TOKEN];
    return this.authService.generateNewAccessToken(refresh_token, response);
  }

  @ResMessage('Logout success')
  @Post('logout')
  handleLogout(
    @Res({ passthrough: true }) response: Response,
    @ReqUser() user: IUser,
  ) {
    return this.authService.logout(user, response);
  }
}
