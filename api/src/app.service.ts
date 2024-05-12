import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot(): string {
    return `Hello World!\nThis is probably maybe working correctly.\nCurrent server time: ${new Date()}`;
  }
}
