import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import { pricingRulesSchema, type AccessTokenClaims, type PricingRules } from '@sijaf/shared';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { PricingRulesService } from './pricing-rules.service.js';

@Controller('pricing-rules')
export class PricingRulesController {
  constructor(@Inject(PricingRulesService) private readonly rules: PricingRulesService) {}

  @Get()
  get(@CurrentUser() auth: AccessTokenClaims): Promise<PricingRules> {
    return this.rules.get(auth.shopId);
  }

  @Roles('owner')
  @Put()
  update(
    @CurrentUser() auth: AccessTokenClaims,
    @Body(new ZodPipe(pricingRulesSchema)) body: PricingRules,
  ): Promise<PricingRules> {
    return this.rules.update(auth.shopId, body);
  }
}
