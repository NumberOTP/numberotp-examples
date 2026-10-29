# 01 · Sign-up with SMS verification, tested end to end (Node.js)

A small sign-up page that confirms a phone number with a 6-digit SMS code, and a Playwright test that checks the
whole flow with a real number from [NumberOTP](https://www.numberotp.com/?utm_source=github&utm_medium=examples&utm_campaign=01-signup-otp-node).

What it shows:

- **The app** (`src/`): codes are 6 random digits, stored only as a SHA-256 hash, valid for 5 minutes, locked after
  5 wrong tries, with a 30-second resend cooldown. Phone numbers must be E.164 (`+447700900123`).
- **Unit tests** (`test/`): the rules above plus the HTTP flow, with no network and no SMS. These run in CI.
- **End-to-end test** (`e2e/`): buys a number with the [`numberotp`](https://www.npmjs.com/package/numberotp) SDK,
  signs up with it in a real browser, waits for the SMS through the API, types the code and checks the account is
  verified. If no SMS arrives the number is canceled, which refunds it.

## Run the app

```bash
npm install
npm start            # http://localhost:3000, SMS printed to the terminal (SMS_TRANSPORT=console)
npm test             # unit tests
```

## Run the end-to-end test

You need a NumberOTP API key ([Dashboard → Developer](https://www.numberotp.com/dashboard/developer)) and an account
with an SMS provider so the app can send real messages. This example uses Twilio's REST API; swap `src/sms.js` for
your own provider.

```bash
cp .env.example .env   # fill in the values
npx playwright install chromium
set -a; . ./.env; set +a
npm run test:e2e
```

The test buys a number for the **Any other** service (`ot`), which receives SMS from any sender. Each run costs one
number; the spend guard in `e2e/spend-guard.js` keeps a ledger in `~/.numberotp-demo/` and stops at
`DEMO_MAX_USD_PER_DAY` (default `$5`). Retries are off on purpose, since each retry buys another number.

## Use it responsibly

Test your own sign-up flows with this. Use NumberOTP for your own accounts and follow each platform's terms; some
platforms don't allow virtual numbers. A number usually receives its SMS, and if it doesn't, it's refunded.
