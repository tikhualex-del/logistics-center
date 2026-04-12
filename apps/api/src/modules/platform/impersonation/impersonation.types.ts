export interface StartImpersonationInput {
  reason?: string;
}

export interface ImpersonationSessionResponse {
  id: string;
  superAdminId: string;
  targetCompanyId: string;
  startedAt: Date;
  endedAt: Date | null;
  reason: string | null;
}

export interface StartImpersonationResponse {
  token: string;
  sessionId: string;
  companyId: string;
  expiresAt: Date;
}
