import crypto from 'crypto';

export function hashSecret(secret: string, salt?: string): { hash: string; salt: string } {
  const userSalt = salt || crypto.randomBytes(16).toString('hex');
  const normalized = secret.trim();
  const hash = crypto.pbkdf2Sync(normalized, userSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: userSalt };
}

export function verifySecret(secret: string, hash: string, salt: string): boolean {
  const normalized = secret.trim();
  const testHash = crypto.pbkdf2Sync(normalized, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateStudentCode(): string {
  const prefixes = ['ROBO', 'CHIP', 'BOT', 'STEAM', 'SPARK', 'NANO', 'TECH'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${prefix}${num}`;
}
