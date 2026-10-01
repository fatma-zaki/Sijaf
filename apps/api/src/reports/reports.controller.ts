import { Controller, Get, Inject, Query } from '@nestjs/common';
import { reportQuerySchema, type AccessTokenClaims, type DashboardDto, type ReportQueryData, type ReportsDto } from '@sijaf/shared';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { ReportsService } from './reports.service.js';

@Controller()
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  /** فيها الربح وأسعار الشراء: لصاحب المحل بس */
  @Roles('owner')
  @Get('reports')
  get(@CurrentUser() auth: AccessTokenClaims, @Query(new ZodPipe(reportQuerySchema)) query: ReportQueryData): Promise<ReportsDto> {
    return this.reports.reports(auth.shopId, query.period);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() auth: AccessTokenClaims): Promise<DashboardDto> {
    return this.reports.dashboard(auth);
  }
}
