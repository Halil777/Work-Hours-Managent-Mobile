import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

class LoginDto {
  fullName: string;
  civilNumber: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.fullName, dto.civilNumber);
  }
}
