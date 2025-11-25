import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infra/database/prisma.service';
import { Verify2FADto } from './dto/verify-2fa.dto';

export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresInSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.jwtSecret = this.getRequiredConfig('JWT_SECRET');
    this.jwtExpiresInSeconds = Math.max(
      60,
      this.getNumberConfig('JWT_EXPIRES_IN_SECONDS', 900),
    );
  }

  async verifyTwoFactor(dto: Verify2FADto): Promise<AuthTokenResponse> {
    const tokenRecord = await this.prisma.twoFactorToken.findUnique({
      where: { id: dto.challengeId },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.used ||
      !tokenRecord.user ||
      !tokenRecord.user.isActive
    ) {
      throw new UnauthorizedException('Token inv\u00E1lido o expirado');
    }

    if (tokenRecord.token !== dto.token) {
      throw new UnauthorizedException('Token inv\u00E1lido o expirado');
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Token inv\u00E1lido o expirado');
    }

    const updateResult = await this.prisma.twoFactorToken.updateMany({
      where: { id: tokenRecord.id, used: false },
      data: { used: true },
    });

    if (updateResult.count === 0) {
      throw new UnauthorizedException('Token inv\u00E1lido o expirado');
    }

    const payload = { sub: tokenRecord.userId };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresInSeconds,
    });

    return {
      accessToken,
      expiresIn: this.jwtExpiresInSeconds,
      tokenType: 'Bearer',
    };
  }

  private getNumberConfig(key: string, fallback: number): number {
    const value = this.configService.get<string | number>(key);
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    throw new Error(`La variable de entorno ${key} es obligatoria.`);
  }
}
