import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeFeatureKey } from './feature-key';

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FeatureFlagsService.name);
  }

  async isEnabled(featureKey: string, companyId: string): Promise<boolean> {
    const normalizedFeatureKey = normalizeFeatureKey(featureKey);

    return await this.prisma.runWithTenant(companyId, async () => {
      const flag = await this.prisma.companyFeature.findFirst({
        where: {
          feature_key: normalizedFeatureKey,
          enabled: true,
        },
        select: { id: true },
      });

      const enabled = Boolean(flag);
      this.logger.debug(
        { companyId, featureKey: normalizedFeatureKey, enabled },
        'Feature flag evaluated',
      );

      return enabled;
    });
  }
}
