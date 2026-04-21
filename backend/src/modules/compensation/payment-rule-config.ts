import { BadRequestException } from '@nestjs/common';
import { Prisma, PaymentRuleType } from '@prisma/client';

export interface PaymentRuleConfigPayload {
  value: number;
  conditions: Record<string, unknown> | null;
}

export function buildPaymentRuleConfig(
  ruleType: PaymentRuleType,
  value: number,
  conditions: Record<string, unknown> | null | undefined,
): Prisma.InputJsonObject {
  const normalizedConditions = normalizeConditions(conditions);

  validatePaymentRuleConfig(ruleType, value, normalizedConditions);

  return {
    value,
    conditions: toInputJsonValue(normalizedConditions),
  } satisfies Prisma.InputJsonObject;
}

export function parsePaymentRuleConfig(
  config: Prisma.JsonValue,
): PaymentRuleConfigPayload {
  if (!isPlainObject(config)) {
    throw new BadRequestException('Payment rule config must be a JSON object');
  }

  const value = readNumber(config['value']);
  if (value === null) {
    throw new BadRequestException('Payment rule config value must be a number');
  }

  const conditionsValue = config['conditions'];
  const conditions = isPlainObject(conditionsValue)
    ? (conditionsValue as Record<string, unknown>)
    : null;

  return {
    value,
    conditions,
  };
}

export function validateEffectiveWindow(
  effectiveFrom?: Date | null,
  effectiveTo?: Date | null,
): void {
  if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
    throw new BadRequestException(
      'effectiveFrom must be earlier than or equal to effectiveTo',
    );
  }
}

export function isRuleEffectiveNow(
  effectiveFrom: Date | null,
  effectiveTo: Date | null,
  now: Date,
): boolean {
  if (effectiveFrom && effectiveFrom > now) {
    return false;
  }

  if (effectiveTo && effectiveTo < now) {
    return false;
  }

  return true;
}

function validatePaymentRuleConfig(
  ruleType: PaymentRuleType,
  value: number,
  conditions: Record<string, unknown> | null,
): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new BadRequestException('Payment rule value must be a non-negative number');
  }

  switch (ruleType) {
    case PaymentRuleType.zone_rate: {
      const zoneId = readString(conditions?.['zoneId']);
      if (!zoneId) {
        throw new BadRequestException(
          'zone_rate rules require conditions.zoneId',
        );
      }
      break;
    }
    case PaymentRuleType.per_km:
    case PaymentRuleType.per_order:
      break;
    case PaymentRuleType.bonus:
    case PaymentRuleType.penalty: {
      const metric = readString(conditions?.['metric']);
      const threshold = readNumber(conditions?.['threshold']);
      if (!metric || threshold === null) {
        throw new BadRequestException(
          `${ruleType} rules require conditions.metric and conditions.threshold`,
        );
      }
      break;
    }
    case PaymentRuleType.minimum_guarantee: {
      const period = readString(conditions?.['period']);
      if (!period || !['daily', 'weekly', 'monthly'].includes(period)) {
        throw new BadRequestException(
          'minimum_guarantee rules require conditions.period to be daily, weekly, or monthly',
        );
      }
      break;
    }
    default:
      throw new BadRequestException(`Unsupported payment rule type "${ruleType}"`);
  }
}

function normalizeConditions(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (value === undefined || value === null) {
    return null;
  }

  return isPlainObject(value) ? value : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value as Prisma.InputJsonValue;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toInputJsonValue(entry)) as Prisma.InputJsonArray;
  }

  if (typeof value === 'object') {
    const inputObject: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) {
        continue;
      }

      inputObject[key] = toInputJsonValue(entry);
    }

    return inputObject as Prisma.InputJsonObject;
  }

  return String(value);
}
