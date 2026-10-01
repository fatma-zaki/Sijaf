import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import {
  appointmentListQuerySchema,
  appointmentSchema,
  type AccessTokenClaims,
  type AppointmentData,
  type AppointmentDto,
  type AppointmentListQueryData,
} from '@sijaf/shared';
import { CurrentUser, Quoters } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { ScheduleService } from './schedule.service.js';

/** كل الفريق بيشوف المواعيد؛ صاحب المحل وفني المعاينة بيحددوها */
@Controller('appointments')
export class ScheduleController {
  constructor(@Inject(ScheduleService) private readonly schedule: ScheduleService) {}

  @Get()
  list(@CurrentUser() auth: AccessTokenClaims, @Query(new ZodPipe(appointmentListQuerySchema)) query: AppointmentListQueryData): Promise<AppointmentDto[]> {
    return this.schedule.list(auth.shopId, query);
  }

  @Get(':id')
  get(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<AppointmentDto> {
    return this.schedule.get(auth.shopId, id);
  }

  @Quoters()
  @Post()
  create(@CurrentUser() auth: AccessTokenClaims, @Body(new ZodPipe(appointmentSchema)) body: AppointmentData): Promise<AppointmentDto> {
    return this.schedule.create(auth.shopId, auth.sub, body);
  }

  @Quoters()
  @Put(':id')
  update(
    @CurrentUser() auth: AccessTokenClaims,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(appointmentSchema)) body: AppointmentData,
  ): Promise<AppointmentDto> {
    return this.schedule.update(auth.shopId, id, body);
  }

  @Quoters()
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.schedule.remove(auth.shopId, id);
  }
}
