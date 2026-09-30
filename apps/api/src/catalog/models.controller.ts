import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { curtainModelSchema, type AccessTokenClaims, type CurtainModelData, type CurtainModelDto } from '@sijaf/shared';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { ModelsService } from './models.service.js';

@Controller('models')
export class ModelsController {
  constructor(@Inject(ModelsService) private readonly models: ModelsService) {}

  /** الفني محتاجها في العروض؛ الأسعار فيها أسعار بيع بس */
  @Get()
  list(@CurrentUser() auth: AccessTokenClaims): Promise<CurtainModelDto[]> {
    return this.models.list(auth.shopId);
  }

  @Roles('owner')
  @Post('defaults')
  @HttpCode(200)
  addDefaults(@CurrentUser() auth: AccessTokenClaims): Promise<CurtainModelDto[]> {
    return this.models.addDefaults(auth.shopId);
  }

  @Get(':id')
  get(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<CurtainModelDto> {
    return this.models.get(auth.shopId, id);
  }

  @Roles('owner')
  @Post()
  create(
    @CurrentUser() auth: AccessTokenClaims,
    @Body(new ZodPipe(curtainModelSchema)) body: CurtainModelData,
  ): Promise<CurtainModelDto> {
    return this.models.create(auth.shopId, body);
  }

  @Roles('owner')
  @Patch(':id')
  update(
    @CurrentUser() auth: AccessTokenClaims,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(curtainModelSchema)) body: CurtainModelData,
  ): Promise<CurtainModelDto> {
    return this.models.update(auth.shopId, id, body);
  }

  @Roles('owner')
  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() auth: AccessTokenClaims, @Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.models.remove(auth.shopId, id);
  }
}
