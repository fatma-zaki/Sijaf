import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post } from '@nestjs/common';
import {
  onboardingStepSchema,
  shopProfileSchema,
  type AccessTokenClaims,
  type MeDto,
  type OnboardingStep,
  type ShopDto,
  type ShopProfileData,
} from '@sijaf/shared';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { ShopsService } from './shops.service.js';

@Controller()
export class ShopsController {
  constructor(@Inject(ShopsService) private readonly shops: ShopsService) {}

  @Get('me')
  me(@CurrentUser() auth: AccessTokenClaims): Promise<MeDto> {
    return this.shops.me(auth.sub, auth.shopId);
  }

  @Roles('owner')
  @Patch('shop')
  updateProfile(
    @CurrentUser() auth: AccessTokenClaims,
    @Body(new ZodPipe(shopProfileSchema)) body: ShopProfileData,
  ): Promise<ShopDto> {
    return this.shops.updateProfile(auth.shopId, body);
  }

  @Roles('owner')
  @Post('shop/onboarding/steps/:step')
  @HttpCode(200)
  completeStep(
    @CurrentUser() auth: AccessTokenClaims,
    @Param('step', new ZodPipe(onboardingStepSchema)) step: OnboardingStep,
  ): Promise<ShopDto> {
    return this.shops.completeStep(auth.shopId, step);
  }

  @Roles('owner')
  @Post('shop/onboarding/dismiss')
  @HttpCode(200)
  dismiss(@CurrentUser() auth: AccessTokenClaims): Promise<ShopDto> {
    return this.shops.dismissOnboarding(auth.shopId);
  }
}
