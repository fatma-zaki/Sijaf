import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  materialImportSchema,
  materialListQuerySchema,
  materialSchema,
  type AccessTokenClaims,
  type MaterialData,
  type MaterialDto,
  type MaterialImportResult,
  type MaterialListDto,
  type MaterialPublicDto,
} from '@sijaf/shared';
import type { z } from 'zod';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { MaterialsService } from './materials.service.js';

@Controller('materials')
export class MaterialsController {
  constructor(@Inject(MaterialsService) private readonly materials: MaterialsService) {}

  /** الكتالوج بأسعار الشراء والهامش */
  @Roles('owner')
  @Get()
  list(
    @CurrentUser() auth: AccessTokenClaims,
    @Query(new ZodPipe(materialListQuerySchema)) query: z.output<typeof materialListQuerySchema>,
  ): Promise<MaterialListDto> {
    return this.materials.list(auth.shopId, query);
  }

  /** للقوايم: صاحب المحل والفني (الفني من غير أسعار الشراء) */
  @Get('options')
  options(@CurrentUser() auth: AccessTokenClaims): Promise<MaterialDto[] | MaterialPublicDto[]> {
    return this.materials.options(auth.shopId, auth.role);
  }

  @Roles('owner')
  @Post('import')
  @HttpCode(200)
  import(
    @CurrentUser() auth: AccessTokenClaims,
    @Body(new ZodPipe(materialImportSchema)) body: z.output<typeof materialImportSchema>,
  ): Promise<MaterialImportResult> {
    return this.materials.import(auth.shopId, body.rows);
  }

  @Roles('owner')
  @Get(':id')
  get(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<MaterialDto> {
    return this.materials.get(auth.shopId, id);
  }

  @Roles('owner')
  @Post()
  create(
    @CurrentUser() auth: AccessTokenClaims,
    @Body(new ZodPipe(materialSchema)) body: MaterialData,
  ): Promise<MaterialDto> {
    return this.materials.create(auth.shopId, body);
  }

  @Roles('owner')
  @Patch(':id')
  update(
    @CurrentUser() auth: AccessTokenClaims,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(materialSchema)) body: MaterialData,
  ): Promise<MaterialDto> {
    return this.materials.update(auth.shopId, id, body);
  }

  @Roles('owner')
  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.materials.remove(auth.shopId, id);
  }
}
