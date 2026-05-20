/**
 * Input validation helpers.
 *
 * The parcel ID is used directly as an Appwrite document ID. Appwrite
 * document IDs are restricted to [A-Za-z0-9_-] and a maximum length of
 * 36 characters. We intentionally validate slightly more strictly than
 * Appwrite to reduce the attack surface for enumeration / abuse.
 */

const PARCEL_ID_MIN = 8;
const PARCEL_ID_MAX = 20;
const PARCEL_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * Returns `{ valid, value, error }`.
 *
 * - `valid` (boolean) — whether the input is acceptable.
 * - `value` (string) — the trimmed, sanitized value (only set when valid).
 * - `error` (string) — a user-facing error message (only set when invalid).
 *
 * Never throws; safe to call with arbitrary input including `null`,
 * `undefined`, numbers, or objects.
 */
function validateParcelId(input) {
  if (input === null || input === undefined) {
    return { valid: false, error: "Please enter a tracking number." };
  }
  if (typeof input !== "string") {
    return { valid: false, error: "Tracking number must be text." };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Please enter a tracking number." };
  }
  if (trimmed.length < PARCEL_ID_MIN) {
    return {
      valid: false,
      error: `Tracking number must be at least ${PARCEL_ID_MIN} characters.`,
    };
  }
  if (trimmed.length > PARCEL_ID_MAX) {
    return {
      valid: false,
      error: `Tracking number must be at most ${PARCEL_ID_MAX} characters.`,
    };
  }
  if (!PARCEL_ID_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: "Tracking number may only contain letters, numbers, '-' and '_'.",
    };
  }

  return { valid: true, value: trimmed };
}

/**
 * Convenience wrapper that returns the sanitized value or throws. Useful
 * in server-side code where you want to bail out early.
 */
function assertValidParcelId(input) {
  const result = validateParcelId(input);
  if (!result.valid) {
    const err = new Error(result.error);
    err.code = "INVALID_PARCEL_ID";
    throw err;
  }
  return result.value;
}

export {
  validateParcelId,
  assertValidParcelId,
  PARCEL_ID_MIN,
  PARCEL_ID_MAX,
  PARCEL_ID_PATTERN,
};

export default validateParcelId;
