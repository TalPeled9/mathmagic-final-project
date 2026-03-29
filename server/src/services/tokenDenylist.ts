import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const revokedTokenHashes = new Map<string, number>();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getTokenExpiryMs(token: string): number {
  const decoded = jwt.decode(token);
  if (decoded && typeof decoded === 'object' && typeof decoded.exp === 'number') {
    return decoded.exp * 1000;
  }
  return Date.now() + DEFAULT_TTL_MS;
}

function purgeExpiredRevocations(): void {
  const now = Date.now();
  for (const [hash, expiresAt] of revokedTokenHashes.entries()) {
    if (expiresAt <= now) {
      revokedTokenHashes.delete(hash);
    }
  }
}

export function revokeToken(token: string): void {
  purgeExpiredRevocations();
  revokedTokenHashes.set(hashToken(token), getTokenExpiryMs(token));
}

export function isTokenRevoked(token: string): boolean {
  purgeExpiredRevocations();
  return revokedTokenHashes.has(hashToken(token));
}
