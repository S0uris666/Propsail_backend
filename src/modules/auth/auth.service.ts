import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/infra/database/prisma.service';
import { EmailService } from 'src/infra/mail/email.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
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

    const expirationSeconds = this.configService.get<number>(
      'TWO_FA_EXPIRES_IN_SECONDS',
      900,
    );
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000);

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
      expiresIn: expirationSeconds,
      token: code,
    };
  }

  private generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
