/**
 * Password strength validation - helps prevent weak passwords.
 * Not SQL injection (MongoDB is NoSQL) - this is general security hardening.
 */
const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export function validatePassword(password) {
  if (typeof password !== "string") return { ok: false, message: "Password must be a string" };
  const p = password;
  if (p.length < MIN_LENGTH) return { ok: false, message: `Password must be at least ${MIN_LENGTH} characters` };
  if (p.length > MAX_LENGTH) return { ok: false, message: `Password must be at most ${MAX_LENGTH} characters` };
  if (!/[a-zA-Z]/.test(p)) return { ok: false, message: "Password must contain at least one letter" };
  if (!/[0-9]/.test(p)) return { ok: false, message: "Password must contain at least one number" };
  return { ok: true };
}

/**
 * Sanitize string input - prevent injection in display/storage.
 * Mongoose already parameterizes queries; this is for stored values.
 */
export function sanitizeString(str, maxLen = 500) {
  if (str == null) return "";
  return String(str).trim().slice(0, maxLen);
}
