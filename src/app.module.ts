import { Module } from '@nestjs/common';
import { EmailModule } from './infra/mail/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './infra/database/prisma.module';

@Module({
  imports: [AppConfigModule, PrismaModule, EmailModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
