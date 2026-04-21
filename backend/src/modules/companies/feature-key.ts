import { BadRequestException } from '@nestjs/common';

export const FEATURE_KEY_VALIDATION_PATTERN =
  /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export function normalizeFeatureKey(featureKey: string): string {
  const normalized = featureKey.trim().toLowerCase();

  if (!FEATURE_KEY_VALIDATION_PATTERN.test(normalized)) {
    throw new BadRequestException(
      'Feature key must use lowercase letters, numbers, dots, underscores, or dashes.',
    );
  }

  return normalized;
}
