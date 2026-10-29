// Sends the verification SMS. SMS_TRANSPORT=twilio sends a real message through the Twilio REST API;
// SMS_TRANSPORT=console (the default) only prints it, for working on the app without sending anything.

export function createSender(env = process.env) {
  const transport = env.SMS_TRANSPORT ?? 'console'
  if (transport === 'console') {
    return async (to, body) => {
      console.log(`[sms] to ${to}: ${body}`)
      return { id: 'console' }
    }
  }
  if (transport === 'twilio') {
    const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = env
    if (!sid || !token || !from) throw new Error('Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM')
    return async (to, body) => {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(`SMS not sent (${res.status}): ${json.message ?? 'unknown error'}`)
      return { id: json.sid }
    }
  }
  throw new Error(`Unknown SMS_TRANSPORT "${transport}" (use console or twilio)`)
}
