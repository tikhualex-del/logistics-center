export {};

declare global {
  namespace Express {
    interface Request {
      // Set by tenantMiddleware from x-company-id header.
      // Secondary mechanism — used for super admin flows and dev support.
      // Not the primary source of tenant context for authenticated requests.
      tenantContext?: {
        companyId: string;
        source: string;
      };

      // Set by auth.middleware after JWT verification + session + user status checks.
      // Primary source of identity and tenant context for all authenticated requests.
      authContext?: AuthContext;

      // Set by requireIntegrationKey middleware on the inbound endpoint.
      // Identifies the integration and provides routing context without a tenant JWT.
      integrationContext?: IntegrationContext;
    }
  }
}

export type IntegrationContext = {
  integrationId: string;
  companyId: string;
  externalSource: string;
};

export type AuthContext =
  | {
      type: 'user';
      userId: string;
      companyId: string; // primary source of tenant routing
      role: string;      // 'owner' | 'dispatcher' | 'viewer'
      sessionId: string; // UserSession.id
    }
  | {
      type: 'super_admin';
      adminId: string;
    }
  | {
      type: 'impersonation';
      adminId: string;        // PlatformSuperAdmin.id
      companyId: string;      // target company being impersonated
      sessionId: string;      // PlatformImpersonationSession.id
    };
