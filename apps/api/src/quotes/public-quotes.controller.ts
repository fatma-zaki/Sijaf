import { Controller, Get, HttpCode, Inject, Param, Post, Res, StreamableFile } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { PublicQuoteDto } from '@sijaf/shared';
import type { Response } from 'express';
import { Public } from '../common/auth.decorators.js';
import type { StoredFile } from '../storage/storage.js';
import { PublicQuotesService } from './public-quotes.service.js';

function image(file: StoredFile, res: Response): StreamableFile {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return new StreamableFile(file.bytes, { type: file.contentType });
}

/** صفحة العميل /q/[token]: من غير تسجيل دخول */
@Public()
@Controller('public/quotes/:token')
export class PublicQuotesController {
  constructor(@Inject(PublicQuotesService) private readonly quotes: PublicQuotesService) {}

  @Get()
  get(@Param('token') token: string): Promise<PublicQuoteDto> {
    return this.quotes.get(token);
  }

  @Get('photo')
  async photo(@Param('token') token: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    return image(await this.quotes.photo(token), res);
  }

  @Get('logo')
  async logo(@Param('token') token: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    return image(await this.quotes.logo(token), res);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('opened')
  @HttpCode(204)
  async opened(@Param('token') token: string): Promise<void> {
    await this.quotes.recordOpened(token);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('pdf-downloaded')
  @HttpCode(204)
  async pdfDownloaded(@Param('token') token: string): Promise<void> {
    await this.quotes.recordPdfDownloaded(token);
  }
}
