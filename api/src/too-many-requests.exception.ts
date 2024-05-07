import { HttpException, HttpStatus } from '@nestjs/common';

export class TooManyRequestsException extends HttpException {
  constructor() {
    super('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
  }
}
