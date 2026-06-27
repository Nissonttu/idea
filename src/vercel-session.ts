import fs from 'node:fs';

type StoredCookie = {
  name: string;
  domain: string;
  expires?: number;
};

export function sanitizeHostname(hostname: string): string {
  return hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export function hasStoredVercelSession(storagePath: string, hostname: string): boolean {
  if (!fs.existsSync(storagePath)) return false;

  try {
    const state = JSON.parse(fs.readFileSync(storagePath, 'utf8')) as {
      cookies?: StoredCookie[];
    };
    const now = Date.now() / 1000;
    const cookies = state.cookies?.filter(
      (cookie) =>
        hostname === cookie.domain ||
        hostname.endsWith(cookie.domain.replace(/^\./, '')),
    );

    if (!cookies?.length) return false;

    return cookies.some(
      (cookie) => !cookie.expires || cookie.expires < 0 || cookie.expires > now,
    );
  } catch {
    return false;
  }
}
