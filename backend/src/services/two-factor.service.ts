import crypto from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function encodeBase32(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function decodeBase32(input: string) {
  const normalized = input.toUpperCase().replace(/=+$/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid base32 secret');
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function generateHotp(secret: string, counter: number) {
  const secretBuffer = decodeBase32(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = crypto.createHmac('sha1', secretBuffer).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

export function generateEmailTwoFactorCode() {
  return String(crypto.randomInt(0, 10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, '0');
}

export function hashTwoFactorValue(value: string) {
  return sha256(value);
}

export function createTwoFactorChallenge(method: 'email' | 'authenticator') {
  return {
    challengeId: crypto.randomBytes(32).toString('hex'),
    method,
    expiresAt: new Date(Date.now() + 1000 * 60 * 10),
  };
}

export function generateAuthenticatorSecret() {
  return encodeBase32(crypto.randomBytes(20));
}

export function buildOtpAuthUrl(email: string, secret: string) {
  const label = encodeURIComponent(`Notey:${email}`);
  const issuer = encodeURIComponent('Notey');
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD_SECONDS}`;
}

export function verifyAuthenticatorCode(secret: string, code: string, window = 1) {
  const normalizedCode = code.replace(/\s+/g, '');

  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);
  for (let offset = -window; offset <= window; offset += 1) {
    if (generateHotp(secret, currentCounter + offset) === normalizedCode) {
      return true;
    }
  }

  return false;
}

export const twoFactorChallengeLifetimeMinutes = 10;
