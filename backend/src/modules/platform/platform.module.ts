import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TenantProvisioningModule } from '../tenant-provisioning/tenant-provisioning.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuthModule, PrismaModule, TenantProvisioningModule],
  controllers: [PlatformController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
