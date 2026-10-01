import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  onboardingStepSchema,
  shopProfileSchema,
  type AccessTokenClaims,
  type MeDto,
  type OnboardingStep,
  type ShopDto,
  type ShopProfileData,
} from '@sijaf/shared';
import type { Response } from 'express';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { ShopsService } from './shops.service.js';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

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

  @Get('shop/logo')
  async logo(@CurrentUser() auth: AccessTokenClaims, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const file = await this.shops.logo(auth.shopId);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    return new StreamableFile(file.bytes, { type: file.contentType });
  }

  @Roles('owner')
  @Post('shop/logo')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('logo', { limits: { fileSize: MAX_LOGO_BYTES, files: 1 } }))
  setLogo(@CurrentUser() auth: AccessTokenClaims, @UploadedFile() file: Express.Multer.File | undefined): Promise<ShopDto> {
    if (!file) throw new BadRequestException('ارفع صورة اللوجو');
    return this.shops.setLogo(auth.shopId, file.buffer);
  }

  @Roles('owner')
  @Delete('shop/logo')
  removeLogo(@CurrentUser() auth: AccessTokenClaims): Promise<ShopDto> {
    return this.shops.removeLogo(auth.shopId);
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
