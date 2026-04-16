# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Tibia Market Mobile, please **do not** open a public GitHub issue. Instead, report it privately so we can fix it before it's publicly disclosed.

**How to report**:

- Open a private vulnerability report via [GitHub Security Advisories](https://github.com/Brenndy/Tibia-market-mobile/security/advisories/new).

Please include:

- A description of the issue and its impact
- Steps to reproduce (ideally with a minimal proof-of-concept)
- Affected version / commit hash
- Any suggested mitigation

## Scope

In scope:

- Client-side vulnerabilities (XSS, injection, privilege escalation in the React Native / web app)
- Server-side issues in the Vercel serverless functions (`api/*.js`) — particularly `item-image.js` which proxies external content
- Misconfigured Vercel rewrites (`vercel.json`) that could expose the deployment as an open proxy
- Storage abuse (localStorage / AsyncStorage)
- Dependency vulnerabilities

Out of scope:

- Vulnerabilities in the upstream `api.tibiamarket.top` API (report to its maintainers)
- Rate limiting on the public Vercel deployment (the free tier is not meant as production infrastructure for forks — set up your own deployment per README)
- Self-XSS via browser devtools

## Supported Versions

Only the latest release on `main` receives security updates.

## Response Timeline

- Acknowledgement within 72 hours
- Initial triage and severity assessment within 7 days
- Fix and coordinated disclosure timeline depends on severity
