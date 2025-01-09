import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/core/service/prisma.service';
import { Role } from '@prisma/client';
import { SUPER_ADMIN } from 'src/shared/constant';

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

  async findAllWithPagination() {
    try {
      const roles = await this.prisma.role.findMany();
      return roles;
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
        throw new BadRequestException('Role id is required');
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
        throw new ConflictException('Role name already exists');
      }
      throw error;
    }
  }

  async updateRoleStatus(id: number, status: number): Promise<Role> {
    try {
      if (!id) {
        throw new BadRequestException('Role id is required');
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
