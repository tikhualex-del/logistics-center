import {
  MissingTenantContextError,
  TenantWriteViolationError,
  applyTenantIsolation,
} from './tenant-prisma.helper';

describe('tenant-prisma.helper', () => {
  it('adds company_id to tenant-scoped read filters', () => {
    const args = applyTenantIsolation({
      action: 'findMany',
      args: { where: { status: 'active' } },
      companyId: 'company-1',
      model: 'User',
    });

    expect(args).toEqual({
      where: {
        company_id: 'company-1',
        status: 'active',
      },
    });
  });

  it('overrides caller-provided company_id in read filters', () => {
    const args = applyTenantIsolation({
      action: 'findUnique',
      args: {
        where: {
          company_id: 'company-2',
          id: 'order-1',
        },
      },
      companyId: 'company-1',
      model: 'Order',
    });

    expect(args).toEqual({
      where: {
        company_id: 'company-1',
        id: 'order-1',
      },
    });
  });

  it('adds company_id to destructive tenant-scoped filters', () => {
    const args = applyTenantIsolation({
      action: 'deleteMany',
      args: {
        where: {
          status: 'draft',
        },
      },
      companyId: 'company-1',
      model: 'PaymentRuleVersion',
    });

    expect(args).toEqual({
      where: {
        company_id: 'company-1',
        status: 'draft',
      },
    });
  });

  it('injects company_id into create payloads', () => {
    const args = applyTenantIsolation({
      action: 'create',
      args: { data: { first_name: 'Jane' } },
      companyId: 'company-1',
      model: 'User',
    });

    expect(args).toEqual({
      data: {
        company_id: 'company-1',
        first_name: 'Jane',
      },
    });
  });

  it('rejects create payloads with mismatched company_id', () => {
    expect(() =>
      applyTenantIsolation({
        action: 'create',
        args: {
          data: {
            company_id: 'company-2',
            first_name: 'Jane',
          },
        },
        companyId: 'company-1',
        model: 'User',
      }),
    ).toThrow(TenantWriteViolationError);
  });

  it('injects company_id into createMany payloads', () => {
    const args = applyTenantIsolation({
      action: 'createMany',
      args: {
        data: [{ amount: 100 }, { amount: 200, company_id: 'company-1' }],
      },
      companyId: 'company-1',
      model: 'Payment',
    });

    expect(args).toEqual({
      data: [
        {
          amount: 100,
          company_id: 'company-1',
        },
        {
          amount: 200,
          company_id: 'company-1',
        },
      ],
    });
  });

  it('rejects createMany payloads with mismatched company_id', () => {
    expect(() =>
      applyTenantIsolation({
        action: 'createMany',
        args: {
          data: [{ amount: 100 }, { amount: 200, company_id: 'company-2' }],
        },
        companyId: 'company-1',
        model: 'Payment',
      }),
    ).toThrow(TenantWriteViolationError);
  });

  it('rejects update payloads that try to move records across tenants', () => {
    expect(() =>
      applyTenantIsolation({
        action: 'update',
        args: {
          data: {
            company_id: 'company-2',
          },
          where: {
            id: 'user-1',
          },
        },
        companyId: 'company-1',
        model: 'User',
      }),
    ).toThrow(TenantWriteViolationError);
  });

  it('isolates upsert filters and create/update payloads', () => {
    const args = applyTenantIsolation({
      action: 'upsert',
      args: {
        create: {
          courier_id: 'courier-1',
          external_id: 'external-1',
        },
        update: {
          status: 'processing',
        },
        where: {
          company_id: 'company-2',
          id: 'order-1',
        },
      },
      companyId: 'company-1',
      model: 'Order',
    });

    expect(args).toEqual({
      create: {
        company_id: 'company-1',
        courier_id: 'courier-1',
        external_id: 'external-1',
      },
      update: {
        status: 'processing',
      },
      where: {
        company_id: 'company-1',
        id: 'order-1',
      },
    });
  });

  it('rejects upsert create payloads with mismatched company_id', () => {
    expect(() =>
      applyTenantIsolation({
        action: 'upsert',
        args: {
          create: {
            company_id: 'company-2',
          },
          update: {},
          where: {
            id: 'order-1',
          },
        },
        companyId: 'company-1',
        model: 'Order',
      }),
    ).toThrow(TenantWriteViolationError);
  });

  it('rejects upsert update payloads with mismatched company_id', () => {
    expect(() =>
      applyTenantIsolation({
        action: 'upsert',
        args: {
          create: {},
          update: {
            company_id: 'company-2',
          },
          where: {
            id: 'order-1',
          },
        },
        companyId: 'company-1',
        model: 'Order',
      }),
    ).toThrow(TenantWriteViolationError);
  });

  it('requires a companyId for tenant-scoped models', () => {
    expect(() =>
      applyTenantIsolation({
        action: 'findMany',
        args: {},
        model: 'User',
      }),
    ).toThrow(MissingTenantContextError);
  });

  it('bypasses tenant isolation for system-scoped operations', () => {
    const args = applyTenantIsolation({
      action: 'findMany',
      args: { where: { name: 'Acme' } },
      bypassTenant: true,
      model: 'User',
    });

    expect(args).toEqual({
      where: {
        name: 'Acme',
      },
    });
  });

  it('does not touch non-tenant models', () => {
    const args = applyTenantIsolation({
      action: 'findMany',
      args: { where: { id: 'company-1' } },
      model: 'Company',
    });

    expect(args).toEqual({
      where: {
        id: 'company-1',
      },
    });
  });
});
