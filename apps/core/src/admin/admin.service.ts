import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { createHash, randomUUID } from 'crypto';
import { Admin, AdminDocument, AdminStatus } from '@libs/contracts/admin/admin.schema';
import { AdminRefreshToken, AdminRefreshTokenDocument } from '@libs/contracts/admin/admin-refresh-token.schema';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(AdminRefreshToken.name) private readonly refreshTokenModel: Model<AdminRefreshTokenDocument>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.adminModel
      .findOne({ email: dto.email.toLowerCase(), status: AdminStatus.ACTIVE })
      .select('+passwordHash')
      .exec();
    if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    admin.lastLoginAt = new Date();
    await admin.save();
    const tokens = await this.issueTokens(admin);
    return { ...tokens, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } };
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(admin: AdminDocument) {
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('ADMIN_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
    await this.refreshTokenModel.create({
      adminId: admin._id,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: '15m' };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token is required');
    let payload: { sub: string; email: string; role: Admin['role'] };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('ADMIN_REFRESH_SECRET'),
      });
    } catch (error) {
      console.error(
        '[AdminAuth] Refresh JWT verification failed:',
        error instanceof Error ? error.name : 'UnknownError',
      );
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const tokenHash = this.hashRefreshToken(refreshToken);
    const tokenRecord = await this.refreshTokenModel
      .findOne({ tokenHash })
      .select('+tokenHash')
      .exec();
    if (!tokenRecord || tokenRecord.expiresAt <= new Date()) {
      console.error('[AdminAuth] Refresh token record not found or expired', {
        adminId: payload.sub,
        recordFound: Boolean(tokenRecord),
      });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (tokenRecord.adminId.toString() !== payload.sub) {
      console.error('[AdminAuth] Refresh token owner mismatch', { adminId: payload.sub });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const admin = await this.adminModel.findOne({ _id: payload.sub, status: AdminStatus.ACTIVE }).exec();
    if (!admin) throw new UnauthorizedException('Admin account is inactive');
    await tokenRecord.deleteOne();
    return this.issueTokens(admin);
  }

  async logout(refreshToken?: string) {
    if (refreshToken) await this.refreshTokenModel.deleteOne({ tokenHash: this.hashRefreshToken(refreshToken) }).exec();
    return { message: 'Admin logged out successfully' };
  }

  async changePassword(adminId: string, dto: ChangePasswordDto) {
    const admin = await this.adminModel
      .findOne({ _id: adminId, status: AdminStatus.ACTIVE })
      .select('+passwordHash')
      .exec();
    if (!admin || !(await bcrypt.compare(dto.currentPassword, admin.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }
    admin.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await admin.save();
    return { message: 'Admin password changed successfully' };
  }

  async updateProfile(adminId: string, dto: UpdateProfileDto) {
    if (!dto.name && !dto.email) {
      throw new BadRequestException('At least one profile field is required');
    }

    const admin = await this.adminModel
      .findOne({ _id: adminId, status: AdminStatus.ACTIVE })
      .select('+passwordHash')
      .exec();
    if (!admin) throw new UnauthorizedException('Admin account is inactive');

    const emailChanged = Boolean(dto.email && dto.email !== admin.email);
    if (emailChanged) {
      if (!dto.currentPassword || !(await bcrypt.compare(dto.currentPassword, admin.passwordHash))) {
        throw new UnauthorizedException('Current password is required to change email');
      }
      const nextEmail = dto.email as string;
      const existingAdmin = await this.adminModel.findOne({ email: nextEmail, _id: { $ne: adminId } }).exec();
      if (existingAdmin) throw new ConflictException('An admin with this email already exists');
      admin.email = nextEmail;
      await this.refreshTokenModel.deleteMany({ adminId }).exec();
    }

    if (dto.name) admin.name = dto.name;
    await admin.save();

    return {
      message: 'Admin profile updated successfully',
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    };
  }
}
