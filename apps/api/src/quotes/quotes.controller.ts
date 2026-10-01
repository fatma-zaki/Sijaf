import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createQuoteSchema,
  quoteDetailsSchema,
  quotePricingSchema,
  type AccessTokenClaims,
  type AnalyzeResultDto,
  type CreateQuoteData,
  type PricingContextDto,
  type QuoteDetailsData,
  type QuoteDto,
  type QuotePricingData,
} from '@sijaf/shared';
import type { Response } from 'express';
import { CurrentUser, Quoters } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { QuotesService } from './quotes.service.js';

/** الصورة بتتضغط في المتصفح لـ 1400px قبل الرفع؛ الحد ده للأمان بس */
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

@Quoters()
@Controller('quotes')
export class QuotesController {
  constructor(@Inject(QuotesService) private readonly quotes: QuotesService) {}

  @Post()
  create(@CurrentUser() auth: AccessTokenClaims, @Body(new ZodPipe(createQuoteSchema)) body: CreateQuoteData): Promise<QuoteDto> {
    return this.quotes.create(auth.shopId, auth.sub, body);
  }

  @Get(':id')
  get(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<QuoteDto> {
    return this.quotes.get(auth.shopId, id);
  }

  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_PHOTO_BYTES, files: 1 } }))
  addPhoto(
    @CurrentUser() auth: AccessTokenClaims,
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<QuoteDto> {
    if (!file) throw new BadRequestException('ارفع صورة');
    return this.quotes.addPhoto(auth.shopId, id, auth.sub, file.buffer);
  }

  @Get(':id/photos/:index')
  async photo(
    @CurrentUser() auth: AccessTokenClaims,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('index', new ParseIntPipe()) index: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.quotes.getPhoto(auth.shopId, id, index);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return new StreamableFile(file.bytes, { type: file.contentType });
  }

  @Post(':id/analyze')
  @HttpCode(200)
  analyze(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<AnalyzeResultDto> {
    return this.quotes.analyze(auth.shopId, id, auth.sub);
  }

  @Put(':id/details')
  saveDetails(
    @CurrentUser() auth: AccessTokenClaims,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(quoteDetailsSchema)) body: QuoteDetailsData,
  ): Promise<QuoteDto> {
    return this.quotes.saveDetails(auth.shopId, id, auth.sub, body);
  }

  @Get(':id/pricing-context')
  pricingContext(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<PricingContextDto> {
    return this.quotes.pricingContext(auth.shopId, id);
  }

  @Put(':id/pricing')
  savePricing(
    @CurrentUser() auth: AccessTokenClaims,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(quotePricingSchema)) body: QuotePricingData,
  ): Promise<QuoteDto> {
    return this.quotes.savePricing(auth.shopId, id, auth.sub, body);
  }
}
