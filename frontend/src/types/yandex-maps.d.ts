/**
 * Minimal TypeScript declarations for Yandex Maps JS API 2.1.
 *
 * Full types: https://yandex.ru/dev/jsapi-v2-1/doc/en/
 * We declare only the subset used by MapView and future map components.
 */

declare namespace ymaps {
  /** Initialises the API. Callback fires when API is ready. */
  function ready(callback?: () => void): Promise<void>

  type Coordinates = [number, number]

  interface MapState {
    center: Coordinates
    zoom: number
    type?: string
    behaviors?: string[]
    controls?: string[]
  }

  interface MapOptions {
    suppressMapOpenBlock?: boolean
    yandexMapDisablePoiInteractivity?: boolean
  }

  interface OptionManager {
    set(key: string, value: unknown): this
  }

  class Map {
    constructor(
      container: HTMLElement | string,
      state: MapState,
      options?: MapOptions,
    )
    destroy(): void
    setCenter(center: Coordinates, zoom?: number): Promise<void>
    getCenter(): Coordinates
    getZoom(): number
    geoObjects: GeoObjectCollection
    events: EventManager
  }

  class GeoObjectCollection {
    add(object: GeoObject | Placemark | Polyline | Polygon): this
    remove(object: GeoObject | Placemark | Polyline | Polygon): this
    removeAll(): this
    each(callback: (object: GeoObject) => void): void
  }

  class GeoObject {
    events: EventManager
    options: OptionManager
  }

  interface PlacemarkGeometry {
    type: 'Point'
    coordinates: Coordinates
  }

  interface PlacemarkProperties {
    balloonContent?: string
    hintContent?: string
    iconContent?: string
  }

  interface PlacemarkOptions {
    preset?: string
    iconColor?: string
    iconLayout?: string
    iconImageHref?: string
    iconImageSize?: [number, number]
    iconImageOffset?: [number, number]
  }

  class Placemark extends GeoObject {
    constructor(
      geometry: Coordinates | PlacemarkGeometry,
      properties?: PlacemarkProperties,
      options?: PlacemarkOptions,
    )
    geometry: {
      getCoordinates(): Coordinates
      setCoordinates(coords: Coordinates): void
    }
  }

  class Polyline extends GeoObject {
    constructor(
      geometry: Coordinates[],
      properties?: Record<string, unknown>,
      options?: Record<string, unknown>,
    )
  }

  class Polygon extends GeoObject {
    constructor(
      geometry: Coordinates[][],
      properties?: Record<string, unknown>,
      options?: Record<string, unknown>,
    )
  }

  interface GeoObjectSequence<T extends GeoObject = GeoObject> {
    each(callback: (object: T) => void): void
  }

  type RoutePath = GeoObject
  type RouteWayPoint = GeoObject

  interface RouteResult extends GeoObject {
    getPaths(): GeoObjectSequence<RoutePath>
    getWayPoints(): GeoObjectSequence<RouteWayPoint>
  }

  function route(
    referencePoints: Coordinates[],
    params?: Record<string, unknown>,
  ): Promise<RouteResult>

  interface EventManager {
    add(
      event: string,
      callback: (e: MapEvent) => void,
    ): { remove(): void }
  }

  interface MapEvent {
    get(key: string): unknown
    originalEvent: {
      target: Map
    }
  }
}

interface Window {
  ymaps: typeof ymaps
}
