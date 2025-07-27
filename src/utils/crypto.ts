/**
 * Asynchronously generates a secret and its SHA-256 hash using the browser's Web Crypto API.
 */
export const generateSecretAndHashAsync = async (): Promise<{ secret: Uint8Array; hash: Uint8Array; }> => {
    const secret = window.crypto.getRandomValues(new Uint8Array(32));
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', secret);
    const hash = new Uint8Array(hashBuffer);
    return { secret, hash };
};

/**
 * Helper to convert a Uint8Array to a hex string.
 * @param bytes The Uint8Array to convert.
 * @returns A hex string representation.
 */
export function bytesToHex(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('hex');
} 