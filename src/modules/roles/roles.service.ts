import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/core/prisma.service';
import { Role } from '@prisma/client';
import { SUPER_ADMIN } from 'src/shared/constant';
import { RoleQuery } from './dto/query-pagination-role.dto';
import { updateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async getRoleByName(name: string): Promise<Role> {
    try {
      const role = await this.prisma.role.findUnique({
        where: {
          name,
        },
      });
      return role;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      const roleExist = await this.getRoleByName(createRoleDto.name);
      if (roleExist) {
        throw new ConflictException('Role name already exists');
      }
      const role = await this.prisma.role.create({
        data: createRoleDto,
      });
      return role;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAllWithPagination(query: RoleQuery) {
    const { search, current, pageSize, status, sortByUpdatedAt } = query;
    try {
      const currentPage = current || 1;
      const itemsPerPage = pageSize || 10;
      const skip = (currentPage - 1) * itemsPerPage;
      const take = itemsPerPage;

      const whereClause: any = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(status && {
          active: status === 'active' ? true : false,
        }),
      };

      const roles = await this.prisma.role.findMany({
        where: whereClause,
        orderBy: {
          updated_at:
            (sortByUpdatedAt ?? sortByUpdatedAt === 'descend') ? 'desc' : 'asc',
        },
        skip,
        take,
      });

      const totalRecords = await this.prisma.role.count({
        where: whereClause,
      });
      return {
        roles,
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

  async findAll() {
    try {
      const roles = await this.prisma.role.findMany({
        select: {
          id: true,
          name: true,
        },
        where: {
          active: true,
        },
        orderBy: {
          id: 'asc',
        },
      });
      return roles;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    try {
      if (!id) {
        throw new BadRequestException('Id là bắt buộc');
      }

      const role = await this.prisma.role.update({
        where: {
          id,
        },
        data: updateRoleDto,
      });
      return role;
    } catch (error) {
      console.log(error);
      if (error.code === 'P2002') {
        throw new ConflictException('Vai trò đã tồn tại');
      }
      throw error;
    }
  }

  async updateRolePermission(id: number, body: updateRolePermissionsDto) {
    const { permissions: newPermissionIds } = body;

    try {
      if (!id) {
        throw new BadRequestException('Id là bắt buộc');
      }

      const validPermissions = await this.prisma.permission.findMany({
        where: {
          id: { in: newPermissionIds },
        },
        select: { id: true },
      });

      const validPermissionIds = validPermissions.map((p) => p.id);
      const invalidPermissionIds = newPermissionIds.filter(
        (id) => !validPermissionIds.includes(id),
      );

      if (invalidPermissionIds.length > 0) {
        throw new BadRequestException(
          `Các permissionId không tồn tại: ${invalidPermissionIds.join(', ')}`,
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        const currentPermissions = await tx.rolePermission.findMany({
          where: { roleId: id },
          select: { permissionId: true },
        });
        const currentPermissionIds = currentPermissions.map(
          (p) => p.permissionId,
        );

        const permissionsToAdd = validPermissionIds.filter(
          (pid) => !currentPermissionIds.includes(pid),
        );
        const permissionsToRemove = currentPermissionIds.filter(
          (pid) => !validPermissionIds.includes(pid),
        );

        if (permissionsToRemove.length > 0) {
          await tx.rolePermission.deleteMany({
            where: {
              roleId: id,
              permissionId: { in: permissionsToRemove },
            },
          });
        }

        if (permissionsToAdd.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionsToAdd.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
            skipDuplicates: true,
          });
        }

        return { permissions: validPermissionIds };
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateRoleStatus(id: number, status: number): Promise<Role> {
    try {
      if (!id) {
        throw new BadRequestException('Id là bắt buộc');
      }

      const roleAdmin = await this.prisma.role.findUnique({
        where: {
          id,
        },
      });

      if (roleAdmin.name === SUPER_ADMIN.name) {
        throw new ForbiddenException(
          'Không thể cập nhật trạng thái của vai trò quản trị hệ thống',
        );
      }

      const role = await this.prisma.role.update({
        where: {
          id,
        },
        data: {
          active: status === 1 ? true : false,
        },
      });
      return role;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}
