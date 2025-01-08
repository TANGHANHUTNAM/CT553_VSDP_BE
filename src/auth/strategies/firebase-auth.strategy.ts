import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { auth } from 'firebase-admin';
import { ExtractJwt, Strategy } from 'passport-firebase-jwt';
import { AuthService } from '../auth.service';
import { IUser } from 'src/modules/users/interface/users.interface';

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(
  Strategy,
  'firebase-jwt',
) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('access_token'),
    });
  }

  async validate(token: string) {
    try {
      const firebaseUser = await auth().verifyIdToken(token, true);
      if (!firebaseUser) {
        throw new UnauthorizedException('Access token không hợp lệ!');
      }
      const user = await this.authService.validateUserGoogle(
        firebaseUser.email,
      );
      if (!user) {
        throw new UnauthorizedException(
          'Bạn không có quyền truy cập hệ thống!',
        );
      }
      const newUser: IUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
      };
      return newUser;
    } catch (error) {
      console.log('Firebase Token Validation Error:', error);
      throw new UnauthorizedException('Bạn không có quyền truy cập hệ thống!');
    }
  }
}
