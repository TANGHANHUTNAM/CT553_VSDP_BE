import { Injectable } from '@nestjs/common';
import { CreateSectionsFormDto } from './dto/create-sections-form.dto';
import { UpdateSectionsFormDto } from './dto/update-sections-form.dto';
import { LogService } from 'src/log/log.service';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class SectionsFormService {
  constructor(
    private prisma: PrismaService,
    private logService: LogService,
  ) {
    this.logService.setContext(SectionsFormService.name);
  }
  async create(createSectionsFormDto: CreateSectionsFormDto) {
    try {
      const sectionCreatedForm = await this.prisma.formSections.create({
        data: {
          ...createSectionsFormDto,
        },
      });
      const allSections = await this.prisma.formSections.findMany({
        where: {
          form_id: sectionCreatedForm.form_id,
        },
        orderBy: {
          created_at: 'asc',
        },
      });
      return allSections;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async getSectionsByFormId(formId: string) {
    try {
      const sectionsForms = await this.prisma.formSections.findMany({
        where: {
          form_id: formId,
        },
        orderBy: {
          id: 'asc',
        },
      });
      return sectionsForms;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  findAll() {
    try {
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} sectionsForm`;
  }

  async update(id: number, updateSectionsFormDto: UpdateSectionsFormDto) {
    try {
      if (!id) {
        throw new Error('Id is required!');
      }
      const updatedSection = await this.prisma.formSections.update({
        where: {
          id,
        },
        data: {
          ...updateSectionsFormDto,
        },
      });
      const allSections = await this.prisma.formSections.findMany({
        where: {
          form_id: updatedSection.form_id,
        },
        orderBy: {
          id: 'asc',
        },
      });
      return allSections;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const section = await this.prisma.formSections.delete({
        where: {
          id,
        },
      });
      const allSections = await this.prisma.formSections.findMany({
        where: {
          form_id: section.form_id,
        },
        orderBy: {
          id: 'asc',
        },
      });
      return allSections;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }
}
