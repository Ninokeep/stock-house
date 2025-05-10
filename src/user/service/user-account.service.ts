import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';

@Injectable()
export class UserAccountService {
  constructor(private userService: UserService) {}

  async userAccountIsDisabled(email: string) {
    const user = await this.userService.findByEmail(email);
    if (user) {
      return false;
    }
    return true;
  }
}
