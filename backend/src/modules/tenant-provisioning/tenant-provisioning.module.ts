import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantProvisioningService } from './tenant-provisioning.service';

@Module({
  imports: [PrismaModule],
  providers: [TenantProvisioningService],
  exports: [TenantProvisioningService],
})
export class TenantProvisioningModule {}
