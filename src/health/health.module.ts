import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from 'src/core/prisma.service';
import { PrismaHealthIndicator } from './health.prisma';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PrismaService, PrismaHealthIndicator],
})
export class HealthModule {}
