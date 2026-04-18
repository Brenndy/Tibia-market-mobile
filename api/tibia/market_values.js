// Edge proxy for /market_values — forwards query params unchanged.
//
// Two usage shapes that share this endpoint:
//   - Full board: ?server=X&limit=10000        → cache 5m, swr 10m
//   - Single item: ?server=X&item_ids=Y         → cache 1m, swr 3m

export const config = { runtime: 'edge' };

const ORIGIN = 'https://api.tibiamarket.top:8001/market_values';

export default async function handler(request) {
  const url = new URL(request.url);
  const isSingleItem = url.searchParams.has('item_ids');
  const cacheControl = isSingleItem
    ? 'public, s-maxage=60, stale-while-revalidate=180'
    : 'public, s-maxage=300, stale-while-revalidate=600';

  const upstream = await fetch(ORIGIN + url.search, {
    headers: { Accept: 'application/json' },
  });

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: 'upstream', status: upstream.status }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': cacheControl,
    },
  });
}
