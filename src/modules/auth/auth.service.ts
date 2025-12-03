import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/infra/database/prisma.service';
import { EmailService } from 'src/infra/mail/email.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly invalidCredentialsMessage = 'Credenciales inválidas';

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
      throw new UnauthorizedException(this.invalidCredentialsMessage);
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(this.invalidCredentialsMessage);
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();

    const expirationSeconds = this.configService.get<number>(
      'TWO_FA_EXPIRES_IN_SECONDS',
      900,
    );
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000);

    const challenge = await this.prisma.twoFactorToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        used: false,
      },
    });

    await this.emailService.sendTwoFactorToken(user.email, token, expiresAt);

    return {
      message: 'Código enviado al correo',
      challengeId: challenge.id,
      token,
    };
  }
}
