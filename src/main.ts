import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { initFirebaseApp } from './config/firebase.app';
dayjs.extend(utc);

dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.tz.setDefault('Asia/Ho_Chi_Minh');

async function bootstrap() {
  initFirebaseApp();

  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  const configService = app.get(ConfigService);
  app.useLogger(['error', 'warn', 'debug']);

  // global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // whitelist: true,
    }),
  );

  // global interceptors
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  // cookie parser
  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:4000', 'http://localhost:3000'],
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
    credentials: true,
  });

  // config version
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,

    defaultVersion: ['1'],
  });

  // helmet
  app.use(helmet());

  await app.listen(configService.get<string>('PORT') ?? 5000);
}
bootstrap();
