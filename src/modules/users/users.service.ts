import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Gender, User } from '@prisma/client';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { PrismaService } from 'src/core/service/prisma.service';
import { SUPER_ADMIN } from 'src/shared/constant';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQuery } from './dto/query-pagination-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadAvatarUserDto } from './dto/upload-avatar-user.dto';
import { IUser } from './interface/users.interface';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
        throw new ConflictException('Người dùng đã tồn tại!');
      }

      const password = '123456';

      const newUser = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: this.getHashPassword(password),
        },
      });
      delete newUser.password;

      return newUser;
    } catch (error) {
      console.log(error);
      if (error.code === 'P2002') {
        throw new ConflictException('Người dùng đã tồn tại!');
      }
      throw error;
    }
  }

  async findAll(query: UserQuery) {
    const { search, current, pageSize, role, status, sortByUpdatedAt } = query;
    try {
      const currentPage = current || 1;
      const itemsPerPage = pageSize || 10;
      const skip = (currentPage - 1) * itemsPerPage;
      const take = itemsPerPage;

      const whereClause: any = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(role && { roleId: Number(role) }),
        ...(status && {
          active: status === 'active' ? true : false,
        }),
      };

      const users = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          role: true,
        },
        skip,
        take,
        orderBy: {
          updated_at:
            sortByUpdatedAt === 'descend'
              ? 'desc'
              : sortByUpdatedAt === 'ascend'
                ? 'asc'
                : undefined,
        },
      });

      const userSanitized = users.map((user) => {
        delete user.password;
        delete user.refresh_token;
        return user;
      });

      const totalRecords = await this.prisma.user.count({ where: whereClause });

      return {
        users: userSanitized,
        pagination: {
          current: currentPage,
          pageSize: itemsPerPage,
          totalRecords,
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
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
      delete user.password;
      delete user.refresh_token;
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

  async updateStatus(id: number, status: number) {
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });
      if (user && user.email === SUPER_ADMIN.email) {
        throw new ForbiddenException(
          'Không thể thay đổi trạng thái của tài khoản này',
        );
      }

      const updatedUser = await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          active: status === 1 ? true : false,
        },
      });
      delete updatedUser.password;
      delete updatedUser.refresh_token;
      return updatedUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      if (!id) {
        throw new BadRequestException('Id bắt buộc');
      }
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

      const updatedUser = await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          name: updateUserDto?.name,
          phone_number: updateUserDto?.phone_number || null,
          company: updateUserDto?.company || null,
          date_of_birth: updateUserDto?.date_of_birth || null,
          generation: updateUserDto?.generation || null,
          is_external_guest: updateUserDto?.is_external_guest || false,
          major: updateUserDto?.major || null,
          school: updateUserDto?.school || null,
          gender: updateUserDto?.gender as Gender,
          roleId: updateUserDto?.roleId,
          job_title: updateUserDto?.job_title || null,
        },
      });
      delete updatedUser.password;
      delete updatedUser.refresh_token;
      return updatedUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateAvatar(id: number, data: UploadAvatarUserDto, image: any) {
    const { public_id } = data;
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }
      if (!public_id) {
        throw new BadRequestException('Public_id is required');
      }
      const deleteImage = await this.cloudinaryService.deleteFile(public_id);

      const avatar = await this.cloudinaryService.uploadFile(image);

      const updatedUserAvatar = await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          avatar_url: avatar.secure_url,
          public_id: avatar.public_id,
        },
      });
      delete updatedUserAvatar.password;
      delete updatedUserAvatar.refresh_token;
      return updatedUserAvatar;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getProfile(user: IUser) {
    const { id } = user;
    try {
      if (!id) {
        throw new BadRequestException('Id is required');
      }

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
      delete user.password;
      delete user.refresh_token;
      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateUserProfile(user: IUser, updateUserDto: UpdateUserDto) {
    const { id } = user;
    try {
      if (!id) {
        throw new BadRequestException('Id bắt buộc');
      }

      const updatedUser = await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          name: updateUserDto?.name,
          phone_number: updateUserDto?.phone_number || null,
          company: updateUserDto?.company || null,
          date_of_birth: updateUserDto?.date_of_birth || null,
          generation: updateUserDto?.generation || null,
          major: updateUserDto?.major || null,
          school: updateUserDto?.school || null,
          gender: updateUserDto?.gender as Gender,
          job_title: updateUserDto?.job_title || null,
        },
      });
      delete updatedUser.password;
      delete updatedUser.refresh_token;
      return updatedUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
