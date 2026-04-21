import { PrismaHealthIndicator } from './prisma.health-indicator';
import { PrismaService } from '../../../prisma/prisma.service';

describe('PrismaHealthIndicator', () => {
  it('runs the readiness query without tenant isolation', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const runWithoutTenant = jest
      .fn()
      .mockImplementation(async (callback: () => Promise<unknown>) => {
        return await callback();
      });

    const indicator = new PrismaHealthIndicator({
      $queryRaw: queryRaw,
      runWithoutTenant,
    } as unknown as PrismaService);

    await expect(indicator.ping()).resolves.toBeUndefined();
    expect(runWithoutTenant).toHaveBeenCalledTimes(1);
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
});
