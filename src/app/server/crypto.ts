import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto';

function key(): Buffer {
  const hex = process.env.PHONE_ENC_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('PHONE_ENC_KEY must be 64 hex characters (32 bytes). See .env.example.');
  }
  return Buffer.from(hex, 'hex');
}

/** AES-256-GCM. Output format: iv.tag.ciphertext (base64 parts). */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

/** "+919800012210" -> "+91 98••• ••210" */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const national = digits.slice(-10);
  const country = digits.slice(0, -10) || '91';
  return `+${country} ${national.slice(0, 2)}••• ••${national.slice(-3)}`;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
