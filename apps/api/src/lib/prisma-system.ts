// System-schema Prisma client.
// Connects to the 'system' PostgreSQL schema via Prisma multiSchema.
// Prisma generates schema-qualified queries (e.g. SELECT * FROM "system"."Company")
// so no search_path override is needed on the connection.
//
// Use this client for: Company, PlatformSuperAdmin,
// PlatformImpersonationSession, PlatformAuditEvent.

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma-system/client';
import { config } from './config';

const pool = new Pool({ connectionString: config.databaseUrl });
const adapter = new PrismaPg(pool);

export const systemPrisma = new PrismaClient({ adapter });
