import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFormAssginmentResponseDto } from './dto/create-form-assginment-response.dto';
import { UpdateFormAssginmentResponseDto } from './dto/update-form-assginment-response.dto';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';
import { ApplicantStatus } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class FormAssginmentResponseService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logService: LogService,
    private notificationsService: NotificationsService,
  ) {
    this.logService.setContext(FormAssginmentResponseService.name);
  }
  create(createFormAssginmentResponseDto: CreateFormAssginmentResponseDto) {
    return 'This action adds a new formAssginmentResponse';
  }

  findAll() {
    return `This action returns all formAssginmentResponse`;
  }

  findOne(id: number) {
    return `This action returns a #${id} formAssginmentResponse`;
  }

  update(
    id: number,
    updateFormAssginmentResponseDto: UpdateFormAssginmentResponseDto,
  ) {
    return `This action updates a #${id} formAssginmentResponse`;
  }

  async getFormResponsesWithReviewers(
    formId: string,
    scoringSectionId: number,
    take: number = 10,
    skip: number = 0,
    search?: string,
    universityId?: number,
    assigned?: boolean,
  ) {
    const formExists = await this.prismaService.form.findUnique({
      where: { id: formId },
    });
    if (!formExists) {
      throw new BadRequestException('Form không tồn tại');
    }

    const sectionExists = await this.prismaService.scoringSections.findUnique({
      where: { id: scoringSectionId },
    });
    if (!sectionExists) {
      throw new BadRequestException('Scoring section không tồn tại');
    }

    if (take < 1 || skip < 0) {
      throw new BadRequestException(
        'take phải lớn hơn 0 và skip không được âm',
      );
    }

    if (universityId && universityId < 1) {
      throw new BadRequestException('universityId phải là một số hợp lệ');
    }

    const whereClause: any = {
      form_id: formId,
      status: {
        notIn: [ApplicantStatus.SUBMITTED, ApplicantStatus.REJECTED],
      },
    };

    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone_number: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (universityId) {
      whereClause.university_id = universityId;
    }

    if (assigned !== undefined) {
      if (assigned) {
        whereClause.response_assignments = {
          some: {
            scoring_section_id: scoringSectionId,
          },
        };
      } else {
        whereClause.response_assignments = {
          none: {
            scoring_section_id: scoringSectionId,
          },
        };
      }
    }

    const [formResponses, total] = await Promise.all([
      this.prismaService.formResponses.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone_number: true,
          created_at: true,
          status: true,
          updated_at: true,
          university: {
            select: {
              name: true,
            },
          },
          response_assignments: {
            where: {
              scoring_section_id: scoringSectionId,
            },
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: { select: { name: true } },
                  avatar_url: true,
                  phone_number: true,
                },
              },
            },
          },
        },
        take,
        skip,
        orderBy: {
          updated_at: 'desc',
        },
      }),
      this.prismaService.formResponses.count({
        where: whereClause,
      }),
    ]);

    const responses = formResponses.map((response) => ({
      id: response.id,
      name: response.name,
      email: response.email,
      phone_number: response.phone_number,
      created_at: response.created_at,
      status: response.status,
      updated_at: response.updated_at,
      university: response.university?.name || '-',
      assignedReviewers: response.response_assignments.map((assignment) => ({
        id: assignment.user.id,
        name: assignment.user.name,
        email: assignment.user.email,
        role: assignment.user.role.name,
        avatar_url: assignment.user.avatar_url,
        phone_number: assignment.user.phone_number,
      })),
    }));

    return {
      responses,
      total,
      current: take,
      pageSize: skip,
    };
  }

  async getAllReviewers() {
    try {
      const reviewers = await this.prismaService.user.findMany({
        where: {
          active: true,
          role: {
            name: {
              notIn: ['SUPER ADMIN'],
            },
            active: true,
          },
        },
        include: {
          role: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      });
      return reviewers.map((reviewer) => ({
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
        role: reviewer.role.name,
        avatar_url: reviewer.avatar_url,
        description: reviewer.role.description,
      }));
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async assignReviewer(
    sectionId: number,
    data: {
      formResponseId: number[];
      reviewerId: number[];
    },
  ) {
    try {
      const { formResponseId, reviewerId } = data;

      if (!formResponseId?.length || !reviewerId?.length) {
        throw new BadRequestException(
          'Danh sách hồ sơ và người đánh giá không được rỗng',
        );
      }

      const sectionExists = await this.prismaService.scoringSections.findUnique(
        {
          where: { id: sectionId },
        },
      );
      if (!sectionExists) {
        throw new BadRequestException('Scoring section không tồn tại');
      }

      const formResponses = await this.prismaService.formResponses.findMany({
        where: { id: { in: formResponseId } },
        include: { form: true },
      });
      if (formResponses.length !== formResponseId.length) {
        throw new BadRequestException('Một hoặc nhiều hồ sơ không tồn tại');
      }

      const reviewers = await this.prismaService.user.findMany({
        where: { id: { in: reviewerId }, active: true },
      });
      if (reviewers.length !== reviewerId.length) {
        throw new BadRequestException(
          'Một hoặc nhiều người đánh giá không tồn tại',
        );
      }

      const result = await this.prismaService.$transaction(async (prisma) => {
        const existingAssignments = await prisma.responseAssignments.findMany({
          where: {
            form_response_id: { in: formResponseId },
            scoring_section_id: sectionId,
            user_id: { in: reviewerId },
          },
          select: {
            form_response_id: true,
            user_id: true,
          },
        });

        const existingKeys = new Set(
          existingAssignments.map(
            (assignment) =>
              `${assignment.form_response_id}-${assignment.user_id}`,
          ),
        );

        const newAssignments = formResponseId
          .flatMap((formId) =>
            reviewerId.map((reviewer) => ({
              form_response_id: formId,
              scoring_section_id: sectionId,
              user_id: reviewer,
            })),
          )
          .filter(
            (assignment) =>
              !existingKeys.has(
                `${assignment.form_response_id}-${assignment.user_id}`,
              ),
          );

        let createdAssignments = { count: 0 };
        if (newAssignments.length > 0) {
          createdAssignments = await prisma.responseAssignments.createMany({
            data: newAssignments,
          });

          // Lấy lại các assignment vừa tạo để có ID và created_at chính xác
          const newAssignmentRecords =
            await prisma.responseAssignments.findMany({
              where: {
                form_response_id: { in: formResponseId },
                scoring_section_id: sectionId,
                user_id: { in: reviewerId },
                // Không cần lọc created_at vì createMany đảm bảo bản ghi mới
              },
              include: {
                form_response: {
                  include: {
                    form: true,
                  },
                },
                scoring_section: true,
              },
            });

          const formResponseMap = new Map(
            formResponses.map((fr) => [fr.id, fr]),
          );

          for (const assignment of newAssignmentRecords) {
            const formResponse = formResponseMap.get(
              assignment.form_response_id,
            );

            // Gửi thông báo với dữ liệu tương tự getFormResponseAssignedForReviewer
            await this.notificationsService.sendNotification(
              assignment.user_id,
              {
                message: `Bạn vừa được phân công đánh giá hồ sơ ${formResponse.name}`,
                data: {
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
                },
              },
            );
          }
        }

        return createdAssignments;
      });

      return {
        count: result.count,
      };
    } catch (error) {
      this.logService.error(`Error assigning reviewers: ${error.message}`);
      throw error;
    }
  }

  async getReviewer(id: number) {
    try {
      const reviewer = await this.prismaService.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone_number: true,
          avatar_url: true,
          date_of_birth: true,
          school: true,
          company: true,
          created_at: true,
          generation: true,
          major: true,
          job_title: true,
          is_external_guest: true,
          gender: true,
          end_date: true,
          start_date: true,
          role: {
            select: {
              name: true,
              description: true,
              created_at: true,
            },
          },
        },
      });

      if (!reviewer) {
        throw new BadRequestException('Người đánh giá không tồn tại');
      }

      return reviewer;
    } catch (error) {
      this.logService.error(`Error assigning reviewers: ${error.message}`);
      throw error;
    }
  }

  async deleteReviewerAssignedForResponseAndScoringSection(
    formResponseId: number,
    sectionId: number,
    userId: number,
  ) {
    try {
      if (!formResponseId || !sectionId || !userId) {
        throw new BadRequestException(
          'formResponseId, sectionId, và userId không được rỗng',
        );
      }

      const sectionExists = await this.prismaService.scoringSections.findUnique(
        {
          where: { id: sectionId },
        },
      );
      if (!sectionExists) {
        throw new BadRequestException('Scoring section không tồn tại');
      }

      const formResponse = await this.prismaService.formResponses.findUnique({
        where: { id: formResponseId },
      });
      if (!formResponse) {
        throw new BadRequestException('Hồ sơ không tồn tại');
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new BadRequestException('Người đánh giá không tồn tại');
      }

      const deleted = await this.prismaService.responseAssignments.deleteMany({
        where: {
          form_response_id: formResponseId,
          scoring_section_id: sectionId,
          user_id: userId,
        },
      });

      if (deleted.count === 0) {
        throw new NotFoundException('Không tìm thấy phân công để xóa');
      }

      return {
        count: deleted.count,
      };
    } catch (error) {
      this.logService.error(`Error deleting reviewer: ${error.message}`);
      throw error;
    }
  }
}
