import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { LogService } from 'src/log/log.service';
import { PrismaService } from 'src/core/prisma.service';
import { QueryParams } from 'src/shared/utils';
import { UniversityQuery } from './dto/query-pagination-university.dto';

@Injectable()
export class UniversityService {
  constructor(
    private logService: LogService,
    private prismaService: PrismaService,
  ) {
    this.logService.setContext(UniversityService.name);
  }

  async create(createUniversityDto: CreateUniversityDto) {
    try {
      const university = await this.prismaService.universities.create({
        data: {
          ...createUniversityDto,
        },
      });
      return university;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async findAllWithPagination(query: UniversityQuery) {
    const { search, current, pageSize, status, sortByUpdatedAt } = query;
    try {
      const currentPage = current || 1;
      const itemsPerPage = pageSize || 10;
      const skip = (currentPage - 1) * itemsPerPage;
      const take = itemsPerPage;
      const whereClause: any = {
        ...(search && {
          OR: [{ name: { contains: search, mode: 'insensitive' } }],
        }),
        ...(status && {
          is_active: status === 'active' ? true : false,
        }),
      };

      const universities = await this.prismaService.universities.findMany({
        where: whereClause,
        orderBy: {
          updated_at:
            (sortByUpdatedAt ?? sortByUpdatedAt === 'descend') ? 'desc' : 'asc',
        },
        skip,
        take,
      });

      const totalRecords = await this.prismaService.universities.count({
        where: whereClause,
      });

      return {
        universities,
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

  async findAll() {
    try {
      return await this.prismaService.universities.findMany({
        where: {
          is_active: true,
        },
      });
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} university`;
  }

  async update(id: number, updateUniversityDto: UpdateUniversityDto) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const university = await this.prismaService.universities.update({
        where: {
          id,
        },
        data: {
          ...updateUniversityDto,
        },
      });
      return university;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} university`;
  }
}
