// Vercel serverless function: proxies Tibia item images from Fandom wiki CDN
// Usage: /api/item-image?name=Great_Health_Potion

// Tibia item names: letters, digits, spaces, underscores, dashes, apostrophes, parentheses, dots.
// Capped at 100 chars — real item names are never longer.
const ALLOWED_NAME = /^[\w\s\-'().]{1,100}$/;

// Only accept image URLs served from Fandom's CDN. Prevents SSRF if the Fandom
// API ever returns a redirect or an unexpected host.
const ALLOWED_IMAGE_HOST_PREFIX = 'https://static.wikia.nocookie.net/';

export default async function handler(req, res) {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Missing name parameter' });
  }
  if (typeof name !== 'string' || !ALLOWED_NAME.test(name)) {
    return res.status(400).json({ error: 'Invalid name parameter' });
  }

  try {
    const apiUrl =
      `https://tibia.fandom.com/api.php?action=query` +
      `&titles=File:${encodeURIComponent(name)}.gif` +
      `&prop=imageinfo&iiprop=url&format=json&origin=*`;

    const apiResp = await fetch(apiUrl, {
      headers: { 'User-Agent': 'TibiaMarketApp/1.0' },
    });

    if (!apiResp.ok) {
      return res.status(502).json({ error: 'Fandom API error' });
    }

    const data = await apiResp.json();
    const pages = data?.query?.pages ?? {};
    const page = Object.values(pages)[0];
    const imageUrl = page?.imageinfo?.[0]?.url;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(404).json({ error: 'Image not found' });
    }
    if (!imageUrl.startsWith(ALLOWED_IMAGE_HOST_PREFIX)) {
      return res.status(502).json({ error: 'Unexpected image host' });
    }

    // Fetch the actual image and stream it back (avoids CORS issues).
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) {
      return res.redirect(302, imageUrl);
    }

    const contentType = imgResp.headers.get('content-type') || 'image/gif';
    const buffer = await imgResp.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
