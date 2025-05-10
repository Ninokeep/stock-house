import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { decodeToken } from 'src/utils/decode-token';
import { AccountDisabledException } from '../../user/exceptions/account-disabled.exception';
import { UserAccountService } from 'src/user/service/user-account.service';

@Injectable()
export class AccountDisabledGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userAccountService: UserAccountService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tokenDecoded = decodeToken(context, this.jwtService);
    const accountIsDisabled =
      await this.userAccountService.userAccountIsDisabled(tokenDecoded.email);
    if (accountIsDisabled) {
      throw new AccountDisabledException();
    }
    return true;
  }
}
