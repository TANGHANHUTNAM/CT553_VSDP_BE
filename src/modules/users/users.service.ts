import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { PrismaService } from 'src/core/service/prisma.service';
import { hashSync, genSaltSync, compareSync } from 'bcrypt';
import { ConflictException, NotFoundException } from '@nestjs/common';

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

  async findAll() {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          role: true,
        },
      });
      return users.map((user) => {
        delete user.password;
        return user;
      });
    } catch (error) {
      console.log(error);
      throw error;
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
