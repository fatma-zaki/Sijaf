import { Module } from '@nestjs/common';
import { ShopsModule } from '../shops/shops.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { MaterialsController } from './materials.controller.js';
import { MaterialsService } from './materials.service.js';
import { ModelsController } from './models.controller.js';
import { ModelsService } from './models.service.js';
import { SuppliersController } from './suppliers.controller.js';
import { SuppliersService } from './suppliers.service.js';

@Module({
  imports: [ShopsModule],
  controllers: [CatalogController, MaterialsController, SuppliersController, ModelsController],
  providers: [CatalogService, MaterialsService, SuppliersService, ModelsService],
  exports: [MaterialsService, ModelsService],
})
export class CatalogModule {}
