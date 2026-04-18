// Edge proxy for /world_data — tiny payload with last_update timestamp.

export const config = { runtime: 'edge' };

const ORIGIN = 'https://api.tibiamarket.top:8001/world_data';

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
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
