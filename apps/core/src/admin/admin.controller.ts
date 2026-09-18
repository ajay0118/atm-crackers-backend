import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AdminRole } from '@libs/contracts/admin/admin.schema';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRequestUser } from './admin-auth.types';
import { AdminRoles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminRolesGuard } from './guards/roles.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.adminService.login(dto);
    this.setRefreshCookie(response, result.refreshToken);
    return result;
  }

  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = dto.refreshToken || (request as Request & { cookies?: Record<string, string> }).cookies?.admin_refresh_token;
    const result = await this.adminService.refresh(refreshToken);
    this.setRefreshCookie(response, result.refreshToken);
    return result;
  }

  @Post('logout')
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.adminService.logout(dto.refreshToken || (request as Request & { cookies?: Record<string, string> }).cookies?.admin_refresh_token);
    response.clearCookie('admin_refresh_token', this.cookieOptions());
    return { message: 'Admin logged out successfully' };
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie('admin_refresh_token', refreshToken, {
      ...this.cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private cookieOptions() {
    return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/admin/auth' };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@Req() request: Request & { user: AdminRequestUser }) { return { data: request.user }; }

  @Get('access-check')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.ADMIN)
  adminAccessCheck() { return { message: 'Admin access granted' }; }

  @Patch('password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.ADMIN)
  changePassword(
    @Req() request: Request & { user: AdminRequestUser },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.adminService.changePassword(request.user.adminId, dto);
  }
}
