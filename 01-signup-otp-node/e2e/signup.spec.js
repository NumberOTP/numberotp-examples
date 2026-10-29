// End-to-end: buy a real number from NumberOTP, sign up with it in the demo app, receive the SMS through the
// NumberOTP API and type the code in. Needs NOTP_API_KEY and an SMS transport that really sends (SMS_TRANSPORT=twilio).
// If no SMS arrives, the number is canceled, which refunds it.
import { test, expect } from '@playwright/test'
import { NumberOTP, ActivationClosedError, WaitTimeoutError } from 'numberotp'
import { maxPriceAllowed, record } from './spend-guard.js'

const SERVICE = 'ot' // "Any other": receives SMS from any sender, including our own demo app
const COUNTRY = process.env.DEMO_COUNTRY ?? '187' // NumberOTP country id (187 = United States)

test.skip(!process.env.NOTP_API_KEY, 'NOTP_API_KEY is not set')
test.skip(process.env.SMS_TRANSPORT !== 'twilio', 'the demo app must send real SMS (SMS_TRANSPORT=twilio)')

test('sign up with a NumberOTP number and verify the SMS code', async ({ page }) => {
  test.setTimeout(10 * 60_000)
  const notp = new NumberOTP()

  const created = await notp.activations.create({ service: SERVICE, country: COUNTRY, max_price: maxPriceAllowed() })
  const { id, phoneNumber } = created.data
  const cost = (await notp.activations.get(id)).data.cost
  record('buy', id, cost, `${SERVICE}/${COUNTRY}`)

  try {
    await page.goto('/')
    await page.getByLabel('Phone number').fill(phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`)
    await page.getByRole('button', { name: 'Send code' }).click()
    await expect(page.getByRole('status')).toHaveText(/Code sent/)

    const act = await notp.activations.waitForCode(id, { timeout: '5m' })
    expect(act.otp).toMatch(/^\d{6}$/)

    await page.getByLabel('Verification code').fill(act.otp)
    await page.getByRole('button', { name: 'Verify' }).click()
    await expect(page.getByRole('status')).toHaveText('Phone verified. Your account is ready.')

    await notp.activations.finish(id)
  } catch (e) {
    if (e instanceof ActivationClosedError) {
      record('refund', id, cost, 'closed without SMS')
    } else {
      await notp.activations.cancel(id).then(() => record('refund', id, cost, 'canceled'), () => {})
    }
    if (e instanceof WaitTimeoutError) throw new Error('No SMS arrived within 5 minutes; the number was canceled and refunded')
    throw e
  }
})
