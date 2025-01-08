import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { PrismaService } from 'src/core/service/prisma.service';
import { hashSync, genSaltSync, compareSync } from 'bcrypt';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserQuery } from './interface/user.query.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getHashPassword(password: string) {
    const salt = genSaltSync(10);
    const hashPassword = hashSync(password, salt);
    return hashPassword;
  }

  isValidPassword(password: string, hashPassword: string) {
    return compareSync(password, hashPassword);
  }

  async updateUserRefreshToken(
    id: number,
    refresh_token: string | null,
  ): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          refresh_token,
        },
      });
      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findRefreshTokenByUserId(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          roleId: true,
          refresh_token: true,
        },
      });
      return user;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = await this.findOneByEmail(createUserDto.email);
      if (user) {
        throw new ConflictException('Email already exists');
      }

      const newUser = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: this.getHashPassword(createUserDto.password),
        },
      });
      delete newUser.password;

      return newUser;
    } catch (error) {
      console.log(error);
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  //
  async findAll(query: UserQuery) {
    const { search, current, pageSize } = query;
    try {
      const currentPage = current || 1;
      const itemsPerPage = pageSize || 10;
      const skip = (currentPage - 1) * itemsPerPage;
      const take = itemsPerPage;

      const whereClause: any = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const users = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          role: true,
        },
        skip,
        take,
      });

      const userSanitized = users.map((user) => {
        delete user.password;
        delete user.refresh_token;
        delete user.deleted_at;
        delete user.role.deleted_at;
        return user;
      });

      const totalRecords = await this.prisma.user.count({
        where: whereClause,
      });

      return {
        users: userSanitized,
        pagination: {
          current: currentPage,
          pageSize: itemsPerPage,
          totalRecords,
          totalPages: Math.ceil(totalRecords / itemsPerPage),
        },
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAccountUser(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const permissions = await this.prisma.permission.findMany({
        where: {
          roles: {
            some: {
              roleId: user.roleId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          api_path: true,
          method: true,
          module: true,
        },
      });

      delete user.password;
      delete user.refresh_token;
      delete user.deleted_at;
      delete user.role.deleted_at;

      const account = { ...user, permissions };
      return account;
    } catch (error) {
      return null;
    }
  }

  async getAccountUserAuth(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          active: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              active: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  async findOne(id: number) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
      delete user.password;
      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOneByEmail(email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
        include: {
          role: true,
        },
      });

      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
