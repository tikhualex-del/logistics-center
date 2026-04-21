import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { RouteOptions, RoutePoint } from './routing-provider.interface';
import { YandexRoutingProvider } from './yandex-routing.provider';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const baseOptions: RouteOptions = {
  mode: 'driving',
  optimizeWaypoints: true,
  avoidTolls: false,
  avoidUnpaved: false,
  departureTime: new Date('2026-04-17T09:00:00.000Z'),
  returnToStart: false,
  locale: 'ru_RU',
};

const basePoints: RoutePoint[] = [
  {
    id: 'courier-1',
    orderId: null,
    address: null,
    coordinates: {
      latitude: 55.751,
      longitude: 37.618,
    },
    type: 'courier',
    metadata: { courierId: 'courier-1' },
  },
  {
    id: 'order-2',
    orderId: 'order-2',
    address: 'Moscow, Tverskaya 2',
    coordinates: {
      latitude: 55.758,
      longitude: 37.615,
    },
    type: 'dropoff',
    metadata: null,
  },
  {
    id: 'order-1',
    orderId: 'order-1',
    address: 'Moscow, Tverskaya 1',
    coordinates: {
      latitude: 55.752,
      longitude: 37.617,
    },
    type: 'dropoff',
    metadata: null,
  },
];

describe('YandexRoutingProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('falls back to deterministic mock routing in auto mode without API keys', async () => {
    const provider = createProvider({
      ROUTING_PROVIDER_MODE: 'auto',
    });
    const fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;

    const route = await provider.buildRoute(basePoints, baseOptions);
    const geocode = await provider.geocode('Moscow, Tverskaya 10');

    expect(route.provider).toBe('mock-yandex');
    expect(route.orderedPoints.map((point) => point.id)).toEqual([
      'courier-1',
      'order-1',
      'order-2',
    ]);
    expect(route.legs).toHaveLength(2);
    expect(route.stops[0]?.eta).toEqual(new Date('2026-04-17T09:00:00.000Z'));
    expect(route.metadata).toEqual(
      expect.objectContaining({
        mock: true,
        optimized: true,
      }),
    );
    expect(geocode).toEqual({
      latitude: expect.any(Number),
      longitude: expect.any(Number),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls Yandex routing endpoint and parses route payload in yandex mode', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        routes: [
          {
            distance: { value: 1800 },
            duration: { value: 720 },
            geometry: {
              coordinates: [
                [37.618, 55.751],
                [37.617, 55.752],
                [37.615, 55.758],
              ],
            },
            legs: [
              {
                distance: { value: 400 },
                duration: { value: 180 },
                geometry: {
                  coordinates: [
                    [37.618, 55.751],
                    [37.617, 55.752],
                  ],
                },
              },
              {
                distance: { value: 1400 },
                duration: { value: 540 },
                geometry: {
                  coordinates: [
                    [37.617, 55.752],
                    [37.615, 55.758],
                  ],
                },
              },
            ],
          },
        ],
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    const provider = createProvider({
      ROUTING_PROVIDER_MODE: 'yandex',
      YANDEX_ROUTING_API_KEY: 'routing-key',
      YANDEX_MAPS_API_KEY: 'maps-key',
    });

    const result = await provider.buildRoute(basePoints, baseOptions);
    const [firstCallUrl] = fetchMock.mock.calls[0] ?? [];

    expect(String(firstCallUrl)).toContain(
      'https://api.routing.yandex.net/v2/route',
    );
    expect(String(firstCallUrl)).toContain('apikey=routing-key');
    expect(String(firstCallUrl)).toContain('mode=driving');
    expect(result).toEqual(
      expect.objectContaining({
        provider: 'yandex',
        distanceMeters: 1800,
        durationSeconds: 720,
      }),
    );
    expect(result.orderedPoints.map((point) => point.id)).toEqual([
      'courier-1',
      'order-1',
      'order-2',
    ]);
    expect(result.legs).toEqual([
      expect.objectContaining({
        fromPointId: 'courier-1',
        toPointId: 'order-1',
      }),
      expect.objectContaining({
        fromPointId: 'order-1',
        toPointId: 'order-2',
      }),
    ]);
  });

  it('parses Yandex geocoder response and reuses route build for distance calculation', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          response: {
            GeoObjectCollection: {
              featureMember: [
                {
                  GeoObject: {
                    Point: {
                      pos: '37.617635 55.755814',
                    },
                  },
                },
              ],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          routes: [
            {
              distance: { value: 1500 },
              duration: { value: 600 },
              legs: [
                {
                  distance: { value: 1500 },
                  duration: { value: 600 },
                },
              ],
            },
          ],
        }),
      });
    global.fetch = fetchMock as typeof fetch;

    const provider = createProvider({
      ROUTING_PROVIDER_MODE: 'yandex',
      YANDEX_ROUTING_API_KEY: 'routing-key',
      YANDEX_MAPS_API_KEY: 'maps-key',
    });

    const coordinates = await provider.geocode('Moscow, Kremlin');
    const distance = await provider.calculateDistance(
      { latitude: 55.751, longitude: 37.618 },
      { latitude: 55.758, longitude: 37.615 },
    );

    expect(coordinates).toEqual({
      latitude: 55.755814,
      longitude: 37.617635,
    });
    expect(distance).toEqual({
      distanceMeters: 1500,
      durationSeconds: 600,
      provider: 'yandex',
      metadata: expect.objectContaining({
        mock: false,
      }),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

function createProvider(config: Record<string, string>) {
  const configService = {
    get: jest.fn((key: string) => config[key]),
  } as unknown as ConfigService;

  return new YandexRoutingProvider(
    configService,
    mockLogger as unknown as PinoLogger,
  );
}
