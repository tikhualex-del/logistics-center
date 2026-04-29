import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import {
  Coordinates,
  DistanceResult,
  RouteLeg,
  RouteOptions,
  RoutePoint,
  RouteResult,
  RoutingProvider,
} from './routing-provider.interface';

const DEFAULT_ROUTING_BASE_URL = 'https://api.routing.yandex.net/v2/route';
const DEFAULT_GEOCODER_BASE_URL = 'https://geocode-maps.yandex.ru/1.x/';
const DEFAULT_LOCALE = 'ru_RU';
const DEFAULT_TIMEOUT_MS = 10_000;
const METERS_PER_KILOMETER = 1_000;
const SECONDS_PER_HOUR = 3_600;

type RoutingProviderMode = 'auto' | 'mock' | 'yandex';
type YandexJson = Record<string, unknown>;

@Injectable()
export class YandexRoutingProvider implements RoutingProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(YandexRoutingProvider.name);
  }

  async buildRoute(
    points: RoutePoint[],
    options: RouteOptions,
  ): Promise<RouteResult> {
    validateRoutePoints(points);

    if (this.shouldUseMockMode('routing')) {
      return buildMockRoute(points, options);
    }

    const orderedPoints = orderRoutePoints(points, options.optimizeWaypoints);
    const requestPoints = buildRequestPoints(
      orderedPoints,
      options.returnToStart,
    );
    const payload = await this.fetchJson(
      this.buildRoutingUrl(requestPoints, options),
      'route build',
    );

    return parseYandexRouteResponse(
      payload,
      orderedPoints,
      requestPoints,
      options,
    );
  }

  async calculateDistance(
    from: Coordinates,
    to: Coordinates,
  ): Promise<DistanceResult> {
    if (this.shouldUseMockMode('routing')) {
      return buildMockDistance(from, to);
    }

    const result = await this.buildRoute(
      [
        {
          id: 'from',
          orderId: null,
          address: null,
          coordinates: from,
          type: 'waypoint',
          metadata: null,
        },
        {
          id: 'to',
          orderId: null,
          address: null,
          coordinates: to,
          type: 'waypoint',
          metadata: null,
        },
      ],
      {
        mode: 'driving',
        optimizeWaypoints: false,
        avoidTolls: false,
        avoidUnpaved: false,
        departureTime: null,
        returnToStart: false,
        locale: null,
      },
    );

    return {
      distanceMeters: result.distanceMeters,
      durationSeconds: result.durationSeconds,
      provider: result.provider,
      metadata: result.metadata,
    };
  }

  async geocode(address: string): Promise<Coordinates> {
    const normalizedAddress = address.trim();

    if (normalizedAddress.length === 0) {
      throw new Error('Address is required for geocoding');
    }

    if (this.shouldUseMockMode('geocode')) {
      return buildMockGeocode(normalizedAddress);
    }

    const payload = await this.fetchJson(
      this.buildGeocodeUrl(normalizedAddress),
      'geocode',
    );

    return parseYandexGeocodeResponse(payload);
  }

  private shouldUseMockMode(operation: 'routing' | 'geocode'): boolean {
    const mode = this.getProviderMode();

    if (mode === 'mock') {
      return true;
    }

    if (mode === 'yandex') {
      return false;
    }

    return !this.hasApiKeyFor(operation);
  }

  private hasApiKeyFor(operation: 'routing' | 'geocode'): boolean {
    return operation === 'routing'
      ? this.getRoutingApiKey() !== undefined
      : this.getMapsApiKey() !== undefined;
  }

  private getProviderMode(): RoutingProviderMode {
    const rawMode =
      this.configService
        .get<string>('ROUTING_PROVIDER_MODE')
        ?.trim()
        .toLowerCase() ?? 'auto';

    if (rawMode === 'mock' || rawMode === 'yandex') {
      return rawMode;
    }

    return 'auto';
  }

  private getRoutingApiKey(): string | undefined {
    const routingKey = normalizeString(
      this.configService.get<string>('YANDEX_ROUTING_API_KEY'),
    );

    return routingKey ?? this.getMapsApiKey();
  }

  private getMapsApiKey(): string | undefined {
    return normalizeString(
      this.configService.get<string>('YANDEX_MAPS_API_KEY'),
    );
  }

  private getRoutingBaseUrl(): string {
    return (
      normalizeString(
        this.configService.get<string>('YANDEX_ROUTING_BASE_URL'),
      ) ?? DEFAULT_ROUTING_BASE_URL
    );
  }

  private getGeocoderBaseUrl(): string {
    return (
      normalizeString(
        this.configService.get<string>('YANDEX_GEOCODER_BASE_URL'),
      ) ?? DEFAULT_GEOCODER_BASE_URL
    );
  }

  private getRequestTimeoutMs(): number {
    const rawTimeout = Number(
      this.configService.get<string>('ROUTING_PROVIDER_TIMEOUT_MS') ??
        DEFAULT_TIMEOUT_MS,
    );

    if (!Number.isFinite(rawTimeout) || rawTimeout <= 0) {
      return DEFAULT_TIMEOUT_MS;
    }

    return rawTimeout;
  }

  private buildRoutingUrl(points: RoutePoint[], options: RouteOptions): URL {
    const apiKey = this.getRoutingApiKey();

    if (!apiKey) {
      throw new Error(
        'YANDEX_ROUTING_API_KEY or YANDEX_MAPS_API_KEY is required for Yandex routing mode',
      );
    }

    const url = new URL(this.getRoutingBaseUrl());
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('waypoints', serializeWaypoints(points));
    url.searchParams.set('lang', options.locale ?? DEFAULT_LOCALE);
    url.searchParams.set('mode', options.mode);

    return url;
  }

  private buildGeocodeUrl(address: string): URL {
    const apiKey = this.getMapsApiKey() ?? this.getRoutingApiKey();

    if (!apiKey) {
      throw new Error(
        'YANDEX_MAPS_API_KEY or YANDEX_ROUTING_API_KEY is required for Yandex geocoding mode',
      );
    }

    const url = new URL(this.getGeocoderBaseUrl());
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('format', 'json');
    url.searchParams.set('geocode', address);
    url.searchParams.set('lang', DEFAULT_LOCALE);

    return url;
  }

  private async fetchJson(url: URL, operation: string): Promise<YandexJson> {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(this.getRequestTimeoutMs()),
    });

    if (!response.ok) {
      throw new Error(
        `Yandex ${operation} request failed with status ${response.status}`,
      );
    }

    const payload = (await response.json()) as unknown;

    if (!isRecord(payload)) {
      throw new Error(`Yandex ${operation} response is not a JSON object`);
    }

    return payload;
  }
}

