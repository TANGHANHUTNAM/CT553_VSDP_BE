import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logService: LogService,
  ) {
    this.logService.setContext(DashboardService.name);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: string,
    endDate?: string,
    active?: boolean,
  ) {
    this.logService.log('Fetching dashboard data');
    const skip = (page - 1) * limit;

    const userWhere: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          {
            name: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        ],
      }),
      ...(active !== undefined && { active }),
    };

    // Define responseWhere with proper Prisma types
    const responseWhere: Prisma.FormResponsesWhereInput = {
      ...(search && {
        OR: [
          {
            name: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        ],
      }),
      ...(startDate &&
        endDate && {
          created_at: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    try {
      const [users, forms, formResponses, responseAssignments, responseScores] =
        await Promise.all([
          this.prismaService.user.findMany({
            skip,
            take: limit,
            where: userWhere,
            select: {
              id: true,
              name: true,
              email: true,
              role: { select: { name: true } },
              active: true,
              created_at: true,
            },
          }),
          this.prismaService.form.findMany({
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              scope: true,
              created_at: true,
              is_public: true,
            },
          }),
          this.prismaService.formResponses.findMany({
            skip,
            take: limit,
            where: responseWhere,
            select: {
              id: true,
              form_id: true,
              name: true,
              email: true,
              status: true,
              created_at: true,
              total_final_score: true,
            },
          }),
          this.prismaService.responseAssignments.findMany({
            skip,
            take: limit,
            select: {
              id: true,
              form_response_id: true,
              user_id: true,
              scoring_section_id: true,
              is_completed: true,
              completed_at: true,
              scoring_section: { select: { name: true } },
            },
          }),
          this.prismaService.responseScores.findMany({
            skip,
            take: limit,
            select: {
              created_at: true,
              score_value: true,
              scoring_criteria: { select: { name: true } },
            },
          }),
        ]);

      const formattedResponseScores = responseScores.map((score) => ({
        date: score.created_at.toISOString().split('T')[0],
        averageScore: score.score_value,
        section: score.scoring_criteria.name,
      }));

      return {
        users,
        forms,
        formResponses,
        responseAssignments,
        responseScores: formattedResponseScores,
      };
    } catch (error) {
      this.logService.error('Error fetching dashboard data', error);
      throw error;
    }
  }
}
