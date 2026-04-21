// Shared raw pg.Pool for operations that require direct SQL execution —
// specifically TenantProvisioningService, which needs DDL-level access
// (CREATE SCHEMA, SET LOCAL search_path) that cannot go through Prisma.
//
// Not used for application queries — those go through prisma-system.ts
// or prisma-tenant.ts.

import { Pool } from 'pg';
import { config } from './config';

export const pgPool = new Pool({ connectionString: config.databaseUrl });
