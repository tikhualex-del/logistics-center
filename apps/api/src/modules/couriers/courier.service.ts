import { getTenantPrisma } from '../../lib/prisma-tenant';
import { AppError } from '../../middlewares/error.middleware';
import type { CourierResponse, CreateCourierInput, UpdateCourierInput } from './courier.types';

function toCourierResponse(row: {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): CourierResponse {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.name,
    phone: row.phone,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listCouriers(
  companyId: string,
  filters: { status?: string } = {},
): Promise<CourierResponse[]> {
  const tenantPrisma = getTenantPrisma(companyId);
  const rows = await tenantPrisma.courier.findMany({
    where: {
      companyId,
      ...(filters.status && { status: filters.status }),
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toCourierResponse);
}

export async function getCourier(companyId: string, courierId: string): Promise<CourierResponse> {
  const tenantPrisma = getTenantPrisma(companyId);
  const row = await tenantPrisma.courier.findUnique({ where: { id: courierId } });
  if (!row) throw new AppError(404, 'Courier not found');
  return toCourierResponse(row);
}

export async function createCourier(
  companyId: string,
  input: CreateCourierInput,
): Promise<CourierResponse> {
  const tenantPrisma = getTenantPrisma(companyId);
  const row = await tenantPrisma.courier.create({
    data: { companyId, name: input.name, phone: input.phone, status: 'active' },
  });
  return toCourierResponse(row);
}

export async function updateCourier(
  companyId: string,
  courierId: string,
  input: UpdateCourierInput,
): Promise<CourierResponse> {
  const tenantPrisma = getTenantPrisma(companyId);
  const existing = await tenantPrisma.courier.findUnique({ where: { id: courierId } });
  if (!existing) throw new AppError(404, 'Courier not found');

  const row = await tenantPrisma.courier.update({
    where: { id: courierId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.status !== undefined && { status: input.status }),
    },
  });
  return toCourierResponse(row);
}
