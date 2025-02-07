import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from 'src/core/prisma.service';
import { Permission } from '@prisma/client';
import { PermssionQuery } from './dto/query-pagination-permission.dto';
import { PERMISSION_DATA } from 'src/database/data/permissions.data';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async checkPermission(
    roleId: number,
    api_path: string,
    method: string,
  ): Promise<boolean> {
    const permission = await this.prisma.permission.findFirst({
      where: {
        roles: {
          some: {
            roleId: roleId,
          },
        },
        api_path: api_path,
        method: method,
      },
    });
    return !!permission;
  }

  async getPermissionByMethodAndApiPath(
    method: string,
    api_path: string,
  ): Promise<Permission> {
    try {
      const permission = await this.prisma.permission.findFirst({
        where: {
          method: method,
          api_path: api_path,
        },
      });
      return permission;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    try {
      const permissionExists = await this.getPermissionByMethodAndApiPath(
        createPermissionDto.method,
        createPermissionDto.api_path,
      );

      if (permissionExists) {
        throw new ConflictException('Quyền hạn đã tồn tại');
      }

      const permission = await this.prisma.permission.create({
        data: createPermissionDto,
      });
      return permission;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll() {
    try {
      const permissions = await this.prisma.permission.findMany();
      return permissions;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAllByRoleId(roleId: number) {
    try {
      if (!roleId) {
        throw new BadRequestException('Id là bắt buộc!');
      }

      const permissions = await this.prisma.permission.findMany({
        where: {
          roles: {
            some: {
              roleId: roleId,
            },
          },
        },
      });
      return permissions;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAllWithPagination(query: PermssionQuery) {
    const { search, current, pageSize, method, module, sortByUpdatedAt } =
      query;
    try {
      const currentPage = current || 1;
      const itemsPerPage = pageSize || 10;
      const skip = (currentPage - 1) * itemsPerPage;
      const take = itemsPerPage;

      const whereClause: any = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { api_path: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(module && { module: module }),
        ...(method && {
          method: method,
        }),
      };

      const permissions = await this.prisma.permission.findMany({
        where: whereClause,
        take,
        skip,
        orderBy: {
          updated_at:
            sortByUpdatedAt === 'descend'
              ? 'desc'
              : sortByUpdatedAt === 'ascend'
                ? 'asc'
                : undefined,
        },
      });

      const totalRecords = await this.prisma.permission.count({
        where: whereClause,
      });

      return {
        permissions,
        pagination: {
          current: currentPage,
          pageSize: itemsPerPage,
          totalRecords,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    try {
      if (!id) {
        throw new BadRequestException('Quyền hạn đã tồn tại!');
      }

      const permission = await this.prisma.permission.update({
        where: { id },
        data: updatePermissionDto,
      });

      return permission;
    } catch (error) {
      console.log(error);
      if (error.code === 'P2002') {
        throw new ConflictException('Quyền hạn đã tồn tại');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      if (!id) {
        throw new BadRequestException('Quyền hạn không tồn tại!');
      }
      const permissionExists = await this.prisma.permission.findUnique({
        where: { id },
      });

      const existPermission = PERMISSION_DATA.find((item) => {
        return (
          permissionExists.api_path === item.api_path &&
          permissionExists.method === item.method
        );
      });

      if (existPermission) {
        throw new ConflictException('Không thể xóa quyền hạn mặc định');
      }

      const permission = await this.prisma.permission.delete({
        where: { id },
      });
      return permission;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
