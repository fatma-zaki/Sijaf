import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  createTechnicianSchema,
  updateTechnicianSchema,
  type AccessTokenClaims,
  type CreateTechnicianData,
  type UpdateTechnicianInput,
  type UserDto,
} from '@sijaf/shared';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { UsersService } from './users.service.js';

@Roles('owner')
@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @Get()
  list(@CurrentUser() auth: AccessTokenClaims): Promise<UserDto[]> {
    return this.users.list(auth.shopId);
  }

  @Post()
  create(
    @CurrentUser() auth: AccessTokenClaims,
    @Body(new ZodPipe(createTechnicianSchema)) body: CreateTechnicianData,
  ): Promise<UserDto> {
    return this.users.createTechnician(auth.shopId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() auth: AccessTokenClaims,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(updateTechnicianSchema)) body: UpdateTechnicianInput,
  ): Promise<UserDto> {
    return this.users.updateTechnician(auth.shopId, id, body);
  }
}
