// Submits public/sitemap.xml to Google Search Console via the Web Search
// Indexing API. Designed to be run from a daily GitHub Action (see
// .github/workflows/daily-sitemap-resubmit.yml) — the repeated submission
// keeps the sitemap near the top of Google's crawl queue, which matters a
// lot for a low-authority domain like tibiatrader.com where bare discovery
// is currently the bottleneck (most item URLs still show as "URL is
// unknown to Google" in GSC).
//
// Auth: a service-account JSON key passed in via the GSC_SERVICE_ACCOUNT
// env var (as a single-line JSON string). The service account must be
// granted "Owner" or "Full" permission on the GSC property — add its
// `client_email` from the GSC settings page under "Users and permissions".
//
// Run locally: GSC_SERVICE_ACCOUNT="$(cat key.json)" node scripts/submit-sitemap.js

const https = require('https');

const SITE_URL = 'sc-domain:tibiatrader.com';
const SITEMAP_URL = 'https://tibiatrader.com/sitemap.xml';
const SCOPE = 'https://www.googleapis.com/auth/webmasters';

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Builds a JWT assertion the way Google's OAuth2 token endpoint expects for
// service-account auth. Keeps the script dependency-free — no googleapis
// SDK so the GitHub Action stays fast and easy to audit.
function buildJwt(serviceAccount) {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claim = b64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: SCOPE,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const crypto = require('crypto');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(serviceAccount.private_key, 'base64');
  return `${signingInput}.${signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
}

function postForm(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        method: 'POST',
        hostname: parsed.hostname,
        path: parsed.pathname,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }),
        );
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function putEmpty(url, accessToken) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        method: 'PUT',
        hostname: parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Length': 0,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }),
        );
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function getAccessToken(serviceAccount) {
  const jwt = buildJwt(serviceAccount);
  const body = `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`;
  const res = await postForm('https://oauth2.googleapis.com/token', body);
  if (res.status !== 200) {
    throw new Error(`Token exchange failed (${res.status}): ${res.body}`);
  }
  return JSON.parse(res.body).access_token;
}

async function main() {
  const raw = process.env.GSC_SERVICE_ACCOUNT;
  if (!raw) {
    console.error('GSC_SERVICE_ACCOUNT env var is required (service-account JSON key).');
    process.exit(1);
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (e) {
    console.error('GSC_SERVICE_ACCOUNT is not valid JSON:', e.message);
    process.exit(1);
  }

  console.log('Acquiring OAuth2 access token...');
  const accessToken = await getAccessToken(serviceAccount);

  // PUT /webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath} — Google's
  // "submit/resubmit" endpoint. Idempotent, no payload.
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
  console.log('Submitting sitemap:', SITEMAP_URL);
  const res = await putEmpty(endpoint, accessToken);
  if (res.status >= 200 && res.status < 300) {
    console.log(`OK (${res.status}). Sitemap re-queued for processing.`);
  } else {
    console.error(`Submit failed (${res.status}): ${res.body}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
