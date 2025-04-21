import {
  BadRequestException,
  ForbiddenException,
  Get,
  Injectable,
  Query,
} from '@nestjs/common';
import { CreateReviewApplicantDto } from './dto/create-review-applicant.dto';
import { UpdateReviewApplicantDto } from './dto/update-review-applicant.dto';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';
import { FormResponsesService } from '../form-responses/form-responses.service';
import { SaveScoresDto } from './dto/save-scores.dto';

@Injectable()
export class ReviewApplicantService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logService: LogService,
    private readonly FormResponsesService: FormResponsesService,
  ) {
    this.logService.setContext(ReviewApplicantService.name);
  }

  create(createReviewApplicantDto: CreateReviewApplicantDto) {
    return 'This action adds a new reviewApplicant';
  }

  findAll() {
    return `This action returns all reviewApplicant`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reviewApplicant`;
  }

  update(id: number, updateReviewApplicantDto: UpdateReviewApplicantDto) {
    return `This action updates a #${id} reviewApplicant`;
  }

  remove(id: number) {
    return `This action removes a #${id} reviewApplicant`;
  }

  async getFormResponseAssignedForReviewer(reviewerId: number) {
    try {
      const assignments = await this.prismaService.responseAssignments.findMany(
        {
          where: {
            user_id: reviewerId,
            is_completed: false,
          },
          include: {
            form_response: {
              include: {
                form: true,
              },
            },
            scoring_section: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      );
      return assignments.map((assignment) => ({
        id: assignment.id,
        form_response: {
          id: assignment.form_response.id,
          name: assignment.form_response.name,
          form_id: assignment.form_response.form_id,
        },
        scoring_section: {
          id: assignment.scoring_section.id,
          name: assignment.scoring_section.name,
        },
        created_at: assignment.created_at,
      }));
    } catch (error) {
      this.logService.error(`Error getting form response: ${error.message}`);
      throw error;
    }
  }

  async getDetailAssignment(user_id: number, assignment_id: number) {
    try {
      const assignment =
        await this.prismaService.responseAssignments.findUnique({
          where: {
            id: assignment_id,
          },
          include: {
            scoring_section: {
              include: {
                scoring_criteria: true,
              },
            },
          },
        });
      if (!assignment) {
        throw new BadRequestException('Không tìm thấy assignment');
      }
      if (assignment.user_id !== user_id) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập vào nội dung phân công này!',
        );
      }
      const form_response =
        await this.FormResponsesService.getFormResponseDetail(
          assignment.form_response_id,
        );
      const formatData = {
        ...assignment,
        form_response,
      };
      return formatData;
    } catch (error) {
      this.logService.error(error);
      throw new BadRequestException('Lỗi khi lấy thông tin chi tiết');
    }
  }

  async saveScores(userId: number, saveScoresDto: SaveScoresDto) {
    const { assignmentId, scores } = saveScoresDto;

    const assignment = await this.prismaService.responseAssignments.findUnique({
      where: { id: assignmentId },
      include: { scoring_section: { include: { scoring_criteria: true } } },
    });

    if (!assignment) {
      throw new BadRequestException('Assignment không tồn tại');
    }

    if (assignment.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền lưu điểm cho hồ sơ này');
    }

    if (assignment.is_completed) {
      throw new BadRequestException('Assignment đã hoàn thành');
    }

    const criteriaIds = assignment.scoring_section.scoring_criteria.map(
      (c) => c.id,
    );
    const scoredCriteriaIds = scores.map((s) => s.scoring_criteria_id);

    if (
      criteriaIds.length !== scoredCriteriaIds.length ||
      !criteriaIds.every((id) => scoredCriteriaIds.includes(id))
    ) {
      throw new BadRequestException(
        'Phải chấm điểm và ghi chú cho tất cả tiêu chí',
      );
    }

    for (const score of scores) {
      const criteria = assignment.scoring_section.scoring_criteria.find(
        (c) => c.id === score.scoring_criteria_id,
      );
      if (!criteria) {
        throw new BadRequestException(
          `Tiêu chí ${score.scoring_criteria_id} không tồn tại`,
        );
      }
      if (
        score.score_value < criteria.min_score ||
        score.score_value > criteria.max_score
      ) {
        throw new BadRequestException(
          `Điểm cho tiêu chí ${criteria.name} phải từ ${criteria.min_score} đến ${criteria.max_score}`,
        );
      }
      if (!score.comment.trim()) {
        throw new BadRequestException(
          `Ghi chú cho tiêu chí ${criteria.name} không được để trống`,
        );
      }
    }

    try {
      const result = await this.prismaService.$transaction(async (prisma) => {
        for (const score of scores) {
          await prisma.responseScores.upsert({
            where: {
              form_response_id_scoring_criteria_id_user_id: {
                form_response_id: score.form_response_id,
                scoring_criteria_id: score.scoring_criteria_id,
                user_id: score.user_id,
              },
            },
            update: {
              score_value: score.score_value,
              comment: score.comment,
            },
            create: {
              form_response_id: score.form_response_id,
              scoring_criteria_id: score.scoring_criteria_id,
              user_id: score.user_id,
              score_value: score.score_value,
              comment: score.comment,
            },
          });
        }

        const updatedAssignment = await prisma.responseAssignments.update({
          where: { id: assignmentId },
          data: {
            is_completed: true,
            completed_at: new Date(),
          },
        });

        return updatedAssignment;
      });

      return {
        message: 'Lưu điểm số và hoàn thành chấm điểm thành công',
        data: result,
      };
    } catch (error) {
      this.logService.error(
        `Error saving scores and completing assignment: ${error.message}`,
      );
      throw error;
    }
  }

  async completeAssignment(userId: number, assignmentId: number) {
    const assignment = await this.prismaService.responseAssignments.findUnique({
      where: { id: assignmentId },
      include: { scoring_section: { include: { scoring_criteria: true } } },
    });

    if (!assignment) {
      throw new BadRequestException('Assignment không tồn tại');
    }

    if (assignment.user_id !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền hoàn thành assignment này',
      );
    }

    if (assignment.is_completed) {
      throw new BadRequestException('Assignment đã hoàn thành');
    }

    const scores = await this.prismaService.responseScores.findMany({
      where: {
        form_response_id: assignment.form_response_id,
        user_id: userId,
        scoring_criteria_id: {
          in: assignment.scoring_section.scoring_criteria.map((c) => c.id),
        },
      },
    });

    const scoredCriteriaIds = scores.map((s) => s.scoring_criteria_id);
    const requiredCriteriaIds = assignment.scoring_section.scoring_criteria.map(
      (c) => c.id,
    );

    if (
      requiredCriteriaIds.length !== scoredCriteriaIds.length ||
      !requiredCriteriaIds.every((id) => scoredCriteriaIds.includes(id))
    ) {
      throw new BadRequestException(
        'Chưa chấm điểm đầy đủ cho tất cả tiêu chí',
      );
    }

    try {
      const updatedAssignment =
        await this.prismaService.responseAssignments.update({
          where: { id: assignmentId },
          data: {
            is_completed: true,
            completed_at: new Date(),
            updated_at: new Date(),
          },
        });

      return {
        message: 'Hoàn thành chấm điểm thành công',
        data: updatedAssignment,
      };
    } catch (error) {
      this.logService.error(`Error completing assignment: ${error.message}`);
      throw new BadRequestException('Lỗi khi hoàn thành chấm điểm');
    }
  }

  async getCompletedAssignments(userId: number) {
    try {
      const assignments = await this.prismaService.responseAssignments.findMany(
        {
          where: {
            user_id: userId,
            is_completed: true,
          },
          include: {
            form_response: {
              include: {
                form: true,
                response_scores: {
                  where: {
                    user_id: userId,
                  },
                  include: {
                    scoring_criteria: true,
                  },
                },
              },
            },
            scoring_section: {
              include: {
                scoring_criteria: true,
              },
            },
          },
          orderBy: {
            completed_at: 'desc',
          },
        },
      );

      const formattedData = assignments.map((assignment) => {
        const totalScore = assignment.form_response.response_scores.reduce(
          (sum, score) => sum + score.score_value,
          0,
        );
        const maxScore = assignment.scoring_section.scoring_criteria.reduce(
          (sum, criteria) => sum + criteria.max_score,
          0,
        );

        return {
          assignmentId: assignment.id,
          formResponseId: assignment.form_response_id,
          formName: assignment.form_response.form.name,
          applicantName: assignment.form_response.name,
          applicantEmail: assignment.form_response.email,
          scoringSectionName: assignment.scoring_section.name,
          totalScore,
          maxScore,
          completedAt: assignment.completed_at,
          scores: assignment.form_response.response_scores.map((score) => ({
            criteriaId: score.scoring_criteria_id,
            criteriaName: score.scoring_criteria.name,
            scoreValue: score.score_value,
            maxScore: score.scoring_criteria.max_score,
            comment: score.comment,
          })),
        };
      });

      return formattedData;
    } catch (error) {
      this.logService.error(
        `Error fetching completed assignments: ${error.message}`,
      );
      throw new BadRequestException('Lỗi khi lấy danh sách hồ sơ hoàn thành');
    }
  }
}
