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
}
