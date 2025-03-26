import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateScoringSectionDto } from './dto/create-scoring-section.dto';
import { UpdateScoringSectionDto } from './dto/update-scoring-section.dto';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';
import { QueryByFormDto } from './dto/query-by-form.dto';

@Injectable()
export class ScoringSectionsService {
  constructor(
    private prismaService: PrismaService,
    private logService: LogService,
  ) {
    this.logService.setContext(ScoringSectionsService.name);
  }

  async create(createScoringSectionDto: CreateScoringSectionDto) {
    try {
      const isFormExist = await this.prismaService.form.findUnique({
        where: { id: createScoringSectionDto.form_id },
      });
      if (!isFormExist) {
        throw new BadRequestException('Form not found');
      }
      const scoringSection = await this.prismaService.scoringSections.create({
        data: createScoringSectionDto,
      });
      return scoringSection;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async findAll(query: QueryByFormDto) {
    const { form_id } = query;
    try {
      if (!form_id) {
        throw new BadRequestException('Form ID is required');
      }
      const form = await this.prismaService.form.findUnique({
        where: { id: form_id },
        include: {
          scoring_sections: {
            orderBy: {
              id: 'asc',
            },
            include: {
              scoring_criteria: {
                orderBy: {
                  id: 'asc',
                },
              },
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

  findOne(id: number) {
    return `This action returns a #${id} scoringSection`;
  }

  async update(id: number, updateScoringSectionDto: UpdateScoringSectionDto) {
    try {
      if (!id) {
        throw new BadRequestException('Scoring Section ID is required');
      }
      const isScoringSectionExist =
        await this.prismaService.scoringSections.findUnique({
          where: { id },
        });
      if (!isScoringSectionExist) {
        throw new BadRequestException('Scoring Section not found');
      }
      const scoringSection = await this.prismaService.scoringSections.update({
        where: { id },
        data: updateScoringSectionDto,
      });
      return scoringSection;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      if (!id) {
        throw new BadRequestException('Scoring Section ID is required');
      }
      const isScoringSectionExist =
        await this.prismaService.scoringSections.findUnique({
          where: { id },
        });
      if (!isScoringSectionExist) {
        throw new BadRequestException('Scoring Section not found');
      }
      const scoringSection = await this.prismaService.scoringSections.delete({
        where: { id },
      });
      return scoringSection;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }
}
