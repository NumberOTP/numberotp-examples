import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OtpStore, isE164, CODE_TTL_MS, MAX_ATTEMPTS, RESEND_COOLDOWN_MS } from '../src/otp.js'
import { createApp } from '../src/server.js'

const clock = () => {
  let t = 1_000_000
  return { now: () => t, tick: (ms) => (t += ms) }
}

test('E.164 validation', () => {
  assert.ok(isE164('+447700900123'))
  assert.ok(isE164('+12025550123'))
  for (const bad of ['447700900123', '+0123456789', '+12', '+1202555012345678', '+1 202 555 0123']) assert.ok(!isE164(bad), bad)
})

test('a code verifies once', () => {
  const s = new OtpStore()
  const code = s.issue('+447700900123')
  assert.match(code, /^\d{6}$/)
  assert.equal(s.verify('+447700900123', code), true)
  assert.throws(() => s.verify('+447700900123', code), { code: 'NO_CODE' })
})

test('codes expire', () => {
  const c = clock()
  const s = new OtpStore({ now: c.now })
  const code = s.issue('+447700900123')
  c.tick(CODE_TTL_MS + 1)
  assert.throws(() => s.verify('+447700900123', code), { code: 'EXPIRED' })
})

test('wrong guesses lock the code', () => {
  const s = new OtpStore()
  const code = s.issue('+447700900123')
  const wrong = code === '000000' ? '111111' : '000000'
  for (let i = 0; i < MAX_ATTEMPTS; i++) assert.equal(s.verify('+447700900123', wrong), false)
  assert.throws(() => s.verify('+447700900123', code), { code: 'LOCKED' })
})

test('resend cooldown', () => {
  const c = clock()
  const s = new OtpStore({ now: c.now })
  s.issue('+447700900123')
  assert.throws(() => s.issue('+447700900123'), { code: 'TOO_SOON' })
  c.tick(RESEND_COOLDOWN_MS)
  assert.doesNotThrow(() => s.issue('+447700900123'))
})

test('HTTP flow: send, wrong code, right code', async () => {
  const sent = []
  const app = createApp({ send: async (to, body) => sent.push({ to, body }) })
  const server = app.listen(0)
  const base = `http://localhost:${server.address().port}`
  const post = (p, b) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
  try {
    assert.equal((await post('/api/send-code', { phone: '12345' })).status, 400)
    assert.equal((await post('/api/send-code', { phone: '+44 7700 900123' })).status, 200)
    const code = sent[0].body.match(/\d{6}/)[0]
    assert.equal(sent[0].to, '+447700900123')
    assert.equal((await post('/api/verify', { phone: '+447700900123', code: code === '999999' ? '000000' : '999999' })).status, 400)
    assert.equal((await post('/api/verify', { phone: '+447700900123', code })).status, 200)
  } finally {
    server.close()
  }
})
