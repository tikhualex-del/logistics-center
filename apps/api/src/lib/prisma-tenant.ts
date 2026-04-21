// Tenant-schema Prisma client factory.
//
// Each company has its own PostgreSQL schema: tenant_<sanitized_company_id>
// where the company UUID has dashes replaced with underscores.
// Example: company 550e8400-e29b-41d4-a716-446655440000
//       → schema  tenant_550e8400_e29b_41d4_a716_446655440000
//
// @prisma/adapter-pg accepts a { schema } option which causes it to report
// that schema name via getConnectionInfo(). Prisma ORM then uses the schema
// to generate fully qualified table references (e.g. "tenant_xxx"."User")
// instead of unqualified ones that would fall back to the public schema.
//
// Clients are cached in memory — one PrismaClient per companyId.
// For MVP scale (tens of companies) this is safe. At hundreds of companies,
// replace the Map with an LRU cache.

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma-tenant/client';
import { config } from './config';

export function getTenantSchemaName(companyId: string): string {
  // UUIDs contain dashes which are not valid in unquoted PostgreSQL identifiers.
  return `tenant_${companyId.replace(/-/g, '_')}`;
}

const cache = new Map<string, PrismaClient>();

export function getTenantPrisma(companyId: string): PrismaClient {
  const cached = cache.get(companyId);
  if (cached) return cached;

  const schemaName = getTenantSchemaName(companyId);
  const pool = new Pool({ connectionString: config.databaseUrl });
  const adapter = new PrismaPg(pool, { schema: schemaName });
  const client = new PrismaClient({ adapter });

  cache.set(companyId, client);
  return client;
}
