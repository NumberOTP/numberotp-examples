// A minimal sign-up flow with phone verification: enter a number, receive a 6-digit code by SMS, confirm it.
import express from 'express'
import { fileURLToPath } from 'node:url'
import { OtpStore, OtpError } from './otp.js'
import { createSender } from './sms.js'

export function createApp({ store = new OtpStore(), send = createSender() } = {}) {
  const app = express()
  app.use(express.json())
  app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))))

  app.post('/api/send-code', async (req, res) => {
    const phone = String(req.body?.phone ?? '').replace(/[\s()-]/g, '')
    try {
      const code = store.issue(phone)
      await send(phone, `Your Demo App code is ${code}. It expires in 5 minutes.`)
      res.json({ ok: true })
    } catch (e) {
      res.status(e instanceof OtpError ? 400 : 502).json({ ok: false, error: e.message })
    }
  })

  app.post('/api/verify', (req, res) => {
    const phone = String(req.body?.phone ?? '').replace(/[\s()-]/g, '')
    try {
      const ok = store.verify(phone, String(req.body?.code ?? '').trim())
      res.status(ok ? 200 : 400).json(ok ? { ok: true } : { ok: false, error: 'Wrong code' })
    } catch (e) {
      res.status(400).json({ ok: false, error: e.message })
    }
  })

  return app
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000)
  createApp().listen(port, () => console.log(`Demo app on http://localhost:${port}`))
}
