import crypto from 'crypto';

export function generateSecret() {
    const secret = crypto.randomBytes(32);
    const hash = crypto.createHash('sha256').update(secret).digest();
    return { secret, hash };
} 