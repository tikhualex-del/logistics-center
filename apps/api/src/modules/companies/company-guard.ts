import { systemPrisma } from '../../lib/prisma-system';
import { AppError } from '../../middlewares/error.middleware';

/**
 * Throws 403 if the company is not in "active" status.
 * Call this before any tenant-scoped operational write.
 */
export async function assertCompanyOperational(companyId: string): Promise<void> {
  const company = await systemPrisma.company.findUnique({
    where: { id: companyId },
    select: { status: true },
  });

  if (!company) {
    throw new AppError(404, 'Company not found');
  }

  if (company.status !== 'active') {
    throw new AppError(403, 'Company is not operational');
  }
}
