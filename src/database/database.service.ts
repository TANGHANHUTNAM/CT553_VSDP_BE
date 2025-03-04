import {
  ConsoleLogger,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/core/prisma.service';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { RolesService } from 'src/modules/roles/roles.service';
import { UsersService } from 'src/modules/users/users.service';
import { PERMISSION_DATA } from './data/permissions.data';
import { ROLE, ROLE_DATA } from './data/roles.data';
import { SUPER_ADMIN } from 'src/shared/constant';
import { SCHOOL } from './data/school.data';

const logger = new ConsoleLogger();

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private userService: UsersService,
  ) {}
  async createRolePermissionsInBatches(
    roleId: number,
    permissions: { id: number }[],
    batchSize: number = 10,
  ) {
    for (let i = 0; i < permissions.length; i += batchSize) {
      const batch = permissions.slice(i, i + batchSize);
      await Promise.all(
        batch.map((permission) =>
          this.prismaService.rolePermission.create({
            data: {
              roleId: +roleId,
              permissionId: +permission.id,
            },
          }),
        ),
      );
    }
  }

  async onModuleInit() {
    const isInit = this.configService.get<string>('IS_INIT_DATA');
    if (isInit === 'true') {
      logger.log('>>>>>>>>> INITIALIZING DATA <<<<<<<<<');
      const counterUser = await this.prismaService.user.count({});
      const counterRole = await this.prismaService.role.count({});
      const counterPermission = await this.prismaService.permission.count({});
      const counterSchool = await this.prismaService.universities.count({});
      if (counterSchool === 0) {
        await this.prismaService.universities.createMany({
          data: SCHOOL,
        });
      }

      if (counterRole === 0) {
        await this.prismaService.role.createMany({ data: ROLE_DATA });
      }

      if (counterPermission === 0) {
        await this.prismaService.permission.createMany({
          data: PERMISSION_DATA,
        });
      }

      if (counterUser === 0) {
        const adminRole = await this.prismaService.role.findUnique({
          where: {
            name: ROLE.SUPER_ADMIN,
          },
          include: {
            permissions: true,
          },
        });

        if (adminRole.permissions.length === 0) {
          const permissions = await this.prismaService.permission.findMany();
          await this.createRolePermissionsInBatches(adminRole.id, permissions);
        }
        await this.prismaService.user.create({
          data: {
            email: SUPER_ADMIN.email,
            password: this.userService.getHashPassword(SUPER_ADMIN.password),
            name: SUPER_ADMIN.name,
            roleId: adminRole.id,
          },
        });
      }

      if (
        counterUser > 0 &&
        counterRole > 0 &&
        counterPermission > 0 &&
        counterSchool > 0
      ) {
        logger.log('>>>>>>>>> DATA INITIALIZED <<<<<<<<<');
      }
    }
  }
}
