import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async login(fullName: string, civilNumber: string) {
    if (!fullName || !civilNumber) {
      throw new Error('Invalid credentials');
    }
    return {
      token: 'demo-token',
      user: {
        id: 'u-' + civilNumber,
        name: fullName.trim(),
        civilNumber,
      },
    };
  }
}
