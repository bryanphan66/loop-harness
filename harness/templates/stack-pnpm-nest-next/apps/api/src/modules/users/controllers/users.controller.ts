import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CreateUserRequest, UpdateUserRequest, UserDto } from '@__PROJECT_SLUG__/shared-types';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { createUserSchema, updateUserSchema } from '../dto/user-schemas';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (any authenticated role)' })
  findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one user' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserDto> {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create user (admin only)' })
  create(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserDto> {
    return this.usersService.create(body, actor.userId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user (admin only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserDto> {
    return this.usersService.update(id, body, actor.userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (admin only)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    await this.usersService.remove(id, actor.userId);
  }
}
