import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthTokenResponse } from './auth.service';
import { VerifyTwoFADto } from './dto/verify-2fa.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  verifyTwoFactor(@Body() dto: VerifyTwoFADto): Promise<AuthTokenResponse> {
    return this.authService.verifyTwoFactor(dto);
  }
}
