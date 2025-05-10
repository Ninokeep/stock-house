import { HttpException, HttpStatus } from '@nestjs/common';

export class BadCredentialsException extends HttpException {
  constructor() {
    super('Bad credentials', HttpStatus.NOT_FOUND);
  }
}
