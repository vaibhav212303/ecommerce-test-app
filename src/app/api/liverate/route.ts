// Proxy API to call Exchangerate-API securely with key
// Usage: /api/liverate?base=USD&symbols=EUR,GBP
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = 'c852156ad8917d59ebee1257';
const SUPPORTED = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD']; // Expand as needed

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const base = searchParams.get('base') || 'USD';
  let symbols = searchParams.get('symbols') || SUPPORTED.join(',');

  // Validate base
  if (!SUPPORTED.includes(base)) {
    console.warn(`[liverate] Invalid base currency: ${base}`);
    return NextResponse.json({ error: 'Unsupported base currency' }, { status: 400 });
  }

  // Validate symbols
  const reqSymbols = symbols.split(',').map(s => s.trim());
  const invalids = reqSymbols.filter(s => !SUPPORTED.includes(s));
  if (invalids.length > 0) {
    console.warn(`[liverate] Invalid symbols requested: ${invalids.join(',')}`);
    return NextResponse.json({ error: 'One or more unsupported currency codes', invalid: invalids }, { status: 400 });
  }
  const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${base}`;
  console.log(`[liverate] Fetching rates for base ${base}, symbols: ${reqSymbols.join(',')}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[liverate] Exchangerate fetch failed: ${res.status}`);
    return NextResponse.json({ error: 'Failed to fetch live rates' }, { status: 500 });
  }
  const data = await res.json();
  let rates = data.conversion_rates || {};
  // Only pick requested
  const filtered: Record<string, number> = {};
  for (const sym of reqSymbols) {
    if (rates[sym]) filtered[sym] = rates[sym];
  }
  return NextResponse.json({ base, rates: filtered });
}
