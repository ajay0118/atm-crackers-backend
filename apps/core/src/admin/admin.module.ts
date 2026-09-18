import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Admin, AdminSchema } from '@libs/contracts/admin/admin.schema';
import { AdminRefreshToken, AdminRefreshTokenSchema } from '@libs/contracts/admin/admin-refresh-token.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminRolesGuard } from './guards/roles.guard';
import * as bcrypt from 'bcrypt';
import { OnModuleInit } from '@nestjs/common';
import { AdminRole, AdminStatus } from '@libs/contracts/admin/admin.schema';

class AdminBootstrap implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(Admin.name) private readonly adminModel: any,
  ) {}

  async onModuleInit() {
    const email = this.config.get<string>('ADMIN_SEED_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_SEED_PASSWORD');
    if (!email || !password) return;
    if (await this.adminModel.exists({ email })) return;
    await this.adminModel.create({
      name: this.config.get<string>('ADMIN_SEED_NAME') || 'Store Admin',
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: AdminRole.ADMIN,
      status: AdminStatus.ACTIVE,
    });
    console.log(`Initial admin created for ${email}`);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRefreshToken.name, schema: AdminRefreshTokenSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.getOrThrow('ADMIN_JWT_SECRET'), signOptions: { expiresIn: '15m' } }) }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtStrategy, AdminRolesGuard, AdminBootstrap],
})
export class AdminModule {}
