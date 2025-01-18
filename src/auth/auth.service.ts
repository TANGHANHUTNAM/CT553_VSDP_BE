import {
  BadRequestException,
  Global,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import ms from 'ms';
import { IUser } from 'src/modules/users/interface/users.interface';
import { UsersService } from 'src/modules/users/users.service';
import { KEY_COOKIE } from 'src/shared/constant';
import { IPayload } from './interface/payload.interface';
import { LogService } from 'src/log/log.service';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private logService: LogService,
  ) {
    this.logService.setContext(AuthService.name);
  }

  async validateUserGoogle(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    return user ?? null;
  }

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
      return { user: account };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async login(user: IUser, response: Response) {
    const payload: IPayload = {
      email: user.email,
      sub: 'access token',
      id: user.id,
      name: user.name,
      roleId: user.roleId,
    };
    const refreshToken = this.createRefreshToken({
      ...payload,
      sub: 'refresh token',
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

      if (!user || user.refresh_token !== refresh_token) {
        throw new UnauthorizedException('Invalid token');
      }

      const newPayload: IPayload = {
        email: user.email,
        sub: 'access token',
        id: user.id,
        name: user.name,
        roleId: user.roleId,
      };

      const newRefreshToken = this.createRefreshToken({
        ...newPayload,
        sub: 'refresh token',
      });

      await this.usersService.updateUserRefreshToken(user.id, newRefreshToken);
      response.clearCookie(KEY_COOKIE.REFRESH_TOKEN);
      response.cookie(KEY_COOKIE.REFRESH_TOKEN, newRefreshToken, {
        httpOnly: true,
        maxAge: ms(this.configService.get<string>('MAX_AGE_COOKIE')),
      });

      return {
        access_token: this.jwtService.sign(newPayload),
      };
    } catch (error) {
      console.log(error);

      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid Refresh Token');
      } else throw error;
    }
  }
}
