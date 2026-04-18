// Edge proxy for /market_board — live order book (sellers + buyers). Volatile.

export const config = { runtime: 'edge' };

const ORIGIN = 'https://api.tibiamarket.top:8001/market_board';

export default async function handler(request) {
  const url = new URL(request.url);
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
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
    },
  });
}
