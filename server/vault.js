"use strict";

/**
 * Encryption for the credential vault.
 *
 * Zina keeps every app's API keys and connection strings in one place, which is
 * only defensible if a copy of the database is not a copy of the keys. Values
 * are sealed with AES-256-GCM under ZINA_ENCRYPTION_KEY before they are stored,
 * so reading `zina_secrets` off a backup yields ciphertext.
 *
 * GCM rather than CBC because it authenticates: a tampered ciphertext fails to
 * open instead of decrypting to plausible rubbish that then gets used as a live
 * API key.
 */

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96 bits, the size GCM is specified for
const VERSION = "v1";

class VaultError extends Error {}

/**
 * The master key, as 32 raw bytes.
 *
 * Accepts either 64 hex characters or a base64 string, because a key gets typed
 * into a hosting dashboard by a person and both forms are what key generators
 * hand out. Anything else is rejected loudly — a short or malformed key must
 * not quietly become a weak one.
 */
function masterKey() {
  const raw = process.env.ZINA_ENCRYPTION_KEY || "";
  if (!raw) throw new VaultError("ZINA_ENCRYPTION_KEY is not set, so secrets can't be stored.");

  let key;
  if (/^[0-9a-f]{64}$/i.test(raw)) key = Buffer.from(raw, "hex");
  else key = Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new VaultError(
      "ZINA_ENCRYPTION_KEY must be 32 bytes — 64 hex characters, or base64 of 32 bytes."
    );
  }
  return key;
}

/** Whether the vault can be used at all. Lets the portal say so instead of erroring. */
function vaultConfigured() {
  try {
    masterKey();
    return true;
  } catch (_) {
    return false;
  }
}

/** Seal a value. Output is `v1.<iv>.<tag>.<ciphertext>`, all base64url. */
function seal(plaintext) {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), enc.toString("base64url")].join(".");
}

/** Open a sealed value. Throws if the key is wrong or the ciphertext was altered. */
function open(sealed) {
  const parts = String(sealed || "").split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new VaultError("This stored secret isn't in a format this version understands.");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  try {
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (_) {
    throw new VaultError("That secret couldn't be decrypted — the encryption key may have changed.");
  }
}

/**
 * What the portal shows in a list: enough to recognise a key, not enough to use
 * one. A short value is masked entirely rather than half-revealed, since the
 * last four characters of an eight-character secret is most of it.
 */
function mask(plaintext) {
  const value = String(plaintext || "");
  if (value.length <= 12) return "•".repeat(Math.max(value.length, 4));
  return `${value.slice(0, 4)}${"•".repeat(8)}${value.slice(-4)}`;
}

/** Generate a fresh 32-byte key, for the setup instructions. */
function generateMasterKey() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = { VaultError, vaultConfigured, seal, open, mask, generateMasterKey };
