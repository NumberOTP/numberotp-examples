# NumberOTP examples

Small, complete projects that use the [NumberOTP](https://www.numberotp.com/?utm_source=github&utm_medium=examples)
SDKs to receive SMS verification codes, mostly for testing your own sign-up and login flows. Each folder is
standalone and goes with a video on the [NumberOTP YouTube channel](https://www.youtube.com/@NumberOTP).

| Folder | Language | What it shows |
|---|---|---|
| [`01-signup-otp-node`](01-signup-otp-node) | Node.js | A sign-up page with SMS verification, plus a Playwright test that signs up with a real NumberOTP number |

SDKs: [Node / TypeScript](https://www.npmjs.com/package/numberotp) ·
[Python](https://pypi.org/project/numberotp/) ·
[Go](https://github.com/NumberOTP/numberotp-go) ·
[PHP](https://github.com/NumberOTP/numberotp-php) ·
[CLI `notp`](https://github.com/NumberOTP/notp). API docs: [numberotp.com/docs/api](https://www.numberotp.com/docs/api).

Keys go in a local `.env` file, which is gitignored. Never commit an API key.

Use NumberOTP for your own accounts and follow each platform's terms; some platforms don't allow virtual numbers.

MIT licensed.
