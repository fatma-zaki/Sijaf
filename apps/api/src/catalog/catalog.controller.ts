import { Controller, Get, HttpCode, Inject, Post } from '@nestjs/common';
import type { AccessTokenClaims, CatalogCountsDto, TemplateApplyResult } from '@sijaf/shared';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import { CatalogService } from './catalog.service.js';

@Roles('owner')
@Controller('catalog')
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  /** عدادات تبويبات الكتالوج */
  @Get('counts')
  counts(@CurrentUser() auth: AccessTokenClaims): Promise<CatalogCountsDto> {
    return this.catalog.counts(auth.shopId);
  }

  @Post('template')
  @HttpCode(200)
  applyTemplate(@CurrentUser() auth: AccessTokenClaims): Promise<TemplateApplyResult> {
    return this.catalog.applyTemplate(auth.shopId);
  }
}
