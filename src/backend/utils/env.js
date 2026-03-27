import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 💡 CENTRALIZED ENV LOADER
 * This module ensures .env files are loaded before any other module executes,
 * preventing race conditions in ES module top-level constant initialization.
 */

function loadEnv() {
  // 1. Try project root .env (for shared vars like MONGODB_URI, data.gov keys)
  const rootEnv = path.resolve(__dirname, "../../../.env");
  if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
  }

  // 2. Try src/backend/.env (for service-specific vars like DEV_NO_AUTH, USER_PORT)
  const backendEnv = path.resolve(__dirname, "../.env");
  if (fs.existsSync(backendEnv)) {
    // We don't want to override root env vars if they exist, but backend .env usually has more specific overrides
    dotenv.config({ path: backendEnv, override: true });
  }
}

loadEnv();

export default process.env;
