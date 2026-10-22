import { z } from 'zod';

export const opportunitySchema = z.object({
  id: z.string(), title: z.string(), agency: z.string(), action: z.string(),
  report: z.string(), source: z.url().startsWith('https://www.gao.gov/'),
  status: z.string(), statusDate: z.string(), retrieved: z.string(),
  estimate: z.string(), horizon: z.string(), estimateSource: z.url(),
  recommendation: z.string(), nextStep: z.string(), costs: z.string(),
  affected: z.string(), tradeoffs: z.string(), overlap: z.string(),
  annualVerified: z.literal(0), priority: z.enum(['First review', 'Second review', 'Hold for update'])
});
export type Opportunity = z.infer<typeof opportunitySchema>;
export const rowSchema = z.object({
  id: z.string().min(1).max(500), vendor: z.string().max(500),
  vendorId: z.string().max(500), agency: z.string().max(500),
  date: z.iso.date(), amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  category: z.string().max(20000), invoice: z.string().max(500),
  kind: z.enum(['contract', 'grant', 'payment']),
  metric: z.enum(['payment', 'award-obligation']),
  source: z.url().startsWith('https://'), contract: z.string().max(500)
});
export type SpendingRow = z.infer<typeof rowSchema>;
export const snapshotSchema = z.object({
  schemaVersion: z.literal(1), source: z.enum(['ct', 'usaspending']),
  dataset: z.enum(['ct','usaspending-contract','usaspending-grant']),
  retrievedAt: z.iso.datetime(), query: z.string(), coverage: z.string(),
  complete: z.literal(false), rows: z.array(rowSchema).max(10000),
  warnings: z.array(z.string()), rawSha256: z.string().regex(/^[a-f0-9]{64}$/),
  hashBasis: z.enum(['raw-response', 'normalized-json'])
}).superRefine((snapshot,ctx)=>{
  const ct=snapshot.dataset==='ct';
  if ((snapshot.source==='ct')!==ct || snapshot.rows.some(r=>ct ? r.kind!=='payment'||r.metric!=='payment' : r.kind!==(snapshot.dataset==='usaspending-grant'?'grant':'contract')||r.metric!=='award-obligation')) {
    ctx.addIssue({code:'custom',message:'Dataset, source, row kind and financial metric must agree'});
  }
});
export type Snapshot = z.infer<typeof snapshotSchema>;
export const reviewSchema = z.object({
  id: z.string().min(1).max(120),
  stage: z.enum(['Research', 'Awaiting response', 'Adopted', 'Closed']),
  note: z.string().max(10000), evidence: z.union([z.literal(''), z.url().startsWith('https://')]),
  updatedAt: z.iso.datetime()
});
export type Review = z.infer<typeof reviewSchema>;
export interface BudgetOption {
  id: string; title: string; source: string; low: number; high: number;
  group: string; effects: string; costs: string; tradeoffs: string; annual: number[];
}

/** Decimal strings are parsed to integer cents; floating-point money is not aggregated. */
export function cents(value: string): bigint {
  if (!/^-?\d+(\.\d{1,2})?$/.test(value)) throw new Error('Invalid monetary value');
  const negative = value.startsWith('-');
  const [whole, fraction = ''] = value.replace('-', '').split('.');
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return negative ? -result : result;
}
export function money(value: bigint): string {
  const sign = value < 0n ? '-' : '';
  const n = value < 0n ? -value : value;
  return `${sign}$${(n / 100n).toLocaleString('en-US')}.${String(n % 100n).padStart(2, '0')}`;
}
export function analyze(rows: SpendingRow[]) {
  const unique = new Map<string, SpendingRow>();
  let repeated = 0;
  for (const row of rows) {
    if (unique.has(row.id)) {
      if (JSON.stringify(unique.get(row.id)) !== JSON.stringify(row)) throw new Error(`Conflicting duplicate ID: ${row.id}`);
      repeated++;
    } else unique.set(row.id, row);
  }
  const vendors = new Map<string, { name: string; amount: bigint; count: number }>();
  let total = 0n, positive = 0n, credits = 0n;
  const candidates = new Map<string, SpendingRow[]>();
  for (const row of unique.values()) {
    const amount = cents(row.amount); total += amount;
    if (amount > 0n) positive += amount; else credits += amount;
    const protectedName = /redact|protect|withheld|anonymous|confidential/i.test(row.vendor);
    // Missing/redacted identities must not be collapsed into a fictitious single vendor.
    const vendorKey = row.vendorId && !protectedName ? row.vendorId : `unresolved:${row.id}`;
    const vendor = vendors.get(vendorKey) ?? { name: row.vendor || 'Identity unavailable', amount: 0n, count: 0 };
    if (amount > 0n) vendor.amount += amount;
    vendor.count++; vendors.set(vendorKey, vendor);
    if (row.kind === 'payment' && row.invoice && row.vendorId && !protectedName && amount > 0n) {
      const key = JSON.stringify([row.vendorId, row.agency, row.date, row.invoice, row.amount]);
      candidates.set(key, [...(candidates.get(key) ?? []), row]);
    }
  }
  return { total, positive, credits, repeated, count: unique.size,
    vendors: [...vendors.values()].sort((a, b) => a.amount > b.amount ? -1 : a.amount < b.amount ? 1 : 0),
    candidates: [...candidates.values()].filter(group => group.length > 1)
  };
}
export function validatePortfolio(options: BudgetOption[]): string | null {
  if (new Set(options.map(o => o.id)).size !== options.length) return 'An option was selected more than once.';
  const groups = options.map(o => o.group);
  return new Set(groups).size !== groups.length ? 'Overlapping alternatives cannot be added together.' : null;
}
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
