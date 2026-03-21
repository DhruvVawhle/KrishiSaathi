// src/backend/utils/verifyFirebaseToken.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let initialized = false;

// Initialize admin SDK if service account present in env or path
export function initFirebaseFromEnv() {
  if (initialized) return initialized;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (raw) {
      const sa = JSON.parse(raw);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      initialized = true;
      console.log("✅ Firebase Admin initialized from env JSON");
    } else if (p) {
      const keyPath = path.resolve(process.cwd(), p);
      if (fs.existsSync(keyPath)) {
        const saRaw = fs.readFileSync(keyPath, "utf8");
        const sa = JSON.parse(saRaw);
        admin.initializeApp({ credential: admin.credential.cert(sa) });
        initialized = true;
        console.log("✅ Firebase Admin initialized from file:", keyPath);
      }
    }
  } catch (err) {
    console.warn("⚠️ Firebase init error:", err?.message || err);
    initialized = false;
  }
  return initialized;
}

export const isFirebaseInitialized = () => initialized;

export async function verifyToken(idToken) {
  if (!initialized) throw new Error("Firebase Admin not initialized");
  return admin.auth().verifyIdToken(idToken);
}