function validateRoutePoints(points: RoutePoint[]): void {
  if (points.length < 2) {
    throw new Error('Routing provider requires at least two points');
  }
}

function buildMockRoute(
  points: RoutePoint[],
  options: RouteOptions,
): RouteResult {
  const orderedPoints = orderRoutePoints(points, options.optimizeWaypoints);
  const requestPoints = buildRequestPoints(
    orderedPoints,
    options.returnToStart,
  );
  const legs = buildMockLegs(requestPoints, options.mode);
  const distanceMeters = Math.round(
    legs.reduce((total, leg) => total + leg.distanceMeters, 0),
  );
  const durationSeconds = Math.round(
    legs.reduce((total, leg) => total + leg.durationSeconds, 0),
  );

  return {
    distanceMeters,
    durationSeconds,
    polyline: requestPoints.map((point) => point.coordinates),
    orderedPoints,
    stops: buildStops(orderedPoints, options.departureTime, legs),
    legs,
    provider: 'mock-yandex',
    metadata: {
      mock: true,
      optimized: options.optimizeWaypoints,
      returnToStart: options.returnToStart,
      mode: options.mode,
    },
  };
}

function buildMockDistance(from: Coordinates, to: Coordinates): DistanceResult {
  const distanceMeters = haversineDistanceMeters(from, to);

  return {
    distanceMeters: Math.round(distanceMeters),
    durationSeconds: Math.round(
      distanceMeters / getAverageMetersPerSecond('driving'),
    ),
    provider: 'mock-yandex',
    metadata: {
      mock: true,
    },
  };
}

function buildMockGeocode(address: string): Coordinates {
  let hash = 0;

  for (const char of address) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100_000;
  }

  return {
    latitude: 55.5 + (hash % 5000) / 10_000,
    longitude: 37.3 + (Math.floor(hash / 10) % 5000) / 10_000,
  };
}

