export interface LoginInput {
  companySlug: string;
  email: string;
  password: string;
}

export interface PlatformLoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface PlatformLoginResult {
  token: string;
  admin: {
    id: string;
    email: string;
  };
}

// JWT payload shapes — used for signing and verification.

export interface UserJwtPayload {
  sub: string;       // User.id
  jti: string;       // UserSession.jwtId
  companyId: string;
  role: string;
  type: 'user';
  iat?: number;
  exp?: number;
}

export interface SuperAdminJwtPayload {
  sub: string;       // PlatformSuperAdmin.id
  jti: string;       // random UUID — not stored in DB in Wave 0-1
  type: 'super_admin';
  iat?: number;
  exp?: number;
}

export interface ImpersonationJwtPayload {
  sub: string;       // PlatformSuperAdmin.id
  sessionId: string; // PlatformImpersonationSession.id
  companyId: string; // target company being impersonated
  type: 'impersonation';
  iat?: number;
  exp?: number;
}

export type JwtPayload = UserJwtPayload | SuperAdminJwtPayload | ImpersonationJwtPayload;
