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
 * Encrypts the payload using AES-256-CBC with a random IV.
 * @param {string|object} data - The JSON payload to encrypt.
 * @param {Buffer} appKey - The 32-byte session key.
 * @returns {string} - Base64 encoded (IV + encryptedData).
 */
export const encryptAES = (data, appKey) => {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', appKey, iv);
  
  let encrypted = cipher.update(json, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Prepend IV (hex or base64) to the encrypted data
  return iv.toString('base64') + ":" + encrypted;
};

/**
 * Decrypts the response from IRP using AES-256-CBC with prepended IV.
 * @param {string} encryptedWithIv - The IV and encrypted data (base64:base64).
 * @param {Buffer} appKey - The session key used for encryption.
 * @returns {object} - Decrypted JSON object.
 */
export const decryptAES = (encryptedWithIv, appKey) => {
  try {
    const [ivBase64, encryptedData] = encryptedWithIv.split(':');
    if (!ivBase64 || !encryptedData) {
      // Fallback for legacy deterministic IV if no colon found
      const decipherLegacy = crypto.createDecipheriv('aes-256-cbc', appKey, appKey.slice(0, 16));
      let decryptedLegacy = decipherLegacy.update(encryptedWithIv, 'base64', 'utf8');
      decryptedLegacy += decipherLegacy.final('utf8');
      return JSON.parse(decryptedLegacy);
    }

    const iv = Buffer.from(ivBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', appKey, iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
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
 * Upgraded to RSA_PKCS1_OAEP_PADDING with sha256.
 * @param {Buffer} appKey - The random session key.
 * @param {string} publicKeyPem - NIC IRP Public Key in PEM format.
 * @returns {string} - Base64 encoded encrypted session key.
 */
export const encryptRSA = (appKey, publicKeyPem) => {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    appKey
  );
  return encrypted.toString('base64');
};

/**
 * Performs REGEX format validation for a 15-digit GSTIN.
 * Note: This only validates morphological structure, not the checksum digit.
 * @param {string} gstin - The GSTIN to validate.
 * @returns {boolean} - True if format is valid.
 */
export const validateGSTIN = (gstin) => {
  if (!gstin || gstin.length !== 15) return false;
  const reg = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!reg.test(gstin)) return false;
  
  // Optional: Checksum validation logic could be added here
  // For now, regex is a strong first-pass
  return true;
};
