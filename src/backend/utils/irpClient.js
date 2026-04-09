import {
  generateSessionKey,
  encryptAES,
  decryptAES,
  generateHMAC,
  encryptRSA,
} from './gstCrypto.js';
import { getEnv } from './env.js';

/**
 * NIC IRP Client for GST e-Invoicing (v1.04)
 * Handles Auth, IRN Generation, and Cancellation.
 */

const IRP_BASE =
  getEnv('IRP_BASE_URL') || 'https://einv-apisandbox.nic.in';

let cachedToken = null;
let tokenExpiry = 0;

const irpHeaders = () => ({
  client_id: getEnv('IRP_CLIENT_ID') || '',
  client_secret: getEnv('IRP_CLIENT_SECRET') || '',
  gstin: getEnv('IRP_GSTIN') || '',
  user_name: getEnv('IRP_USERNAME') || '',
});

/**
 * Step 1 — Authenticate with IRP and get a JWT token.
 * POST /eivital/v1.04/auth
 */
export const authenticate = async () => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const appKey = generateSessionKey();
  const password = getEnv('IRP_PASSWORD') || '';
  const publicKeyPem = getEnv('IRP_PUBLIC_KEY') || '';

  const encAppKey = encryptRSA(appKey, publicKeyPem);
  const encPassword = encryptAES(password, appKey);

  const body = {
    Data: encAppKey,
    AppKey: encAppKey,
    EncryptedPassword: encPassword,
    ForceRefreshAccessToken: false,
  };

  const res = await fetch(`${IRP_BASE}/eivital/v1.04/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...irpHeaders(),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.Status !== 1) {
    const errMsg = data.ErrorDetails?.length
      ? data.ErrorDetails.map((e) => `${e.ErrorCode}: ${e.ErrorMessage}`).join('; ')
      : 'Authentication failed';
    throw new Error(`IRP Auth Error: ${errMsg}`);
  }

  // Decrypt the AuthToken from the response
  const decrypted = decryptAES(data.Data, appKey);
  cachedToken = decrypted.AuthToken;
  tokenExpiry = Date.now() + (decrypted.TokenExpiry || 3600) * 1000 - 60000; // 1 min buffer

  console.log('✅ IRP Authenticated. Token expires:', new Date(tokenExpiry).toLocaleString());
  return cachedToken;
};

/**
 * Step 2 — Generate IRN for a GST e-Invoice payload.
 * POST /eicore/v1.04/Invoice
 * @param {object} payload - The GST INV-01 compliant JSON object.
 * @returns {object} - { Irn, AckNo, AckDt, SignedInvoice, SignedQRCode, Status }
 */
export const generateIRN = async (payload) => {
  const token = await authenticate();
  const appKey = generateSessionKey();

  const jsonStr = JSON.stringify(payload);
  const encData = encryptAES(jsonStr, appKey);
  const hmac = generateHMAC(jsonStr, appKey);

  const body = {
    Data: encData,
    Hmac: hmac,
  };

  const res = await fetch(`${IRP_BASE}/eicore/v1.04/Invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...irpHeaders(),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.Status !== 1) {
    const errors = data.ErrorDetails?.length
      ? data.ErrorDetails.map((e) => ({
          code: e.ErrorCode,
          message: e.ErrorMessage,
          messageHi: mapErrorToHindi(e.ErrorCode),
        }))
      : [{ code: 'UNKNOWN', message: data.message || 'IRN generation failed' }];
    const err = new Error('IRN generation failed');
    err.irpErrors = errors;
    throw err;
  }

  const result = decryptAES(data.Data, appKey);
  console.log('✅ IRN Generated:', result.Irn);
  return {
    irn: result.Irn,
    ackNo: result.AckNo,
    ackDt: result.AckDt,
    signedInvoice: result.SignedInvoice,
    signedQRCode: result.SignedQRCode,
    status: 'success',
  };
};

/**
 * Step 5 — Cancel an IRN (within 24 hours).
 * POST /eicore/v1.04/Invoice/Cancel
 * @param {string} irn - The 64-char IRN hash.
 * @param {number} reason - 1: Duplicate, 2: Data Entry Mistake, 3: Order Cancelled, 4: Others.
 * @param {string} remark - Cancellation remark.
 */
export const cancelIRN = async (irn, reason = 1, remark = '') => {
  const token = await authenticate();

  const body = {
    Irn: irn,
    CnlRsn: String(reason),
    CnlRem: remark || 'Cancelled by user',
  };

  const res = await fetch(`${IRP_BASE}/eicore/v1.04/Invoice/Cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...irpHeaders(),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.Status !== 1) {
    const errMsg = data.ErrorDetails?.length
      ? data.ErrorDetails.map((e) => `${e.ErrorCode}: ${e.ErrorMessage}`).join('; ')
      : 'Cancellation failed';
    throw new Error(`IRP Cancel Error: ${errMsg}`);
  }

  console.log('✅ IRN Cancelled:', irn);
  return { status: 'cancelled', irn };
};

/**
 * IRP Error Code → Hindi Translation mapping.
 */
const ERROR_MAP = {
  2150: 'खरीदार का GSTIN गलत है',
  2117: 'आपूर्तिकर्ता का GSTIN गलत है',
  2163: 'चालान संख्या पहले से मौजूद है',
  2265: 'HSN कोड अमान्य है',
  2144: 'पिन कोड अमान्य है',
  2030: 'चालान तिथि 30 दिन से अधिक पुरानी है',
};

const mapErrorToHindi = (code) => ERROR_MAP[code] || 'अज्ञात त्रुटि';
