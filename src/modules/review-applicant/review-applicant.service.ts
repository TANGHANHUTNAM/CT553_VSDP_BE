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
}
