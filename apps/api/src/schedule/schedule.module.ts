import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module.js';
import { ScheduleController } from './schedule.controller.js';
import { ScheduleService } from './schedule.service.js';

@Module({
  imports: [ClientsModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
