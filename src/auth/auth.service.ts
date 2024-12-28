import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      const isValidPassword = this.usersService.isValidPassword(
        password,
        user.password,
      );
      delete user.password;
      return isValidPassword ? user : null;
    }
    return null;
  }
}
