import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import {
  clientListQuerySchema,
  createClientSchema,
  type AccessTokenClaims,
  type ClientDto,
  type ClientListDto,
  type ClientListQueryData,
  type CreateClientData,
} from '@sijaf/shared';
import { CurrentUser, Quoters } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { ClientsService } from './clients.service.js';

/** كل الفريق بيشوف العملاء (الفني محتاج الرقم والعنوان)؛ الإضافة للي بيعملوا عروض */
@Controller('clients')
export class ClientsController {
  constructor(@Inject(ClientsService) private readonly clients: ClientsService) {}

  @Get()
  list(@CurrentUser() auth: AccessTokenClaims, @Query(new ZodPipe(clientListQuerySchema)) query: ClientListQueryData): Promise<ClientListDto> {
    return this.clients.list(auth.shopId, query);
  }

  @Quoters()
  @Post()
  create(@CurrentUser() auth: AccessTokenClaims, @Body(new ZodPipe(createClientSchema)) body: CreateClientData): Promise<ClientDto> {
    return this.clients.create(auth.shopId, body);
  }
}
