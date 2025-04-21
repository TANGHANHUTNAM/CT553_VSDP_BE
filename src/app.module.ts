import KeyvRedis from '@keyv/redis';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CustomThrottlerGuard } from './auth/guards/custom-throttler.guard';
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
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { TasksModule } from './tasks/tasks.module';
import { Authorization } from './auth/guards/auth.guard';
import { FormsModule } from './modules/forms/forms.module';
import { SectionsFormModule } from './modules/sections-form/sections-form.module';
import { UniversityModule } from './modules/university/university.module';
import { FormResponsesModule } from './modules/form-responses/form-responses.module';
import { ScoringSectionsModule } from './modules/scoring-sections/scoring-sections.module';
import { ScoringCriteriasModule } from './modules/scoring-criterias/scoring-criterias.module';
import { FormAssginmentResponseModule } from './modules/form-assginment-response/form-assginment-response.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReviewApplicantModule } from './modules/review-applicant/review-applicant.module';
import { PublicModule } from './public/public.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        stores: [
          new KeyvRedis(
            `redis://${configService.get<string>('REDIS_HOST')}:${configService.get<number>('REDIS_PORT')}`,
          ),
        ],
        ttl: configService.get<number>('REDIS_TTL'),
      }),
      inject: [ConfigService],
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
    FormsModule,
    SectionsFormModule,
    UniversityModule,
    FormResponsesModule,
    ScoringSectionsModule,
    ScoringCriteriasModule,
    FormAssginmentResponseModule,
    NotificationsModule,
    ReviewApplicantModule,
    PublicModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
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
