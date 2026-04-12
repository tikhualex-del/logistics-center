// Centralized environment configuration with fail-fast validation.
// Import this module early in the application startup (main.ts already does so
// via 'dotenv/config'). Any missing required variable will throw at startup,
// not silently at runtime.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
};
