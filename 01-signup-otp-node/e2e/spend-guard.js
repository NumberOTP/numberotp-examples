// A daily spending cap for tests that buy real numbers. Every purchase and refund is appended to a ledger
// (default ~/.numberotp-demo/ledger.jsonl, outside the repo), and buying stops once today's net spend
// would pass DEMO_MAX_USD_PER_DAY (default 5).
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const LEDGER = process.env.DEMO_LEDGER ?? join(homedir(), '.numberotp-demo', 'ledger.jsonl')
const CAP = Number(process.env.DEMO_MAX_USD_PER_DAY ?? 5)
const today = () => new Date().toISOString().slice(0, 10) // UTC day

function rows() {
  if (!existsSync(LEDGER)) return []
  return readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
}

export function spentToday() {
  return rows()
    .filter((r) => r.at.startsWith(today()))
    .reduce((sum, r) => sum + (r.type === 'buy' ? r.usd : -r.usd), 0)
}

/** The most a single number may cost right now, or throws if today's budget is used up. */
export function maxPriceAllowed(perNumber = Number(process.env.DEMO_MAX_PRICE ?? 1)) {
  const left = Math.round((CAP - spentToday()) * 100) / 100
  if (left <= 0) throw new Error(`Daily demo budget of $${CAP} is used up (spent $${spentToday().toFixed(2)} today)`)
  return Math.min(perNumber, left)
}

export function record(type, activationId, usd, note = '') {
  mkdirSync(dirname(LEDGER), { recursive: true })
  appendFileSync(LEDGER, JSON.stringify({ at: new Date().toISOString(), type, activationId, usd, note }) + '\n')
}
