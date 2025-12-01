import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infra/database/prisma.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');

        if (!secret || !secret.trim()) {
          throw new Error('La variable de entorno JWT_SECRET es obligatoria.');
        }

        const rawExpires = config.get<string | number>(
          'JWT_EXPIRES_IN_SECONDS',
          900,
        );

        let expiresInSeconds: number;

        if (typeof rawExpires === 'number') {
          expiresInSeconds = rawExpires;
        } else {
          const trimmed = rawExpires?.toString().trim() ?? '';
          const parsed = Number(trimmed);
          expiresInSeconds = Number.isNaN(parsed) || parsed <= 0 ? 900 : parsed;
        }

        expiresInSeconds = Math.max(60, expiresInSeconds);

        return {
          secret,
          signOptions: {
            expiresIn: expiresInSeconds,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
