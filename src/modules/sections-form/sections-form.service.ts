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
          section_versions: {
            create: {
              version: 1,
            },
          },
        },
      });
      // const sectionsForms = await this.prisma.formSections.findMany({
      //   where: {
      //     form_id: createSectionsFormDto.form_id,
      //   },
      // });

      // const sectionVersionsForm = await Promise.all(
      //   sectionsForms.map(async (section) => {
      //     const lastVersion = await this.prisma.sectionVersions.findFirst({
      //       where: {
      //         form_section_id: section.id,
      //       },
      //       orderBy: {
      //         version: 'desc',
      //       },
      //     });
      //     return {
      //       section,
      //       lastVersion,
      //     };
      //   }),
      // );

      return sectionCreatedForm;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async getSectionsLastVersionByFormId(formId: string) {
    try {
      const sectionsForms = await this.prisma.formSections.findMany({
        where: {
          form_id: formId,
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      const sectionLastVersionsForm = await Promise.all(
        sectionsForms.map(async (section) => {
          const section_versions = await this.prisma.sectionVersions.findFirst({
            where: {
              form_section_id: section.id,
            },
            orderBy: {
              version: 'desc',
            },
          });
          let form_sections = {
            ...section,
            section_versions,
          };
          return form_sections;
        }),
      );
      return sectionLastVersionsForm;
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

  update(id: number, updateSectionsFormDto: UpdateSectionsFormDto) {
    return `This action updates a #${id} sectionsForm`;
  }

  remove(id: number) {
    return `This action removes a #${id} sectionsForm`;
  }
}
