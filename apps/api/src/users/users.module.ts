import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TeamController } from './team.controller.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [AuthModule],
  controllers: [UsersController, TeamController],
  providers: [UsersService],
})
export class UsersModule {}
