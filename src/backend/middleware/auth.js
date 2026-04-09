import crypto from 'crypto';
import { initFirebaseFromEnv, verifyToken } from "../utils/verifyFirebaseToken.js";

const INTERNAL_SECRET = process.env.INTERNAL_SECRET;
const IS_PROD = process.env.NODE_ENV === 'production';
const DEV_NO_AUTH = !IS_PROD && process.env.DEV_NO_AUTH === 'true';

/**
 * Timing-safe string comparison
 */
function safeCompare(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Authentication Middleware
 * Supports:
 * 1. Internal Secret (x-internal-secret header)
 * 2. Developer No-Auth mode (DEV_NO_AUTH=true)
 * 3. Firebase ID Token (Authorization: Bearer <token>)
 */
export async function authMiddleware(req, res, next) {
  // 1. Internal secret bypass (Header: x-internal-secret)
  if (req.headers["x-internal-secret"] && INTERNAL_SECRET && safeCompare(req.headers["x-internal-secret"], INTERNAL_SECRET)) {
    req.isInternal = true;
    return next();
  }

  // 2. Dev no-auth override
  if (DEV_NO_AUTH) {
    req.isDevNoAuth = true;
    // Prioritize UID from body, then params, then fallback to a mock
    req.user = { 
      uid: req.body?.uid || req.params?.uid || `dev-${Math.random().toString(36).slice(2, 6)}`,
      role: req.body?.role || "admin" // Default to admin for dev ease
    };
    return next();
  }

  // 3. Normal bearer token flow
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "error", message: "Missing Authorization Bearer token" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    // Ensure Firebase is initialized
    initFirebaseFromEnv();
    
    // Verify token
    const decoded = await verifyToken(idToken);
    req.user = decoded;
    
    // Placeholder for additional role/permission checks if needed
    // if (!req.user.role) { ... }

    return next();
  } catch (err) {
    console.warn("❌ Token verification failed:", err?.message || err);
    return res.status(401).json({ status: "error", message: "Invalid or expired auth token" });
  }
}
