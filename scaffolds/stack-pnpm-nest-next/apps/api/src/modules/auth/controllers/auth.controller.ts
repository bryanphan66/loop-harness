import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AuthTokens,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  UserDto,
} from '@__PROJECT_SLUG__/shared-types';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { UsersService } from '../../users/services/users.service';
import { loginSchema, refreshSchema } from '../dto/auth-schemas';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../services/auth.service';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange email/password for JWT pair' })
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate tokens using a refresh token' })
  refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshRequest): Promise<AuthTokens> {
    return this.authService.refresh(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserDto> {
    return this.usersService.findOne(user.userId);
  }
}
