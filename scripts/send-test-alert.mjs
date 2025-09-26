// Small helper script to test the alerts-webhook from your machine.
// Usage (PowerShell):
//   node ./scripts/send-test-alert.mjs
// Required env vars:
//   ALERTS_WEBHOOK_URL  -> https://<project>.functions.supabase.co/alerts-webhook
//   ALERTS_WEBHOOK_SECRET -> same value stored in Supabase secrets

import crypto from 'node:crypto';

const url = process.env.ALERTS_WEBHOOK_URL;
const secret = process.env.ALERTS_WEBHOOK_SECRET;

if (!url || !secret) {
  console.error('Missing env. Please set ALERTS_WEBHOOK_URL and ALERTS_WEBHOOK_SECRET');
  process.exit(1);
}

// Build a sample payload; adjust user_id to your authenticated Supabase user (or null for global)
const body = {
  external_id: `local-test-${Date.now()}`,
  user_id: null, // set to a UUID string to scope to a specific user
  symbol: 'INFY',
  title: 'Test alert from local script',
  summary: 'This is a smoke test alert to validate webhook pipeline',
  full_summary: 'End-to-end test payload created locally to verify webhook signing, DB upsert, and realtime UI.',
  action: 'buy',
  priority: 'high',
  confidence: 'medium',
  last_price: 1540.25,
  change_pct: 1.2,
  source: 'local-script',
  category: 'signal',
  payload: { sources: [{ title: 'Local generator', url: 'https://example.com' }] }
};

const json = JSON.stringify(body);
const hmac = crypto.createHmac('sha256', secret).update(json).digest('hex');

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Signature': hmac,
  },
  body: json,
});

console.log('Status:', res.status);
const text = await res.text();
console.log('Body:', text);
