import { Prisma } from '@prisma/client';

const TENANT_SCOPED_MODELS = new Set<Prisma.ModelName>([
  'User',
  'Courier',
  'Dispatcher',
  'Zone',
  'Order',
  'OrderStatusHistory',
  'Route',
  'RoutePoint',
  'PaymentRuleVersion',
  'Payment',
  'PaymentRecalculation',
  'AuditLog',
  'Integration',
  'IntegrationEvent',
  'CompanyFeature',
]);

const READ_ACTIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
]);

const CREATE_ACTIONS = new Set(['create', 'createMany', 'createManyAndReturn']);
const UPDATE_ACTIONS = new Set(['update', 'updateMany', 'upsert']);

type PlainObject = Record<string, unknown>;

export class MissingTenantContextError extends Error {
  constructor(model: string, action: string) {
    super(
      `Tenant context is required for Prisma ${model}.${action} but no companyId is set.`,
    );
    this.name = 'MissingTenantContextError';
  }
}

export class TenantWriteViolationError extends Error {
  constructor(model: string, action: string) {
    super(
      `Prisma ${model}.${action} attempted to use a company_id different from the active tenant context.`,
    );
    this.name = 'TenantWriteViolationError';
  }
}

export interface TenantIsolationInput {
  action: string;
  args?: PlainObject;
  bypassTenant?: boolean;
  companyId?: string;
  model?: string;
}

export function isTenantScopedModel(model?: string): model is Prisma.ModelName {
  return (
    model !== undefined && TENANT_SCOPED_MODELS.has(model as Prisma.ModelName)
  );
}

export function applyTenantIsolation({
  action,
  args,
  bypassTenant = false,
  companyId,
  model,
}: TenantIsolationInput): PlainObject | undefined {
  if (!isTenantScopedModel(model) || bypassTenant) {
    return args;
  }

  if (!companyId) {
    throw new MissingTenantContextError(model, action);
  }

  const nextArgs = { ...(args ?? {}) };

  if (READ_ACTIONS.has(action)) {
    nextArgs.where = mergeTenantWhere(nextArgs.where, companyId);
  }

  if (CREATE_ACTIONS.has(action)) {
    nextArgs.data = injectTenantIntoCreateData(
      nextArgs.data,
      companyId,
      model,
      action,
    );
  }

  if (action === 'upsert') {
    nextArgs.create = injectTenantIntoCreateData(
      nextArgs.create,
      companyId,
      model,
      action,
    );
    nextArgs.update = validateTenantUpdateData(
      nextArgs.update,
      companyId,
      model,
      action,
    );
  } else if (UPDATE_ACTIONS.has(action)) {
    nextArgs.data = validateTenantUpdateData(
      nextArgs.data,
      companyId,
      model,
      action,
    );
  }

  return nextArgs;
}

function mergeTenantWhere(where: unknown, companyId: string): PlainObject {
  if (!isPlainObject(where)) {
    return { company_id: companyId };
  }

  return {
    ...where,
    company_id: companyId,
  };
}

function injectTenantIntoCreateData(
  data: unknown,
  companyId: string,
  model: string,
  action: string,
): unknown {
  if (Array.isArray(data)) {
    return data.map((entry) =>
      injectTenantIntoCreateData(entry, companyId, model, action),
    );
  }

  if (!isPlainObject(data)) {
    return data;
  }

  if (
    Object.hasOwn(data, 'company_id') &&
    data.company_id !== undefined &&
    data.company_id !== companyId
  ) {
    throw new TenantWriteViolationError(model, action);
  }

  return {
    ...data,
    company_id: companyId,
  };
}

function validateTenantUpdateData(
  data: unknown,
  companyId: string,
  model: string,
  action: string,
): unknown {
  if (!isPlainObject(data)) {
    return data;
  }

  if (
    Object.hasOwn(data, 'company_id') &&
    data.company_id !== undefined &&
    data.company_id !== companyId
  ) {
    throw new TenantWriteViolationError(model, action);
  }

  return data;
}

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
