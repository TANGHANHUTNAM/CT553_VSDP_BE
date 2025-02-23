import { Injectable } from '@nestjs/common';
import { CreateSectionVersionDto } from './dto/create-section-version.dto';
import { UpdateSectionVersionDto } from './dto/update-section-version.dto';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';

@Injectable()
export class SectionVersionsService {
  constructor(
    private prisma: PrismaService,
    private logService: LogService,
  ) {
    this.logService.setContext(SectionVersionsService.name);
  }
  async create(createSectionVersionDto: CreateSectionVersionDto) {
    try {
      const lastVersionSectionId = await this.prisma.sectionVersions.findFirst({
        where: {
          form_section_id: +createSectionVersionDto.form_section_id,
        },
        orderBy: {
          version: 'desc',
        },
      });
      const newVersionSectionId = await this.prisma.sectionVersions.create({
        data: {
          ...createSectionVersionDto,
          version: lastVersionSectionId.version + 1,
        },
      });
      return newVersionSectionId;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  findAll() {
    return `This action returns all sectionVersions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sectionVersion`;
  }

  async update(id: number, updateSectionVersionDto: UpdateSectionVersionDto) {
    try {
      const updatedVersion = await this.prisma.sectionVersions.update({
        where: {
          id,
        },
        data: {
          ...updateSectionVersionDto,
        },
      });
      const section = await this.prisma.formSections.findFirst({
        where: {
          id: updatedVersion.form_section_id,
        },
      });

      return {
        ...section,
        section_versions: updatedVersion,
      };
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} sectionVersion`;
  }
}
