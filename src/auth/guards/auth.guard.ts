import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class Authorization implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UsersService,
    private permissionService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user && !user.id) {
      throw new UnauthorizedException('Unauthorized');
    }

    const request = context.switchToHttp().getRequest();
    const routePath = request.route?.path;
    const method = request.method;

    const userAuth = await this.userService.getAccountUserAuth(user.id);

    if (!userAuth) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (!userAuth.active) {
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa!');
    }

    if (!userAuth.role.active) {
      throw new ForbiddenException('Bạn không có quyền truy cập!');
    }

    if (
      routePath === '/api/v1/auth/logout' ||
      routePath === '/api/v1/auth/account'
    ) {
      return true;
    }

    const isPermission = await this.permissionService.checkPermission(
      userAuth.roleId,
      routePath,
      method,
    );

    if (!isPermission) {
      throw new ForbiddenException('Bạn không có quyền truy cập!');
    }

    return true;
  }
}
