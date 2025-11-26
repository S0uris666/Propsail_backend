import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infra/database/prisma.module';
import { EmailModule } from './infra/mail/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppConfigModule } from './config/app-config.module';

@Module({
  imports: [AppConfigModule, PrismaModule, EmailModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
