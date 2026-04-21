const geocodeCache = new Map<string, { lat: number; lng: number }>();

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

type NominatimResult = { lat: string; lon: string };

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }

  // Nominatim usage policy requires at least 1 req/sec — 150ms gap is safe
  await delay(150);

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'logistics-center-app' },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as NominatimResult[];
    if (!data.length) return null;

    const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    geocodeCache.set(address, coords);
    return coords;
  } catch {
    return null;
  }
}
