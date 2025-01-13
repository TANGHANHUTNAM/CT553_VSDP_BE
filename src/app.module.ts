import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { Authorization } from './auth/guards/auth.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CoreModule } from './core/core.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';
import { LogModule } from './log/log.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000,
        limit: 60,
      },
    ]),
    UsersModule,
    CoreModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    HealthModule,
    DatabaseModule,
    CloudinaryModule,
    TasksModule,
    LogModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: Authorization,
    // },
  ],
})
export class AppModule {}
