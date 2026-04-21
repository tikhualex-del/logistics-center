import {
  ROUTING_PROVIDER,
  Coordinates,
  DistanceResult,
  RouteOptions,
  RoutePoint,
  RouteResult,
  RoutingProvider,
} from './routing-provider.interface';

class InMemoryRoutingProvider implements RoutingProvider {
  async buildRoute(
    points: RoutePoint[],
    options: RouteOptions,
  ): Promise<RouteResult> {
    const orderedPoints = options.optimizeWaypoints
      ? [...points].sort((left, right) => left.id.localeCompare(right.id))
      : [...points];

    return {
      distanceMeters: 1250,
      durationSeconds: 540,
      polyline: orderedPoints.map((point) => point.coordinates),
      orderedPoints,
      stops: orderedPoints.map((point, index) => ({
        pointId: point.id,
        sequence: index + 1,
        eta:
          options.departureTime === null
            ? null
            : new Date(options.departureTime.getTime() + (index + 1) * 600_000),
      })),
      legs: orderedPoints.slice(0, -1).map((point, index) => ({
        fromPointId: point.id,
        toPointId: orderedPoints[index + 1]!.id,
        distanceMeters: 625,
        durationSeconds: 270,
        geometry: [point.coordinates, orderedPoints[index + 1]!.coordinates],
      })),
      provider: 'in-memory',
      metadata: {
        mode: options.mode,
      },
    };
  }

  async calculateDistance(
    from: Coordinates,
    to: Coordinates,
  ): Promise<DistanceResult> {
    return {
      distanceMeters: Math.round(
        Math.abs(from.latitude - to.latitude) * 100_000 +
          Math.abs(from.longitude - to.longitude) * 100_000,
      ),
      durationSeconds: 300,
      provider: 'in-memory',
      metadata: null,
    };
  }

  async geocode(address: string): Promise<Coordinates> {
    return {
      latitude: address.length,
      longitude: address.length / 2,
    };
  }
}

describe('RoutingProvider contract', () => {
  const provider: RoutingProvider = new InMemoryRoutingProvider();
  const points: RoutePoint[] = [
    {
      id: 'dropoff-2',
      orderId: 'order-2',
      address: 'Moscow, Tverskaya 2',
      coordinates: { latitude: 55.758, longitude: 37.615 },
      type: 'dropoff',
      metadata: null,
    },
    {
      id: 'courier-1',
      orderId: null,
      address: null,
      coordinates: { latitude: 55.751, longitude: 37.618 },
      type: 'courier',
      metadata: { courierId: 'courier-1' },
    },
  ];
  const options: RouteOptions = {
    mode: 'driving',
    optimizeWaypoints: true,
    avoidTolls: false,
    avoidUnpaved: false,
    departureTime: new Date('2026-04-17T09:00:00.000Z'),
    returnToStart: false,
    locale: 'ru_RU',
  };

  it('exposes a stable DI token for concrete routing providers', () => {
    expect(typeof ROUTING_PROVIDER).toBe('symbol');
    expect(ROUTING_PROVIDER.description).toBe('ROUTING_PROVIDER');
  });

  it('builds a route result with ordered points, stops, legs, and polyline', async () => {
    const result = await provider.buildRoute(points, options);

    expect(result).toEqual(
      expect.objectContaining({
        distanceMeters: 1250,
        durationSeconds: 540,
        provider: 'in-memory',
        metadata: { mode: 'driving' },
      }),
    );
    expect(result.orderedPoints.map((point) => point.id)).toEqual([
      'courier-1',
      'dropoff-2',
    ]);
    expect(result.stops).toHaveLength(2);
    expect(result.legs).toEqual([
      expect.objectContaining({
        fromPointId: 'courier-1',
        toPointId: 'dropoff-2',
        geometry: [
          { latitude: 55.751, longitude: 37.618 },
          { latitude: 55.758, longitude: 37.615 },
        ],
      }),
    ]);
    expect(result.polyline).toEqual([
      { latitude: 55.751, longitude: 37.618 },
      { latitude: 55.758, longitude: 37.615 },
    ]);
  });

  it('supports distance calculation and geocoding via the same provider contract', async () => {
    const distance = await provider.calculateDistance(
      { latitude: 55.751, longitude: 37.618 },
      { latitude: 55.758, longitude: 37.615 },
    );
    const coordinates = await provider.geocode('Moscow, Tverskaya 10');

    expect(distance).toEqual({
      distanceMeters: 1000,
      durationSeconds: 300,
      provider: 'in-memory',
      metadata: null,
    });
    expect(coordinates).toEqual({
      latitude: 20,
      longitude: 10,
    });
  });
});
