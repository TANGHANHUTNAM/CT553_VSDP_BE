import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/modules/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FirebaseAuthStrategy } from './strategies/firebase-auth.strategy';
import passport from 'passport';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    PassportModule.register({ defaultStrategy: 'firebase-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('EXPIRED_ACCESS_TOKEN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, FirebaseAuthStrategy],
  controllers: [AuthController],
  exports: [PassportModule],
})
export class AuthModule {}
