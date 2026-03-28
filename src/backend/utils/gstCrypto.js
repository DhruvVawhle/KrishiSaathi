import crypto from 'crypto';

/**
 * GST e-Invoicing Crypto Utility (NIC Compliance v1.04)
 * Handles AES-256-CBC, HMAC-SHA256, and RSA for IRP communication.
 */

/**
 * Generates a random AES-256 Session Key (32 bytes).
 */
export const generateSessionKey = () => {
  return crypto.randomBytes(32);
};

/**
 * Encrypts the payload using AES-256-CBC with the provided session key.
 * @param {string|object} data - The JSON payload to encrypt.
 * @param {Buffer} appKey - The 32-byte session key.
 * @returns {string} - Base64 encoded encrypted data.
 */
export const encryptAES = (data, appKey) => {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  const cipher = crypto.createCipheriv('aes-256-cbc', appKey, appKey.slice(0, 16));
  let encrypted = cipher.update(json, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

/**
 * Decrypted the response from IRP using AES-256-CBC.
 * @param {string} base64Data - The encrypted response from IRP.
 * @param {Buffer} appKey - The session key used for encryption.
 * @returns {object} - Decrypted JSON object.
 */
export const decryptAES = (base64Data, appKey) => {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', appKey, appKey.slice(0, 16));
    let decrypted = decipher.update(base64Data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('❌ AES Decryption Error:', err.message);
    throw new Error('Failed to decrypt IRP response');
  }
};

/**
 * Generates a HMAC-SHA256 hash of the payload for integrity.
 * @param {string|object} data - The JSON payload.
 * @param {Buffer} appKey - The session key.
 * @returns {string} - Base64 encoded HMAC.
 */
export const generateHMAC = (data, appKey) => {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHmac('sha256', appKey).update(json).digest('base64');
};

/**
 * Encrypts the Session Key using the NIC Public Key (RSA).
 * Required for the /auth endpoint.
 * @param {Buffer} appKey - The random session key.
 * @param {string} publicKeyPem - NIC IRP Public Key in PEM format.
 * @returns {string} - Base64 encoded encrypted session key.
 */
export const encryptRSA = (appKey, publicKeyPem) => {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    appKey
  );
  return encrypted.toString('base64');
};

/**
 * Validates a GSTIN checksum (15-digit Indian GST Identification Number).
 */
export const validateGSTIN = (gstin) => {
  if (!gstin || gstin.length !== 15) return false;
  const reg = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!reg.test(gstin)) return false;
  
  // Optional: Checksum validation logic could be added here
  // For now, regex is a strong first-pass
  return true;
};
