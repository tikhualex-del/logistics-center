import { ConfigService } from '@nestjs/config';

const DEV_JWT_SECRET = 'lc-dev-access-secret-change-me';
const DEV_JWT_REFRESH_SECRET = 'lc-dev-refresh-secret-change-me';

type AuthSecretKey = 'JWT_SECRET' | 'JWT_REFRESH_SECRET';

export function getAuthSecret(
  config: ConfigService,
  key: AuthSecretKey,
): string {
  const configuredSecret = config.get<string>(key)?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
  if (nodeEnv === 'production') {
    throw new Error(`${key} must be configured in production`);
  }

  return key === 'JWT_SECRET' ? DEV_JWT_SECRET : DEV_JWT_REFRESH_SECRET;
}
