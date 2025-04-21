import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from 'src/core/prisma.service';
import { Form } from '@prisma/client';
import { LogService } from 'src/log/log.service';
import { QueryForm } from './dto/query-pagination-form.dto';
import { UpdateStatusFormDto } from './dto/update-status-form.dto';
import { UpdateFormUploadImage } from './dto/update-form-uploadImage';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UpdateFormBuilderDto } from './dto/update-form-builder.dto';
import { UpdateStatusPublicFormDto } from './dto/update-status-public-form.dto';
import * as ExcelJS from 'exceljs';

import { Buffer } from 'buffer';
import { generateRandomUuid } from 'src/shared/func';
import { GetStatsDto, GroupBy } from './dto/stats-form.dto';
@Injectable()
export class FormsService {
  constructor(
    private prisma: PrismaService,
    private logService: LogService,
    private cloudinaryService: CloudinaryService,
  ) {
    this.logService.setContext(FormsService.name);
  }
  async create(createFormDto: CreateFormDto): Promise<Form> {
    try {
      const form = await this.prisma.form.create({
        data: {
          ...createFormDto,
          creator_id: +createFormDto.creator_id,
        },
      });
      const formSection = await this.prisma.formSections.create({
        data: {
          form_id: form.id,
          name: 'section',
          description: 'section',
        },
      });
      const newForm = { ...form, form_sections: [formSection] };
      return newForm;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async findAllWithPagination(query: QueryForm) {
    const { search, current, pageSize, scope, status } = query;
    try {
      const currentPage = current || 1;
      const itemsPerPage = pageSize || 10;
      const skip = (currentPage - 1) * itemsPerPage;
      const take = itemsPerPage;

      const whereClause: any = {
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }),
        ...(scope && { scope }),
        ...(status && { is_public: status === 'active' ? true : false }),
      };

      const forms = await this.prisma.form.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: {
          is_default: 'desc',
        },
      });

