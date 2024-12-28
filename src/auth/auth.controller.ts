import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor() {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  handleLogin(@Request() req) {
    return req.user;
  }
}
