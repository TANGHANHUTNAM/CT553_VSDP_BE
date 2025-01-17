import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PrismaModule } from './core/prisma.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { LogModule } from './log/log.module';
import { MailModule } from './mail/mail.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';

import { TasksModule } from './tasks/tasks.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { CustomThrottlerGuard } from './auth/guards/custom-throttler.guard';
@Global()
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
    PrismaModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    HealthModule,
    DatabaseModule,
    CloudinaryModule,
    TasksModule,
    LogModule,
    RabbitmqModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
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