      const totalRecords = await this.prisma.form.count({
        where: whereClause,
      });
      return {
        forms,
        pagination: {
          current: currentPage,
          pageSize: itemsPerPage,
          totalRecords,
        },
      };
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const forms = await this.prisma.form.findUnique({
        where: { id },
        include: {
          form_sections: {
            orderBy: {
              id: 'asc',
            },
          },
        },
      });
      if (!forms) {
        throw new BadRequestException('Form not found');
      }
      if (forms.scope === 'SCHOLARSHIP') {
        const universities = await this.prisma.universities.findMany({});
        return {
          ...forms,
          universities,
        };
      }
      return forms;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async update(id: string, updateFormDto: UpdateFormDto) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const form = await this.prisma.form.update({
        where: { id },
        data: {
          ...updateFormDto,
          creator_id: +updateFormDto.creator_id,
        },
      });
      return form;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async updateFormBuilder(
    id: string,
    updateFormBuilderDto: UpdateFormBuilderDto,
  ) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const savedForm = await this.prisma.form.update({
        where: { id },
        data: {
          primary_color: updateFormBuilderDto.primary_color,
          block_color: updateFormBuilderDto.block_color,
          background_color: updateFormBuilderDto.background_color,
        },
      });
      if (!savedForm) {
        throw new BadRequestException('Form not found');
      }
      return savedForm;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async updateStatus(
    id: string,
    updateStatusFormDto: UpdateStatusFormDto,
  ): Promise<Form> {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const form = await this.prisma.form.update({
        where: { id },
        data: {
          is_default: updateStatusFormDto.is_default,
        },
      });
      if (form.scope === 'SCHOLARSHIP') {
        await this.prisma.form.updateMany({
          where: {
            id: {
              not: id,
            },
            scope: 'SCHOLARSHIP',
          },
          data: {
            is_default: false,
          },
        });
      }
      return form;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async updateStatusPublic(
    id: string,
    updateStatusPublic: UpdateStatusPublicFormDto,
  ) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const form = await this.prisma.form.update({
        where: { id },
        data: {
          is_public: updateStatusPublic.is_public,
        },
        include: {
          form_sections: {
            orderBy: {
              id: 'asc',
            },
          },
        },
      });
      return form;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const form = await this.prisma.form.delete({
        where: { id },
      });
      return form;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async updateStyleForm(id: string, data: UpdateFormUploadImage, image: any) {
    const { public_id } = data;
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }

      if (public_id) {
        await this.cloudinaryService.deleteFile(public_id);
      }
      if (image) {
        const imageUpload = await this.cloudinaryService.uploadFile(image);
        const updatedImageForm = await this.prisma.form.update({
          where: { id },
          data: {
            image_url: imageUpload.secure_url,
            public_id: imageUpload.public_id,
            primary_color: data.primary_color,
            block_color: data.block_color,
            background_color: data.background_color,
          },
        });
        return updatedImageForm;
      }
      const updatedForm = await this.prisma.form.update({
        where: { id },
        data: {
          primary_color: data.primary_color,
          block_color: data.block_color,
          background_color: data.background_color,
        },
      });
      return updatedForm;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async previewForm(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const form = await this.prisma.form.findUnique({
        where: { id },
        include: {
          form_sections: {
            orderBy: {
              id: 'asc',
            },
          },
        },
      });
      if (form?.scope === 'SCHOLARSHIP') {
        const universities = await this.prisma.universities.findMany({
          where: {
            is_active: true,
          },
        });
        return {
          ...form,
          universities,
        };
      }
      return form;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async getPublicFormScholarship() {
    try {
      const forms = await this.prisma.form.findMany({
        where: {
          scope: 'SCHOLARSHIP',
          is_public: true,
          is_default: true,
        },
        include: {
          form_sections: {
            orderBy: {
              id: 'asc',
            },
          },
        },
      });
      if (forms.length === 0) {
        return null;
      }

      if (forms[0].scope === 'SCHOLARSHIP') {
        const universities = await this.prisma.universities.findMany({
          where: {
            is_active: true,
          },
        });
        return {
          ...forms[0],
          universities,
        };
      }
      return forms[0];
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async copyForm(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const form = await this.prisma.form.findUnique({
        where: { id },
        include: {
          form_sections: {
            orderBy: {
              id: 'asc',
            },
          },
        },
      });
      if (!form) {
        throw new BadRequestException('Form not found');
      }
      const {
        id: formId,
        created_at,
        updated_at,
        form_sections,
        ...formData
      } = form;
      const formSections = form.form_sections.map((section) => {
        const { id, form_id, created_at, updated_at, ...rest } = section;
        return rest;
      });
      const newForm = await this.prisma.form.create({
        data: {
          ...formData,
          is_default: false,
          is_public: false,
          name: `${form.name} - Copy`,
          form_sections: {
            createMany: {
              data: formSections,
            },
          },
        },
      });
      return newForm;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async exportFormResponsesToExcel(formId: string): Promise<Buffer> {
    try {
      const formResponses = await this.prisma.formResponses.findMany({
        where: { form_id: formId },
        include: {
          university: true,
          field_value_responses: true,
        },
      });

      if (formResponses.length === 0) {
        throw new BadRequestException('No responses found for this form!');
      }

      const snapshotVersions = [
        ...new Set(formResponses.map((r) => r.snapshot_version)),
      ];
      const snapshots = await this.prisma.formSnapshots.findMany({
        where: {
          form_id: formId,
          version: { in: snapshotVersions },
        },
        select: { version: true, snapshot_json: true },
      });

      const snapshotMap = snapshots.reduce(
        (acc, snapshot) => {
          acc[snapshot.version] = snapshot.snapshot_json as Array<{
            name: string;
            blocks: Array<{ id: string; label: string; blockType: string }>;
          }>;
          return acc;
        },
        {} as Record<string, any>,
      );

      const allFields = new Map<string, { label: string; blockType: string }>();
      Object.values(snapshotMap).forEach((sections: any[]) => {
        sections.forEach((section) => {
          section.blocks.forEach((block) => {
            if (!allFields.has(block.id)) {
              allFields.set(block.id, {
                label: block.label,
                blockType: block.blockType,
              });
            }
          });
        });
      });

      const headers = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Họ tên', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Số điện thoại', key: 'phone_number', width: 15 },
        { header: 'Trường học', key: 'university', width: 20 },
        { header: 'Điểm từng phần', key: 'final_scores', width: 15 },
        { header: 'Tổng điểm', key: 'total_final_score', width: 15 },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Thời gian nộp', key: 'created_at', width: 20 },
        ...Array.from(allFields.entries()).map(([fieldId, field]) => ({
          header: field.label || fieldId,
          key: fieldId,
          width: 20,
        })),
      ];

      const rows = formResponses.map((response) => {
        const fieldValues = response.field_value_responses.reduce(
          (acc, field) => {
            if (field.value_json !== null) {
              acc[field.field_id] = JSON.stringify(field.value_json);
            } else if (field.value_array && field.value_array.length > 0) {
              acc[field.field_id] = field.value_array.join(', ');
            } else if (field.value_number !== null) {
              acc[field.field_id] = field.value_number;
            } else if (field.value_string !== null) {
              acc[field.field_id] = field.value_string;
            } else {
              acc[field.field_id] = '';
            }
            return acc;
          },
          {} as Record<string, any>,
        );

        return {
          id: response.id,
          name: response.name,
          email: response.email,
          phone_number: response.phone_number,
          university: response.university?.name || '-',
          final_scores: JSON.stringify(response.final_scores) ?? '',
          total_final_score: response.total_final_score ?? '',
          status: response.status ?? '',
          created_at: response.created_at.toISOString(),
          ...fieldValues,
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data Forms');

      worksheet.columns = headers;
      worksheet.addRows(rows);

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      const buffer = (await workbook.xlsx.writeBuffer()) as Buffer;
      return buffer;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async getShareLinkExpiryDate(form_id: string) {
    try {
      if (!form_id) {
        throw new BadRequestException('Id is required');
      }
      const form = await this.prisma.form.findUnique({
        where: { id: form_id },
      });
      return {
        expiry_date: form?.share_expiry,
        link: `${process.env.FRONTEND_URL}/share-link/${form_id}?token=${form?.share_token}`,
      };
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async createShareLinkForm(form_id: string, expiry_dates: number) {
    try {
      const form = await this.prisma.form.findUnique({
        where: { id: form_id },
      });
      if (!form) {
        throw new BadRequestException('Form not found');
      }
      const shareToken = generateRandomUuid();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiry_dates);
      const formShareLink = await this.prisma.form.update({
        where: { id: form_id },
        data: {
          share_token: shareToken,
          share_expiry: expiryDate,
        },
      });
      return {
        link: `${process.env.FRONTEND_URL}/share-link/${form_id}?token=${shareToken}`,
        expiry_date: expiryDate,
      };
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async getFormFromShareLink(form_id: string, token: string) {
    try {
      const form = await this.prisma.form.findUnique({
        where: { id: form_id },
        include: {
          form_sections: {
            orderBy: {
              id: 'asc',
            },
          },
        },
      });
      if (!form) {
        throw new BadRequestException('Form not found');
      }
      const nowDate = new Date();
      if (
        !form.is_public ||
        token !== form.share_token ||
        form.share_expiry <= nowDate
      ) {
        throw new ForbiddenException('Bạn không có quyền truy cập!');
      }
      if (form.scope === 'SCHOLARSHIP') {
        const universities = await this.prisma.universities.findMany({
          where: {
            is_active: true,
          },
        });
        return {
          ...form,
          universities,
        };
      }
      return form;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async getFormStats(dto: GetStatsDto) {
    const { form_id, group_by, start, end } = dto;

    try {
      const form = await this.prisma.form.findUnique({
        where: { id: form_id },
        select: { scope: true },
      });

      if (!form) {
        throw new BadRequestException('Form not found');
      }

      const whereClause: any = { form_id };
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);

        endDate.setHours(23, 59, 59, 999);

        whereClause.created_at = {
          gte: startDate,
          lte: endDate,
        };
      }
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const newResponsesToday = await this.prisma.formResponses.count({
        where: {
          form_id,
          created_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      const baseStats = await this.getBaseStats(form_id, group_by, whereClause);
      let specificStats = {};

      if (form.scope === 'SCHOLARSHIP') {
        specificStats = {
          ...(await this.getScholarshipStats(form_id)),
        };
      }

      return {
        form_id,
        scope: form.scope,
        group_by: group_by,
        new_responses_today: newResponsesToday,
        ...baseStats,
        ...specificStats,
      };
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  private async getBaseStats(
    form_id: string,
    groupBy: GroupBy,
    whereClause: any,
  ) {
    const totalResponses = await this.prisma.formResponses.count({
      where: { form_id },
    });

    let responseTrend;
    if (groupBy === 'day') {
      if (whereClause.created_at) {
        responseTrend = await this.prisma.$queryRaw`
        SELECT 
          DATE(created_at) AS date,
          COUNT(*) AS count
        FROM "FormResponses"
        WHERE form_id = ${form_id}
          AND created_at BETWEEN ${whereClause.created_at.gte} AND ${whereClause.created_at.lte}
        GROUP BY DATE(created_at)
        ORDER BY date;
      `;
      } else {
        responseTrend = await this.prisma.$queryRaw`
        SELECT 
          DATE(created_at) AS date,
          COUNT(*) AS count
        FROM "FormResponses"
        WHERE form_id = ${form_id}
        GROUP BY DATE(created_at)
        ORDER BY date;
      `;
      }

      return {
        total_responses: totalResponses,
        response_trend: responseTrend.map((item: any) => ({
          date: item.date.toISOString().split('T')[0],
          count: Number(item.count),
        })),
      };
    }

    if (groupBy === 'month') {
      if (whereClause.created_at) {
        const startDate = new Date(whereClause.created_at.gte);
        const endDate = new Date(whereClause.created_at.lte);

        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth() + 1;

        responseTrend = await this.prisma.$queryRaw`
        SELECT 
          EXTRACT(YEAR FROM created_at) AS year,
          EXTRACT(MONTH FROM created_at) AS month,
          COUNT(*) AS count
        FROM "FormResponses"
        WHERE form_id = ${form_id}
          AND EXTRACT(YEAR FROM created_at) * 12 + EXTRACT(MONTH FROM created_at)
              BETWEEN ${startYear * 12 + startMonth} AND ${endYear * 12 + endMonth}
        GROUP BY 
          EXTRACT(YEAR FROM created_at),
          EXTRACT(MONTH FROM created_at)
        ORDER BY year, month;
      `;
      } else {
        responseTrend = await this.prisma.$queryRaw`
        SELECT 
          EXTRACT(YEAR FROM created_at) AS year,
          EXTRACT(MONTH FROM created_at) AS month,
          COUNT(*) AS count
        FROM "FormResponses"
        WHERE form_id = ${form_id}
        GROUP BY 
          EXTRACT(YEAR FROM created_at),
          EXTRACT(MONTH FROM created_at)
        ORDER BY year, month;
      `;
      }

      return {
        total_responses: totalResponses,
        response_trend: responseTrend.map((item: any) => ({
          year: item.year,
          month: item.month,
          count: Number(item.count),
        })),
      };
    }

    throw new BadRequestException('Invalid groupBy value');
  }

  private async getScholarshipStats(form_id: string) {
    // Phân bố trạng thái
    const statusDistribution = await this.prisma.formResponses.groupBy({
      by: ['status'],
      where: { form_id },
      _count: { status: true },
    });

    // Tạo object thống kê trạng thái
    const statusStats = statusDistribution.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {
        SUBMITTED: 0,
        CHECKED: 0,
        REJECTED: 0,
        INTERVIEWING: 0,
        PASSED: 0,
        FAILED: 0,
      } as Record<string, number>,
    );

    // Điểm trung bình
    const scoreStats = await this.prisma.formResponses.aggregate({
      where: { form_id, total_final_score: { not: null } },
      _avg: { total_final_score: true },
      _count: { total_final_score: true },
    });

    // Lấy tất cả trường đại học từ bảng Universities
    const allUniversities = await this.prisma.universities.findMany({
      select: { id: true, name: true },
    });

    // Thống kê số lượng sinh viên theo trường từ formResponses
    const universityDistribution = await this.prisma.formResponses.groupBy({
      by: ['university_id'],
      where: { form_id, university_id: { not: null } },
      _count: { university_id: true },
    });

    // Tạo map từ dữ liệu thống kê
    const universityCountMap = new Map<string, number>();
    universityDistribution.forEach((item) => {
      universityCountMap.set(
        item.university_id.toString(),
        item._count.university_id,
      );
    });

    // Tạo universityStats với tất cả trường, bao gồm count = 0
    const universityStats = allUniversities.map((university) => ({
      university: university.name,
      count: universityCountMap.get(university.id.toString()) || 0,
    }));

    // Tỷ lệ đậu/rớt
    const passFailStats = {
      passed: statusStats['PASSED'] || 0,
      failed: statusStats['FAILED'] || 0,
      pass_rate: statusStats['PASSED']
        ? (
            (statusStats['PASSED'] /
              (statusStats['PASSED'] + statusStats['FAILED'])) *
            100
          ).toFixed(2)
        : '0',
    };

    return {
      status_distribution: statusStats,
      average_score: scoreStats._avg.total_final_score?.toFixed(2) || 0,
      scored_responses: scoreStats._count.total_final_score,
      university_distribution: universityStats,
      pass_fail_stats: passFailStats,
    };
  }

  async getFieldOptionStats(form_id: string, field_id?: string) {
    try {
      const form = await this.prisma.form.findUnique({
        where: { id: form_id },
        select: { scope: true },
      });
      if (!form) {
        throw new BadRequestException('Form không tồn tại');
      }

      const responses = await this.prisma.formResponses.findMany({
        where: { form_id },
        include: {
          snapshot: true,
          field_value_responses: field_id ? { where: { field_id } } : true,
        },
      });

      if (responses.length === 0) {
        return { message: 'Không có phản hồi nào cho form này', stats: {} };
      }

      const snapshotMap = new Map<string, any>();
      responses.forEach((response) => {
        if (response.snapshot) {
          snapshotMap.set(
            response.snapshot_version,
            response.snapshot.snapshot_json,
          );
        }
      });

      const targetBlockTypes = ['SelectOption', 'CheckBox', 'RadioSelect'];
      const fieldOptions = new Map<
        string,
        { label: string; options: string[]; blockType: string }
      >();

      for (const snapshotJson of snapshotMap.values()) {
        snapshotJson.forEach((section: any) => {
          section.blocks.forEach((block: any) => {
            if (
              targetBlockTypes.includes(block.blockType) &&
              (!field_id || block.id === field_id)
            ) {
              fieldOptions.set(block.id, {
                label: block.label,
                options: block.options || [],
                blockType: block.blockType,
              });
            }
          });
        });
      }

      if (field_id && !fieldOptions.has(field_id)) {
        throw new BadRequestException(
          'Field không tồn tại hoặc không phải loại SelectOption/CheckBox/RadioSelect',
        );
      }

      const stats = new Map<
        string,
        { label: string; blockType: string; options: Record<string, number> }
      >();
      fieldOptions.forEach((field, fid) => {
        const optionCounts: Record<string, number> = {};
        field.options.forEach((opt: string) => (optionCounts[opt] = 0));

        responses.forEach((response) => {
          response.field_value_responses.forEach((fieldValue) => {
            if (fieldValue.field_id === fid) {
              if (field.blockType === 'CheckBox' && fieldValue.value_array) {
                fieldValue.value_array.forEach((val: string) => {
                  if (optionCounts.hasOwnProperty(val)) {
                    optionCounts[val]++;
                  }
                });
              } else if (fieldValue.value_string) {
                const val = fieldValue.value_string;
                if (optionCounts.hasOwnProperty(val)) {
                  optionCounts[val]++;
                }
              }
            }
          });
        });

        stats.set(fid, {
          label: field.label,
          blockType: field.blockType,
          options: optionCounts,
        });
      });

      return {
        form_id,
        stats: Object.fromEntries(stats),
      };
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async getFieldBlockTypes(form_id: string) {
    try {
      // Kiểm tra form tồn tại
      const form = await this.prisma.form.findUnique({
        where: { id: form_id },
        select: { scope: true },
      });
      if (!form) {
        throw new BadRequestException('Form không tồn tại');
      }

      // Lấy tất cả snapshot của form
      const snapshots = await this.prisma.formSnapshots.findMany({
        where: { form_id },
        select: { snapshot_json: true },
      });

      if (snapshots.length === 0) {
        return { form_id, fields: [] };
      }

      // Lọc các field có blockType cần thiết
      const targetBlockTypes = ['SelectOption', 'CheckBox', 'RadioSelect'];
      const fieldMap = new Map<
        string,
        { label: string; blockType: string; options: string[] }
      >();

      snapshots.forEach((snapshot) => {
        snapshot.snapshot_json.forEach((section: any) => {
          section.blocks.forEach((block: any) => {
            if (
              targetBlockTypes.includes(block.blockType) &&
              !fieldMap.has(block.id)
            ) {
              fieldMap.set(block.id, {
                label: block.label,
                blockType: block.blockType,
                options: block.options || [],
              });
            }
          });
        });
      });

      return {
        form_id,
        fields: Array.from(fieldMap.entries()).map(([field_id, data]) => ({
          field_id,
          label: data.label,
          blockType: data.blockType,
          options: data.options,
        })),
      };
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }
}