function orderRoutePoints(
  points: RoutePoint[],
  optimizeWaypoints: boolean,
): RoutePoint[] {
  if (!optimizeWaypoints || points.length < 3) {
    return [...points];
  }

  const [startPoint, ...remaining] = points;
  const orderedPoints = [startPoint];

  while (remaining.length > 0) {
    const currentPoint = orderedPoints[orderedPoints.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const distance = haversineDistanceMeters(
        currentPoint.coordinates,
        candidate.coordinates,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const [nextPoint] = remaining.splice(nearestIndex, 1);
    orderedPoints.push(nextPoint);
  }

  return orderedPoints;
}

function buildRequestPoints(
  orderedPoints: RoutePoint[],
  returnToStart: boolean,
): RoutePoint[] {
  if (!returnToStart) {
    return orderedPoints;
  }

  return [...orderedPoints, orderedPoints[0]];
}

function buildMockLegs(
  points: RoutePoint[],
  mode: RouteOptions['mode'],
): RouteLeg[] {
  return points.slice(0, -1).map((point, index) => {
    const nextPoint = points[index + 1];
    const distanceMeters = haversineDistanceMeters(
      point.coordinates,
      nextPoint.coordinates,
    );

    return {
      fromPointId: point.id,
      toPointId: nextPoint.id,
      distanceMeters: Math.round(distanceMeters),
      durationSeconds: Math.max(
        60,
        Math.round(distanceMeters / getAverageMetersPerSecond(mode)),
      ),
      geometry: [point.coordinates, nextPoint.coordinates],
    };
  });
}

function buildStops(
  points: RoutePoint[],
  departureTime: Date | null,
  legs: RouteLeg[],
) {
  let accumulatedSeconds = 0;

  return points.map((point, index) => {
    if (index > 0) {
      accumulatedSeconds += legs[index - 1]?.durationSeconds ?? 0;
    }

    return {
      pointId: point.id,
      sequence: index + 1,
      eta:
        departureTime === null
          ? null
          : new Date(departureTime.getTime() + accumulatedSeconds * 1_000),
    };
  });
}

function parseYandexRouteResponse(
  payload: YandexJson,
  orderedPoints: RoutePoint[],
  requestPoints: RoutePoint[],
  options: RouteOptions,
): RouteResult {
  const route = getFirstRoute(payload);

  if (!route) {
    throw new Error('Yandex routing response does not contain routes');
  }

  const routeLegs = readArray(route['legs']);
  const legs =
    routeLegs.length > 0
      ? routeLegs.map((leg, index) =>
          mapYandexLeg(toYandexJson(leg), requestPoints, index),
        )
      : buildMockLegs(requestPoints, options.mode);

  const distanceMeters =
    readNumber(route['distance']) ??
    Math.round(legs.reduce((total, leg) => total + leg.distanceMeters, 0));
  const durationSeconds =
    readNumber(route['duration']) ??
    Math.round(legs.reduce((total, leg) => total + leg.durationSeconds, 0));
  const polyline =
    readCoordinatesCollection(route['geometry']) ??
    readCoordinatesCollection(
      getNestedValue(route, ['overview', 'geometry']),
    ) ??
    requestPoints.map((point) => point.coordinates);

  return {
    distanceMeters,
    durationSeconds,
    polyline,
    orderedPoints,
    stops: buildStops(orderedPoints, options.departureTime, legs),
    legs,
    provider: 'yandex',
    metadata: {
      mock: false,
      optimized: options.optimizeWaypoints,
      returnToStart: options.returnToStart,
      mode: options.mode,
      legCount: legs.length,
    },
  };
}

function mapYandexLeg(
  leg: YandexJson,
  points: RoutePoint[],
  index: number,
): RouteLeg {
  const fromPoint = points[index];
  const toPoint = points[index + 1];

  if (!fromPoint || !toPoint) {
    throw new Error(
      'Yandex route response leg count does not match request points',
    );
  }

  return {
    fromPointId: fromPoint.id,
    toPointId: toPoint.id,
    distanceMeters:
      readNumber(leg['distance']) ??
      Math.round(
        haversineDistanceMeters(fromPoint.coordinates, toPoint.coordinates),
      ),
    durationSeconds:
      readNumber(leg['duration']) ??
      Math.round(
        haversineDistanceMeters(fromPoint.coordinates, toPoint.coordinates) /
          getAverageMetersPerSecond('driving'),
      ),
    geometry: readCoordinatesCollection(leg['geometry']) ??
      readCoordinatesCollection(
        getNestedValue(leg, ['overview', 'geometry']),
      ) ?? [fromPoint.coordinates, toPoint.coordinates],
  };
}

function parseYandexGeocodeResponse(payload: YandexJson): Coordinates {
  const featureMember = readArray(
    getNestedValue(payload, [
      'response',
      'GeoObjectCollection',
      'featureMember',
    ]),
  );

  const firstGeoObject = featureMember[0];
  if (isRecord(firstGeoObject)) {
    const point = getNestedValue(firstGeoObject, ['GeoObject', 'Point', 'pos']);

    if (typeof point === 'string') {
      return parsePointPosition(point);
    }
  }

  const features = readArray(payload['features']);
  const firstFeature = features[0];

  if (isRecord(firstFeature)) {
    const geometry = getNestedValue(firstFeature, ['geometry', 'coordinates']);
    const coordinates = readCoordinatesCollection(geometry);

    if (coordinates && coordinates[0]) {
      return coordinates[0];
    }
  }

  throw new Error('Yandex geocode response does not contain coordinates');
}

function getFirstRoute(payload: YandexJson): YandexJson | null {
  const routeCandidates = [
    payload['routes'],
    getNestedValue(payload, ['result', 'routes']),
    getNestedValue(payload, ['response', 'routes']),
  ];

  for (const candidate of routeCandidates) {
    const routes = readArray(candidate);

    if (routes.length > 0 && isRecord(routes[0])) {
      return routes[0];
    }
  }

  const directRouteCandidates = [
    payload['route'],
    getNestedValue(payload, ['result', 'route']),
    getNestedValue(payload, ['response', 'route']),
  ];

  for (const candidate of directRouteCandidates) {
    if (isRecord(candidate)) {
      return candidate;
    }
  }

  return null;
}

function serializeWaypoints(points: RoutePoint[]): string {
  return points
    .map(
      (point) => `${point.coordinates.longitude},${point.coordinates.latitude}`,
    )
    .join('|');
}

function readCoordinatesCollection(value: unknown): Coordinates[] | null {
  const coordinates = readArray(
    isRecord(value)
      ? (value['coordinates'] ?? value['geometry'] ?? value)
      : value,
  );

  if (coordinates.length === 0) {
    return null;
  }

  const normalizedCoordinates = coordinates
    .map((entry) => parseCoordinateEntry(entry))
    .filter((entry): entry is Coordinates => entry !== null);

  return normalizedCoordinates.length > 0 ? normalizedCoordinates : null;
}

function parseCoordinateEntry(value: unknown): Coordinates | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const longitude = Number(value[0]);
  const latitude = Number(value[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function parsePointPosition(value: string): Coordinates {
  const [longitudeRaw, latitudeRaw] = value.trim().split(/\s+/);
  const longitude = Number(longitudeRaw);
  const latitude = Number(latitudeRaw);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Yandex geocode response contains invalid coordinates');
  }

  return {
    latitude,
    longitude,
  };
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  if (isRecord(value)) {
    return readNumber(value['value']);
  }

  return null;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getNestedValue(source: unknown, path: string[]): unknown {
  let current = source;

  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toYandexJson(value: unknown): YandexJson {
  if (!isRecord(value)) {
    throw new Error('Yandex route response contains invalid leg payload');
  }

  return value;
}

function normalizeString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function haversineDistanceMeters(from: Coordinates, to: Coordinates): number {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = degreesToRadians(to.latitude - from.latitude);
  const longitudeDelta = degreesToRadians(to.longitude - from.longitude);
  const fromLatitude = degreesToRadians(from.latitude);
  const toLatitude = degreesToRadians(to.latitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getAverageMetersPerSecond(mode: RouteOptions['mode']): number {
  const averageSpeedKmhByMode: Record<RouteOptions['mode'], number> = {
    driving: 35,
    walking: 5,
    cycling: 15,
  };

  return (
    (averageSpeedKmhByMode[mode] * METERS_PER_KILOMETER) / SECONDS_PER_HOUR
  );
}
