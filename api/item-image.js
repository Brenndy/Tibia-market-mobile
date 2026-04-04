// Vercel serverless function: proxies Tibia item images from Fandom wiki CDN
// Usage: /api/item-image?name=Great_Health_Potion
export default async function handler(req, res) {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Missing name parameter' });
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

    if (!imageUrl) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Fetch the actual image and stream it back (avoids CORS issues)
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
