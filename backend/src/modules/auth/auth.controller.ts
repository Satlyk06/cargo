import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { phoneNumber: string; password: string }) {
    const user = await this.authService.validateUser(
      loginDto.phoneNumber,
      loginDto.password,
    );
    return await this.authService.login(user);
  }
}