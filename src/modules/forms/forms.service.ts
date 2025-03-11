import { BadRequestException, Injectable } from '@nestjs/common';
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
      const universities = await this.prisma.universities.findMany({});
      return {
        ...forms,
        universities,
      };
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

  remove(id: number) {
    return `This action removes a #${id} form`;
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

  async getPublicFormShareLink(id: string) {
    try {
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
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone Number', key: 'phone_number', width: 15 },
        { header: 'University', key: 'university', width: 20 },
        { header: 'Final Scores', key: 'final_scores', width: 15 },
        { header: 'Total Final Score', key: 'total_final_score', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Created At', key: 'created_at', width: 20 },
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
      const worksheet = workbook.addWorksheet('Form Responses');

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
}
