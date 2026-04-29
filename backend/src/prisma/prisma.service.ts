import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';
import { applyTenantIsolation } from './tenant-prisma.helper';

const PRISMA_SERVICE_PROPS = new Set<PropertyKey>([
  'clearTenantContext',
  'constructor',
  'getCurrentCompanyId',
  'onModuleDestroy',
  'onModuleInit',
  'runWithTenant',
  'runWithoutTenant',
  'setTenantContext',
  'tenantContext',
]);

type BoundPrismaMethod = (...args: unknown[]) => unknown;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly tenantContext: TenantContextService) {
    const connectionString = process.env['DATABASE_URL'];

    if (!connectionString) {
      throw new Error('DATABASE_URL is required to initialize PrismaService.');
    }

    const adapter = new PrismaPg({ connectionString });

    super({ adapter });

    const extendedClient = this.$extends({
      query: {
        $allModels: {
          $allOperations: async ({ args, model, operation, query }) => {
            const scopedArgs = applyTenantIsolation({
              action: operation,
              args: args as Record<string, unknown> | undefined,
              bypassTenant: this.tenantContext.isBypassingTenant(),
              companyId: this.tenantContext.getCompanyId(),
              model: model ?? undefined,
            });

            return query(scopedArgs as never);
          },
        },
      },
    });

    const extendedTarget = extendedClient as Record<PropertyKey, unknown>;

    return new Proxy(this, {
      get: (target, property, receiver) => {
        if (PRISMA_SERVICE_PROPS.has(property)) {
          return Reflect.get(target, property, receiver);
        }

        const extendedValue = extendedTarget[property];

        if (extendedValue !== undefined) {
          if (typeof extendedValue === 'function') {
            return (extendedValue as BoundPrismaMethod).bind(extendedClient);
          }

          return extendedValue;
        }

        return Reflect.get(target, property, receiver);
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async runWithTenant<T>(
    companyId: string,
    callback: () => Promise<T> | T,
  ): Promise<Awaited<T>> {
    return await this.tenantContext.runWithTenant(companyId, callback);
  }

  async runWithoutTenant<T>(
    callback: () => Promise<T> | T,
  ): Promise<Awaited<T>> {
    return await this.tenantContext.runWithoutTenant(callback);
  }

  setTenantContext(companyId: string): void {
    this.tenantContext.setCompanyId(companyId);
  }

  clearTenantContext(): void {
    this.tenantContext.clearCompanyId();
  }

  getCurrentCompanyId(): string | undefined {
    return this.tenantContext.getCompanyId();
  }
}
