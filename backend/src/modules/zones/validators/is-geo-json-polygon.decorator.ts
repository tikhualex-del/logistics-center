import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export type GeoJsonPosition = [number, number] | [number, number, number];
export type GeoJsonLinearRing = GeoJsonPosition[];
export type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: GeoJsonLinearRing[];
};

export function isGeoJsonPolygon(value: unknown): value is GeoJsonPolygon {
  if (!isPlainObject(value) || value.type !== 'Polygon') {
    return false;
  }

  if (!Array.isArray(value.coordinates) || value.coordinates.length === 0) {
    return false;
  }

  return value.coordinates.every(isLinearRing);
}

export function IsGeoJsonPolygon(validationOptions?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      name: 'isGeoJsonPolygon',
      target: target.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) => isGeoJsonPolygon(value),
        defaultMessage: (args?: ValidationArguments) =>
          `${args?.property ?? 'polygon'} must be a valid GeoJSON Polygon`,
      },
    });
  };
}

function isLinearRing(value: unknown): value is GeoJsonLinearRing {
  if (!Array.isArray(value) || value.length < 4) {
    return false;
  }

  if (!value.every(isPosition)) {
    return false;
  }

  const firstPoint = value[0];
  const lastPoint = value[value.length - 1];

  if (!firstPoint || !lastPoint || firstPoint.length !== lastPoint.length) {
    return false;
  }

  return firstPoint.every((coordinate, index) => coordinate === lastPoint[index]);
}

function isPosition(value: unknown): value is GeoJsonPosition {
  if (!Array.isArray(value) || (value.length !== 2 && value.length !== 3)) {
    return false;
  }

  return value.every(
    (coordinate) =>
      typeof coordinate === 'number' && Number.isFinite(coordinate),
  );
}

function isPlainObject(
  value: unknown,
): value is { type?: unknown; coordinates?: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
