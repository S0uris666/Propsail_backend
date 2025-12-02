import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infra/database/prisma.service';
import { VerifyTwoFADto } from './dto/verify-2fa.dto';
import { Prisma } from '@prisma/client';

export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

type TwoFactorTokenWithUser = Prisma.TwoFactorTokenGetPayload<{
  include: { user: true };
}>;

@Injectable()
export class AuthService {
  private readonly jwtExpiresInSeconds: number;
  private readonly invalidTokenMessage = 'Token inválido o expirado';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.jwtExpiresInSeconds = Math.max(
      60,
      this.getNumberConfig('JWT_EXPIRES_IN_SECONDS', 900),
    );
  }

  async verifyTwoFactor(dto: VerifyTwoFADto): Promise<AuthTokenResponse> {
    const tokenRecord = await this.findTokenWithUser(dto.challengeId);

    const token = dto.token;
    if (!token) {
      throw new UnauthorizedException(this.invalidTokenMessage);
    }

    this.ensureTokenIsValid(tokenRecord, token);
    await this.markTokenAsUsed(tokenRecord.id);

    const payload = { sub: tokenRecord.userId };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      expiresIn: this.jwtExpiresInSeconds,
      tokenType: 'Bearer',
    };
  }

  // Helpers de dominio 2FA

  private async findTokenWithUser(
    challengeId: string,
  ): Promise<TwoFactorTokenWithUser> {
    const tokenRecord = await this.prisma.twoFactorToken.findUnique({
      where: { id: challengeId },
      include: { user: true },
    });

    if (!tokenRecord) {
      this.throwInvalidToken();
    }

    return tokenRecord;
  }

  private ensureTokenIsValid(
    tokenRecord: TwoFactorTokenWithUser,
    incomingToken: string,
  ): void {
    if (!tokenRecord.user || !tokenRecord.user.isActive) {
      this.throwInvalidToken();
    }

    if (tokenRecord.used) {
      this.throwInvalidToken();
    }

    if (tokenRecord.token !== incomingToken) {
      this.throwInvalidToken();
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      this.throwInvalidToken();
    }
  }

  private async markTokenAsUsed(id: string): Promise<void> {
    const { count } = await this.prisma.twoFactorToken.updateMany({
      where: { id, used: false },
      data: { used: true },
    });

    if (count === 0) {
      this.throwInvalidToken();
    }
  }

  private throwInvalidToken(): never {
    throw new UnauthorizedException(this.invalidTokenMessage);
  }

  // ───────────────────────────
  // Helpers de configuración
  // ───────────────────────────

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
}
