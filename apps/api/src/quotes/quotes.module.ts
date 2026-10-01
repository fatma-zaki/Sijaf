import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { PublicQuotesController } from './public-quotes.controller.js';
import { PublicQuotesService } from './public-quotes.service.js';
import { QuotesController } from './quotes.controller.js';
import { QuotesService } from './quotes.service.js';

@Module({
  imports: [CatalogModule, PricingModule],
  controllers: [QuotesController, PublicQuotesController],
  providers: [QuotesService, PublicQuotesService],
})
export class QuotesModule {}
