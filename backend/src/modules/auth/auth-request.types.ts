import { UserRole } from '@prisma/client';
import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  companyId: string;
}

export type RequestWithUser<TUser> = Request & {
  user: TUser;
};
