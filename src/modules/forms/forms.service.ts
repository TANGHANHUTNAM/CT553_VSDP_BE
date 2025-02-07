import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from 'src/core/prisma.service';
import { Form } from '@prisma/client';
import { LogService } from 'src/log/log.service';
import { QueryForm } from './dto/query-pagination-form.dto';
import { UpdateStatusFormDto } from './dto/update-status-form.dto';

@Injectable()
export class FormsService {
  constructor(
    private prisma: PrismaService,
    private logService: LogService,
  ) {
    this.logService.setContext(FormsService.name);
  }
  async create(createFormDto: CreateFormDto): Promise<Form> {
    try {
      const form = await this.prisma.form.create({
        data: createFormDto,
      });
      return form;
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
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }),
        ...(scope && { scope }),
        ...(status && { is_active: status === 'active' ? true : false }),
      };

      const forms = await this.prisma.form.findMany({
        where: whereClause,
        skip,
        take,
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

  findOne(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      return this.prisma.form.findUnique({
        where: { id },
      });
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
        data: updateFormDto,
      });
      return form;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async updateStatus(
    id: string,
    UpdateStatusFormDto: UpdateStatusFormDto,
  ): Promise<Form> {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const form = await this.prisma.form.update({
        where: { id },
        data: {
          is_active: UpdateStatusFormDto.status === 1 ? true : false,
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
}
