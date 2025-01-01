import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/modules/users/interface/users.interface';
import { ConfigService } from '@nestjs/config';
import { IPayload } from './interface/payload.interface';
import { Response } from 'express';
import ms from 'ms';
import { KEY_COOKIE } from 'src/shared/constant';
import { User } from '@prisma/client';
@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      const isValidPassword = this.usersService.isValidPassword(
        password,
        user.password,
      );
      delete user.password;
      return isValidPassword ? user : null;
    }

    return null;
  }

  async getAccount(user: IUser) {
    try {
      const account = await this.usersService.getAccountUser(user.id);
      return { account };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async login(user: IUser, response: Response) {
    const payload: IPayload = {
      email: user.email,
      sub: 'access token login',
      id: user.id,
      name: user.name,
      roleId: user.roleId,
    };
    const refreshToken = this.createRefreshToken({
      ...payload,
      sub: 'refresh token login',
    });
    await this.usersService.updateUserRefreshToken(user.id, refreshToken);

    response.cookie(KEY_COOKIE.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('MAX_AGE_COOKIE')),
    });
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async logout(user: IUser, response: Response) {
    try {
      await this.usersService.updateUserRefreshToken(user.id, null);
      response.clearCookie(KEY_COOKIE.REFRESH_TOKEN);
      return 'ok';
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  createRefreshToken(payload: IPayload) {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('EXPIRED_REFRESH_TOKEN'),
    });
    return refreshToken;
  }

  async generateNewAccessToken(refresh_token: string, response: Response) {
    try {
      const payload: IPayload = this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
      const user = await this.usersService.findRefreshTokenByUserId(payload.id);
      console.log(user);

      if (!user || user.refresh_token !== refresh_token) {
        throw new UnauthorizedException('Invalid token sss');
      }

      const newPayload: IPayload = {
        email: user.email,
        sub: 'access token',
        id: user.id,
        name: user.name,
        roleId: user.roleId,
      };

      console.log(newPayload);
      const newRefreshToken = this.createRefreshToken({
        ...newPayload,
        sub: 'refresh token',
      });

      await this.usersService.updateUserRefreshToken(user.id, newRefreshToken);
      response.clearCookie(KEY_COOKIE.REFRESH_TOKEN);
      response.cookie(KEY_COOKIE.REFRESH_TOKEN, refresh_token, {
        httpOnly: true,
        maxAge: ms(this.configService.get<string>('MAX_AGE_COOKIE')),
      });

      return {
        access_token: this.jwtService.sign(newPayload),
      };
    } catch (error) {
      console.log(error);
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid token');
      } else throw error;
    }
  }
}
