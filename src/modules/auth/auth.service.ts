import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma.service';
import { EmailService } from 'src/infra/mail/email.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const code = this.generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const challenge = await this.prisma.twoFactorToken.create({
      data: {
        userId: user.id,
        token: code,
        expiresAt,
        used: false,
      },
    });

    await this.emailService.sendTwoFactorToken(user.email, code, expiresAt);

    return {
      message: 'Código enviado al correo',
      challengeId: challenge.id,

      debugToken: code,
    };
  }

  private generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
