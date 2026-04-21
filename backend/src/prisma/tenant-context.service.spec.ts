import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  it('stores companyId inside tenant scope', async () => {
    const service = new TenantContextService();

    const companyId = await service.runWithTenant('company-1', () =>
      service.getCompanyId(),
    );

    expect(companyId).toBe('company-1');
  });

  it('can temporarily bypass tenant isolation', async () => {
    const service = new TenantContextService();

    const bypassState = await service.runWithoutTenant(() =>
      service.isBypassingTenant(),
    );

    expect(bypassState).toBe(true);
  });

  it('stores requestId inside the async context', async () => {
    const service = new TenantContextService();

    const requestId = await service.runAsync(() => {
      service.setRequestId('req-123');
      return service.getRequestId();
    });

    expect(requestId).toBe('req-123');
  });

  it('does not leak nested tenant scope to the outer tenant scope', async () => {
    const service = new TenantContextService();

    const result = await service.runWithTenant('company-outer', async () => {
      const before = service.getCompanyId();
      const inner = await service.runWithTenant('company-inner', () =>
        service.getCompanyId(),
      );
      const after = service.getCompanyId();

      return { after, before, inner };
    });

    expect(result).toEqual({
      after: 'company-outer',
      before: 'company-outer',
      inner: 'company-inner',
    });
  });

  it('does not leak bypass state outside runWithoutTenant', async () => {
    const service = new TenantContextService();

    const result = await service.runWithTenant('company-1', async () => {
      const before = service.isBypassingTenant();
      const inside = await service.runWithoutTenant(() => ({
        bypass: service.isBypassingTenant(),
        companyId: service.getCompanyId(),
      }));
      const after = service.isBypassingTenant();
      const afterCompanyId = service.getCompanyId();

      return { after, afterCompanyId, before, inside };
    });

    expect(result).toEqual({
      after: false,
      afterCompanyId: 'company-1',
      before: false,
      inside: {
        bypass: true,
        companyId: undefined,
      },
    });
  });
});
