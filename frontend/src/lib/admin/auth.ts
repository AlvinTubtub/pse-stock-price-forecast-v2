export const SESSION_COOKIE_NAME = "forecastph_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const SECRET_KEY =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "forecastph-capstone2-secure-hmac-salt-key";

/**
 * Returns list of valid admin usernames.
 */
export function getValidUsernames(): string[] {
  return [
    process.env.ADMIN_USERNAME_1 || "admin1",
    process.env.ADMIN_USERNAME_2 || "admin2",
    process.env.ADMIN_USERNAME_3 || "admin3",
    process.env.ADMIN_USERNAME_4 || "admin4",
  ];
}

/**
 * Returns the configured admin password.
 */
export function getValidPassword(): string {
  return process.env.ADMIN_PASSWORD || "capstone2";
}

/**
 * Verifies credentials.
 */
export function verifyCredentials(username: string, password: string): boolean {
  if (!username || !password) return false;
  const validUsers = getValidUsernames();
  const validPass = getValidPassword();

  const isUserValid = validUsers.some(
    (u) => u.toLowerCase() === username.trim().toLowerCase()
  );
  const isPassValid = password.trim() === validPass.trim();

  return isUserValid && isPassValid;
}

/**
 * Helper to compute HMAC SHA-256 using standard Web Crypto API.
 */
async function computeHmacSignature(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Creates a signed session token: `${username}:${expiresAt}:${hmac}`
 */
export async function createSessionToken(username: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${username.toLowerCase().trim()}:${expiresAt}`;
  const signature = await computeHmacSignature(payload, SECRET_KEY);
  return `${payload}:${signature}`;
}

/**
 * Verifies session token and returns the username if valid.
 */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;

  try {
    const parts = token.split(":");
    if (parts.length !== 3) return null;

    const [username, expiresAtStr, providedSignature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return null; // Expired
    }

    const payload = `${username}:${expiresAtStr}`;
    const expectedSignature = await computeHmacSignature(payload, SECRET_KEY);

    if (providedSignature !== expectedSignature) {
      return null; // Signature mismatch
    }

    const validUsers = getValidUsernames();
    if (!validUsers.some((u) => u.toLowerCase() === username)) {
      return null; // Unknown user
    }

    return username;
  } catch (err) {
    console.error("[auth] Session verification error:", err);
    return null;
  }
}
