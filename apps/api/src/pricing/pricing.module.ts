import { Module } from '@nestjs/common';
import { PricingRulesController } from './pricing-rules.controller.js';
import { PricingRulesService } from './pricing-rules.service.js';

@Module({
  controllers: [PricingRulesController],
  providers: [PricingRulesService],
  exports: [PricingRulesService],
})
export class PricingModule {}
