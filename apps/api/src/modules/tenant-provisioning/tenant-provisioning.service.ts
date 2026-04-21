import fs from 'fs';
import path from 'path';
import { pgPool } from '../../lib/pg-pool';
import { getTenantSchemaName } from '../../lib/prisma-tenant';
import { AppError } from '../../middlewares/error.middleware';

const tenantSchemaSql = fs.readFileSync(
  path.join(process.cwd(), 'prisma', 'tenant-schema.sql'),
  'utf8',
);

// Provisions a new tenant schema for the given companyId.
//
// This function is intentionally one-shot and non-idempotent.
// Calling it twice for the same companyId is an error, not a valid retry.
//
// The entire operation runs inside a single PostgreSQL transaction.
// DDL in PostgreSQL is transactional — if any step fails, the full
// ROLLBACK undoes CREATE SCHEMA and all CREATE TABLE statements.
//
// If provisioning fails after system.Company was already created,
// the Company record remains. This is accepted behavior in Wave 0-1.
// No auto-rollback of the Company record is performed.
// Operator must investigate logs and clean up manually if needed.
export async function provision(companyId: string): Promise<void> {
  const schemaName = getTenantSchemaName(companyId);
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    // Step 1: Create the tenant schema.
    // No IF NOT EXISTS — double provisioning is an explicit error.
    await client.query(`CREATE SCHEMA "${schemaName}"`).catch((err: NodeJS.ErrnoException & { code?: string }) => {
      if (err.code === '42P06') {
        throw new AppError(409, `Tenant schema already exists for company: ${companyId}`);
      }
      throw err;
    });

    // Step 2: Set search_path for the rest of this transaction.
    // SET LOCAL is scoped to the current transaction only.
    await client.query(`SET LOCAL search_path TO "${schemaName}"`);

    // Step 3: Apply full tenant DDL as a single batch.
    await client.query(tenantSchemaSql);

    // Step 4: Seed the three system-defined roles.
    await client.query(`
      INSERT INTO "Role" (id, name, label, "isSystem")
      VALUES
        (gen_random_uuid(), 'owner',      'Owner',      true),
        (gen_random_uuid(), 'dispatcher', 'Dispatcher', true),
        (gen_random_uuid(), 'viewer',     'Viewer',     true)
    `);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
