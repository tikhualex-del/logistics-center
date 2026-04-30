import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../../modules/auth/auth-request.types';

type CurrentUserKey =
  | 'authType'
  | 'companyId'
  | 'email'
  | 'id'
  | 'impersonationSessionId'
  | 'platformAdminEmail'
  | 'platformAdminId'
  | 'role'
  | 'status';

export const CurrentUser = createParamDecorator(
  (data: CurrentUserKey | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const user = request.user;

    if (!data) {
      return user;
    }

    return (user as Record<string, unknown> | undefined)?.[data];
  },
);
