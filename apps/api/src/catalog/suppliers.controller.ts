import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { supplierSchema, type AccessTokenClaims, type SupplierData, type SupplierDto } from '@sijaf/shared';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { SuppliersService } from './suppliers.service.js';

/** الموردين وأسعار الشراء لصاحب المحل بس */
@Roles('owner')
@Controller('suppliers')
export class SuppliersController {
  constructor(@Inject(SuppliersService) private readonly suppliers: SuppliersService) {}

  @Get()
  list(@CurrentUser() auth: AccessTokenClaims): Promise<SupplierDto[]> {
    return this.suppliers.list(auth.shopId);
  }

  @Get(':id')
  get(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<SupplierDto> {
    return this.suppliers.get(auth.shopId, id);
  }

  @Post()
  create(
    @CurrentUser() auth: AccessTokenClaims,
    @Body(new ZodPipe(supplierSchema)) body: SupplierData,
  ): Promise<SupplierDto> {
    return this.suppliers.create(auth.shopId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() auth: AccessTokenClaims,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(supplierSchema)) body: SupplierData,
  ): Promise<SupplierDto> {
    return this.suppliers.update(auth.shopId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.suppliers.remove(auth.shopId, id);
  }
}
