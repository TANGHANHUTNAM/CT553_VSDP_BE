import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  const configService = app.get(ConfigService);

  // global pipes
  app.useGlobalPipes(new ValidationPipe());

  // global interceptors
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  // cookie parser
  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
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
