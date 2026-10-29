// One-time codes for phone verification: generate, store hashed, check with expiry, attempt and resend limits.
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'

export const CODE_TTL_MS = 5 * 60_000
export const MAX_ATTEMPTS = 5
export const RESEND_COOLDOWN_MS = 30_000

// E.164: a plus sign, then 8 to 15 digits, first digit not zero.
export const isE164 = (phone) => /^\+[1-9]\d{7,14}$/.test(phone)

const hash = (code) => createHash('sha256').update(code).digest()

export class OtpStore {
  constructor({ now = () => Date.now() } = {}) {
    this.now = now
    this.entries = new Map() // phone -> { hash, expiresAt, attempts, sentAt }
  }

  /** Creates a new 6-digit code for the phone, or throws if one was sent too recently. */
  issue(phone) {
    if (!isE164(phone)) throw new OtpError('INVALID_PHONE', 'Enter the number in international format, e.g. +447700900123')
    const prev = this.entries.get(phone)
    if (prev && this.now() - prev.sentAt < RESEND_COOLDOWN_MS) {
      throw new OtpError('TOO_SOON', 'Wait a few seconds before asking for another code')
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    this.entries.set(phone, { hash: hash(code), expiresAt: this.now() + CODE_TTL_MS, attempts: 0, sentAt: this.now() })
    return code
  }

  /** True once, for the right code within its lifetime; every wrong guess counts toward MAX_ATTEMPTS. */
  verify(phone, code) {
    const e = this.entries.get(phone)
    if (!e) throw new OtpError('NO_CODE', 'Ask for a code first')
    if (this.now() > e.expiresAt) {
      this.entries.delete(phone)
      throw new OtpError('EXPIRED', 'That code has expired, ask for a new one')
    }
    if (e.attempts >= MAX_ATTEMPTS) {
      this.entries.delete(phone)
      throw new OtpError('LOCKED', 'Too many wrong codes, ask for a new one')
    }
    e.attempts++
    const ok = /^\d{6}$/.test(String(code)) && timingSafeEqual(hash(String(code)), e.hash)
    if (ok) this.entries.delete(phone)
    return ok
  }
}

export class OtpError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}
