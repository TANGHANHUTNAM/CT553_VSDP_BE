import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateScoringCriteriaDto } from './dto/create-scoring-criteria.dto';
import { UpdateScoringCriteriaDto } from './dto/update-scoring-criteria.dto';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';

@Injectable()
export class ScoringCriteriasService {
  constructor(
    private prismaService: PrismaService,
    private logService: LogService,
  ) {
    this.logService.setContext(ScoringCriteriasService.name);
  }
  async create(createScoringCriteriaDto: CreateScoringCriteriaDto) {
    try {
      if (!createScoringCriteriaDto.scoring_section_id) {
        throw new BadRequestException('Scoring section id is required');
      }
      const scoringSection =
        await this.prismaService.scoringSections.findUnique({
          where: { id: createScoringCriteriaDto.scoring_section_id },
        });
      if (!scoringSection) {
        throw new BadRequestException('Scoring section not found');
      }
      const scoringCriteria = await this.prismaService.scoringCriterias.create({
        data: createScoringCriteriaDto,
      });
      return scoringCriteria;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  findAll() {
    return `This action returns all scoringCriterias`;
  }

  findOne(id: number) {
    return `This action returns a #${id} scoringCriteria`;
  }

  async update(id: number, updateScoringCriteriaDto: UpdateScoringCriteriaDto) {
    try {
      if (!id) {
        throw new BadRequestException('Scoring criteria id is required');
      }
      const scoringCriteria =
        await this.prismaService.scoringCriterias.findUnique({
          where: { id },
        });
      if (!scoringCriteria) {
        throw new BadRequestException('Scoring criteria not found');
      }
      const updatedScoringCriteria =
        await this.prismaService.scoringCriterias.update({
          where: { id },
          data: updateScoringCriteriaDto,
        });
      return updatedScoringCriteria;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      if (!id) {
        throw new BadRequestException('Scoring criteria id is required');
      }
      const scoringCriteria =
        await this.prismaService.scoringCriterias.findUnique({
          where: { id },
        });
      if (!scoringCriteria) {
        throw new BadRequestException('Scoring criteria not found');
      }
      const deletedScoringCriteria =
        await this.prismaService.scoringCriterias.delete({
          where: { id },
        });
      return deletedScoringCriteria;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }
}
