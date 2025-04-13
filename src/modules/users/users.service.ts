import { Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Gender, User } from '@prisma/client';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import dayjs from 'dayjs';
import { console } from 'inspector';
import ms from 'ms';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';
import { MailService } from 'src/mail/mail.service';
import {
  MAX_OPT_ATTEMPTS,
  MAX_OPT_ATTEMPTS_TTL,
  MAX_SEND_MAIL,
  MAX_SEND_MAIL_TTL,
  OTP_TTL,
  SUPER_ADMIN,
} from 'src/shared/constant';
import {
  generateOTP,
  generateRandomPassword,
  isInDateRange,
} from 'src/shared/func';
import { CreateListUserDto } from './dto/create-list-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQuery } from './dto/query-pagination-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadAvatarUserDto } from './dto/upload-avatar-user.dto';
import { IUser } from './interface/users.interface';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private logService: LogService,
    private mailService: MailService,
    private cacheManager: Cache,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.logService.setContext(UsersService.name);
  }

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
    refresh_token: string,
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

      const password = generateRandomPassword(6);

      const newUser = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: this.getHashPassword(password),
        },
        include: {
          role: true,
        },
      });
      delete newUser.password;
      delete newUser.refresh_token;
      if (newUser) {
        this.mailService.sendMail([
          {
            userEmail: newUser.email,
            userName: newUser.name,
            userPassword: password,
            userRole: newUser.role.name,
          },
        ]);
      }
      return newUser;
    } catch (error) {
      console.log(error);
      if (error.code === 'P2002') {
        throw new ConflictException('Người dùng đã tồn tại!');
      }
      throw error;
    }
  }

  async createBatch(createListUserDto: CreateListUserDto) {
    const { users } = createListUserDto;
    try {
      const emailList = users.map((user) => user.email);

      const duplicateEmailsInDb = await this.prisma.user.findMany({
        where: {
          email: {
            in: emailList,
          },
        },
        select: {
          email: true,
        },
      });

      const duplicateEmails = duplicateEmailsInDb.map((user) => user.email);

      const duplicateDetails = users
        .map((user, index) => ({
          row: index + 1,
          email: user.email,
          isDuplicate: duplicateEmails.includes(user.email),
        }))
        .filter((item) => item.isDuplicate);

      if (duplicateDetails.length > 0) {
        throw new ConflictException(duplicateDetails);
      }

      const usersData = users.map((user) => ({
        ...user,
        password: generateRandomPassword(6),
      }));

      const role = await this.prisma.role.findUnique({
        where: {
          id: usersData[0].roleId,
        },
      });

      const usersDateHashPassword = usersData.map((user) => ({
        ...user,
        password: this.getHashPassword(user.password),
      }));

      const newUsers = await this.prisma.user.createMany({
        data: usersDateHashPassword,
      });

      if (newUsers) {
        this.mailService.sendMail(
          usersData.map((user) => ({
            userEmail: user.email,
            userName: user.name,
            userPassword: user.password,
            userRole: role.name,
          })),
        );
      }
      return newUsers;
    } catch (error) {
      console.log(error);
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
          start_date: updateUserDto?.start_date || null,
          end_date: updateUserDto?.end_date || null,
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

      if (public_id) {
        await this.cloudinaryService.deleteFile(public_id);
      }
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

  async updateStatusAccountUsersInSystem() {
    try {
      const dateNow = dayjs(new Date()).tz().format();
      const usersDb = await this.prisma.user.findMany({});
      const usersInactive = usersDb.filter((user) => {
        const start = dayjs(user.start_date).tz().format();
        const end = dayjs(user.end_date).tz().format();
        const is_inRange = isInDateRange(dateNow, start, end);
        return !is_inRange;
      });

      const usersInactiveNotSuperAdmin = usersInactive.filter(
        (user) => user.email !== SUPER_ADMIN.email,
      );
      const usersInactiveIds = usersInactiveNotSuperAdmin.map(
        (user) => user.id,
      );
      const usersUpdateStatus = await this.prisma.user.updateMany({
        where: {
          id: {
            in: usersInactiveIds,
          },
        },
        data: {
          active: false,
        },
      });
      this.logService.log('Update status account users in system');
      return usersUpdateStatus;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async sendMailOTP(email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Email là bắt buộc!');
      }
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        throw new BadRequestException('Thông tin không hợp lệ!');
      }

      const attemptsKey = `otp_send_attempts:${email}`;
      const attempts = (await this.cacheManager.get(attemptsKey)) || 0;
      if ((attempts as number) >= MAX_SEND_MAIL) {
        throw new UnauthorizedException(
          'Bạn đã vượt quá số lần gửi OTP. Vui lòng thử lại sau 1 giờ!',
        );
      }

      const OTP = generateOTP();
      await this.mailService.sendMailOtpChangePassword({
        userEmail: email,
        userOTP: OTP,
      });
      this.logService.debug(OTP);
      await this.cacheManager.set(email, OTP, OTP_TTL);
      await this.cacheManager.set(
        attemptsKey,
        (attempts as number) + 1,
        MAX_SEND_MAIL_TTL,
      );

      return 300;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async verifyOTP(email: string, otp: string) {
    try {
      const cacheOTP = await this.cacheManager.get(email);
      this.logService.debug(cacheOTP);

      const attemptsKey = `otp_verify_attempts:${email}`;
      const attempts = (await this.cacheManager.get(attemptsKey)) || 0;

      if ((attempts as number) >= MAX_OPT_ATTEMPTS) {
        throw new UnauthorizedException(
          'Bạn đã vượt quá số lần nhập OTP. Vui lòng thử lại sau 1 phút!',
        );
      }

      if (cacheOTP !== otp) {
        await this.cacheManager.set(
          attemptsKey,
          (attempts as number) + 1,
          MAX_OPT_ATTEMPTS_TTL,
        );
        throw new BadRequestException('Mã OTP không chính xác hoặc hết hạn!');
      }

      await this.cacheManager.del(email);
      await this.cacheManager.del(attemptsKey);

      // Tạo token tạm thời
      const tempToken = this.generateTokenOTP(email);
      await this.cacheManager.set(
        `temp_token:${tempToken}`,
        email,
        ms(this.configService.get<string>('TOKEN_OTP_EXPIRED')),
      );

      return { email, temp_token: tempToken };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  generateTokenOTP(email: string) {
    const tempToken = this.jwtService.sign(
      { email },
      {
        secret: this.configService.get<string>('TOKEN_OTP_SECRET'),
        expiresIn: this.configService.get<string>('TOKEN_OTP_EXPIRED'),
      },
    );
    return tempToken;
  }

  async changePassword(email: string, newPassword: string, tempToken: string) {
    try {
      const cachedEmail = await this.cacheManager.get(
        `temp_token:${tempToken}`,
      );
      if (!cachedEmail || cachedEmail !== email) {
        throw new UnauthorizedException('Token không hợp lệ! Vui lòng thử lại');
      }
      const hashedPassword = this.getHashPassword(newPassword);
      await this.prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      await this.cacheManager.del(`temp_token:${tempToken}`);
      return 'ok';
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
