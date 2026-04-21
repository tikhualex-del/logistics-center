import { Company, CompanyStatus, CreateCompanyInput, UpdateCompanyInput, ChangeCompanyStatusInput } from './company.types';
import { DEFAULT_COMPANY_STATUS } from './company.constants';
import { AppError } from '../../middlewares/error.middleware';
import { systemPrisma } from '../../lib/prisma-system';
import { provision } from '../tenant-provisioning';

function isPrismaCode(err: unknown, code: string): boolean {
  return err instanceof Error && 'code' in err && (err as Error & { code: string }).code === code;
}

function toCompany(row: {
  id: string;
  name: string;
  slug: string;
  status: string;
  timezone: string;
  defaultCurrency: string;
  language: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  planId: string;
  createdAt: Date;
  updatedAt: Date;
}): Company {
  return {
    ...row,
    status: row.status as CompanyStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAll(): Promise<Company[]> {
  const rows = await systemPrisma.company.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(toCompany);
}

export async function getById(id: string): Promise<Company> {
  const row = await systemPrisma.company.findUnique({ where: { id } });
  if (!row) throw new AppError(404, 'Company not found');
  return toCompany(row);
}

export async function create(input: CreateCompanyInput): Promise<Company> {
  let row: Awaited<ReturnType<typeof systemPrisma.company.create>>;

  try {
    row = await systemPrisma.company.create({
      data: { ...input, status: DEFAULT_COMPANY_STATUS },
    });
  } catch (err) {
    if (isPrismaCode(err, 'P2002')) throw new AppError(409, 'Company slug already exists');
    throw err;
  }

  // If provisioning fails, the Company record remains in system schema.
  // This is accepted behavior in Wave 0-1 — no retry or auto-rollback.
  // Operator must investigate logs and manually clean up if needed.
  await provision(row.id);

  return toCompany(row);
}

export async function update(id: string, input: UpdateCompanyInput): Promise<Company> {
  try {
    const row = await systemPrisma.company.update({ where: { id }, data: input });
    return toCompany(row);
  } catch (err) {
    if (isPrismaCode(err, 'P2025')) throw new AppError(404, 'Company not found');
    throw err;
  }
}

export async function changeStatus(id: string, input: ChangeCompanyStatusInput): Promise<Company> {
  try {
    const row = await systemPrisma.company.update({ where: { id }, data: { status: input.status } });
    return toCompany(row);
  } catch (err) {
    if (isPrismaCode(err, 'P2025')) throw new AppError(404, 'Company not found');
    throw err;
  }
}

export async function archive(id: string): Promise<Company> {
  return changeStatus(id, { status: 'archived' });
}
