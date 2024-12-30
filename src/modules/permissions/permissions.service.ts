import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from 'src/core/service/prisma.service';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async checkPermission(
    roleId: number,
    api_path: string,
    method: string,
  ): Promise<boolean> {
    console.log('roleId', roleId, 'api_path', api_path, 'method', method);
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
        throw new ConflictException('Permission already exists');
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

  findAll() {
    return `This action returns all permissions`;
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
        throw new BadRequestException('Permission id is required');
      }

      const permission = await this.prisma.permission.update({
        where: { id },
        data: updatePermissionDto,
      });

      return permission;
    } catch (error) {
      console.log(error);
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Permission method and api path already exists',
        );
      }
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
  }
}
