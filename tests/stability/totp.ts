import { createHmac } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** RFC 6238 time-based code: HMAC-SHA1, 30 second step, 6 digits. */
export function totp(secret: string, at = Date.now()): string {
  let bits = '';
  for (const c of secret.replace(/=+$/, '').toUpperCase()) {
    bits += ALPHABET.indexOf(c).toString(2).padStart(5, '0');
  }
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30000)));
  const mac = createHmac('sha1', key).update(counter).digest();
  const offset = mac[mac.length - 1] & 15;
  return String((mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

/** Milliseconds until the current code stops being valid. */
export function msLeft(at = Date.now()): number {
  return 30000 - (at % 30000);
}
