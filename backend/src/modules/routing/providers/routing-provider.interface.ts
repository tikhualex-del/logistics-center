// Contract for map/routing backends used by the routing domain.
// Concrete implementations (for example Yandex) must stay behind this interface.

export const ROUTING_PROVIDER = Symbol('ROUTING_PROVIDER');

export type RouteTransportMode = 'driving' | 'walking' | 'cycling';
export type RoutePointType = 'courier' | 'pickup' | 'dropoff' | 'waypoint';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RoutePoint {
  id: string;
  orderId: string | null;
  address: string | null;
  coordinates: Coordinates;
  type: RoutePointType;
  metadata: Record<string, unknown> | null;
}

export interface RouteOptions {
  mode: RouteTransportMode;
  optimizeWaypoints: boolean;
  avoidTolls: boolean;
  avoidUnpaved: boolean;
  departureTime: Date | null;
  returnToStart: boolean;
  locale: string | null;
}

export interface RouteLeg {
  fromPointId: string;
  toPointId: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: Coordinates[];
}

export interface RouteStop {
  pointId: string;
  sequence: number;
  eta: Date | null;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: Coordinates[];
  orderedPoints: RoutePoint[];
  stops: RouteStop[];
  legs: RouteLeg[];
  provider: string;
  metadata: Record<string, unknown> | null;
}

export interface DistanceResult {
  distanceMeters: number;
  durationSeconds: number | null;
  provider: string;
  metadata: Record<string, unknown> | null;
}

export interface RoutingProvider {
  buildRoute(points: RoutePoint[], options: RouteOptions): Promise<RouteResult>;
  calculateDistance(
    from: Coordinates,
    to: Coordinates,
  ): Promise<DistanceResult>;
  geocode(address: string): Promise<Coordinates>;
}
