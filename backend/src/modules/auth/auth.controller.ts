import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlatformRoute } from '../../common/decorators/platform-route.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PlatformGuard } from '../platform/guards/platform.guard';
import type {
  AuthenticatedPlatformAdmin,
  AuthenticatedUser,
  RequestWithUser,
  TenantAuthenticatedUser,
} from './auth-request.types';
import { AuthService, type RefreshJwtPayload } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PlatformLoginDto } from './dto/platform-login.dto';
import { PlatformTokenResponseDto } from './dto/platform-token-response.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';

// Тип для request после jwt-refresh guard
type RequestWithRefreshPayload = RequestWithUser<RefreshJwtPayload>;

// Тип для request после jwt guard

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ----------------------------------------------------------------
  // POST /api/v1/auth/register
  // ----------------------------------------------------------------

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new company and admin user',
    description:
      'Creates a new company and its first admin user. Returns an access token and sets refresh token as an httpOnly cookie.',
  })
  @ApiResponse({ status: 201, type: TokenResponseDto })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const { accessToken, refreshToken, user } =
      await this.authService.register(dto);

    res.cookie(
      this.authService.refreshCookieName,
      refreshToken,
      this.authService.refreshCookieOptions,
    );

    return { accessToken, user };
  }

  // ----------------------------------------------------------------
  // POST /api/v1/auth/login
  // ----------------------------------------------------------------

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates user and returns access token. Refresh token is set as an httpOnly cookie.',
  })
  @ApiResponse({ status: 200, type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);

    res.cookie(
      this.authService.refreshCookieName,
      refreshToken,
      this.authService.refreshCookieOptions,
    );

    return { accessToken, user };
  }

  @Post('platform/login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login as a platform super admin',
    description:
      'Authenticates a platform super admin and returns a platform-scoped access token.',
  })
  @ApiResponse({ status: 200, type: PlatformTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async platformLogin(
    @Body() dto: PlatformLoginDto,
  ): Promise<PlatformTokenResponseDto> {
    return await this.authService.loginPlatform(dto);
  }

  @Post('platform/logout')
  @PlatformRoute()
  @UseGuards(PlatformGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Logout current platform super admin',
    description: 'Writes a platform audit logout event.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async platformLogout(
    @CurrentUser() admin: AuthenticatedPlatformAdmin,
  ): Promise<{ message: string }> {
    await this.authService.logoutPlatform(admin.id);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @PlatformRoute()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Return the current auth context',
    description:
      'Returns tenant user, platform super-admin, or impersonation context based on the access token.',
  })
  @ApiResponse({ status: 200, description: 'Current auth context' })
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  // ----------------------------------------------------------------
  // POST /api/v1/auth/refresh
  // ----------------------------------------------------------------

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchanges a valid refresh token (from httpOnly cookie) for a new access token. Implements refresh token rotation.',
  })
  @ApiResponse({ status: 200, description: 'New access token' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: RequestWithRefreshPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const { sub: userId, companyId } = req.user;

    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      userId,
      companyId,
    );

    // Ротация: устанавливаем новый refresh token
    res.cookie(
      this.authService.refreshCookieName,
      refreshToken,
      this.authService.refreshCookieOptions,
    );

    return { accessToken };
  }

  // ----------------------------------------------------------------
  // POST /api/v1/auth/logout
  // ----------------------------------------------------------------

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Logout current user',
    description:
      'Clears the refresh token cookie and logs the logout event to the audit trail.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async logout(
    @CurrentUser() user: TenantAuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.id, user.companyId, user.role);

    res.clearCookie(
      this.authService.refreshCookieName,
      this.authService.clearCookieOptions,
    );

    return { message: 'Logged out successfully' };
  }
}
