import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { QuotesController } from './quotes.controller.js';
import { QuotesService } from './quotes.service.js';

@Module({
  imports: [CatalogModule, PricingModule],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
