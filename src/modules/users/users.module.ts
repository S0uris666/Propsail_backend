import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/database/prisma.module';
import { SecurityModule } from '../../infra/security/security.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
