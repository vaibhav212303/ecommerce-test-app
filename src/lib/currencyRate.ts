// Utility to fetch live currency rates with 60-seconds cache
// Usage: await getConversionRate('USD', 'EUR')

let cachedRates: Record<string, { rate: number; timestamp: number }> = {};

export async function getConversionRate(from: string, to: string): Promise<number> {
  const key = `${from}_${to}`;
  const now = Date.now();
  if (cachedRates[key] && now - cachedRates[key].timestamp < 20_000) {
    return cachedRates[key].rate;
  }
  // Always call our API proxy, which handles local/remote automatically
  const url = `/api/liverate?base=${from}&symbols=${to}`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('LiveRateAPI fetch failed');
  const data = await response.json();
  const rate = data.rates?.[to];
  if (!rate) throw new Error('Invalid currency data');
  cachedRates[key] = { rate, timestamp: now };
  return rate;
}
