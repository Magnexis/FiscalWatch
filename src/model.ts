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
}).superRefine((review,ctx)=>{
  if(review.stage==='Adopted'&&!review.evidence)ctx.addIssue({code:'custom',message:'Adoption requires an HTTPS evidence reference',path:['evidence']});
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

/**
 * A normalized fiscal observation. Values are USD billions for the US profile
 * unless a profile explicitly says otherwise. Observations are never silently
 * mixed with model output.
 */
export const fiscalObservationSchema = z.object({
  year: z.number().int().min(1900).max(2200),
  debt: z.number().finite().nonnegative(),
  gdp: z.number().finite().positive(),
  receipts: z.number().finite().nonnegative(),
  outlays: z.number().finite().nonnegative(),
  interest: z.number().finite().nonnegative(),
  source: z.url().startsWith('https://'),
  retrievedAt: z.iso.datetime(),
  definition: z.string().min(1).max(1000),
  quality: z.enum(['official', 'official-derived'])
});
export type FiscalObservation = z.infer<typeof fiscalObservationSchema>;

export const scenarioSchema = z.object({
  name: z.string().min(1).max(80),
  years: z.number().int().min(1).max(50),
  initialDebt: z.number().finite().nonnegative(),
  initialGdp: z.number().finite().positive(),
  nominalGdpGrowth: z.number().finite().min(-0.5).max(1),
  interestRate: z.number().finite().min(-0.1).max(1),
  primaryBalanceShareGdp: z.number().finite().min(-1).max(1),
  fiscalAdjustmentShareGdp: z.number().finite().min(-1).max(1)
});
export type FiscalScenario = z.infer<typeof scenarioSchema>;
export interface ScenarioPoint { year: number; debt: number; gdp: number; debtToGdp: number; interest: number; primaryBalance: number; }

/**
 * Illustrative debt dynamics: D(t+1)=D(t)(1+r)-primary balance+adjustment.
 * Positive primary balance and fiscal adjustment reduce borrowing. This is a
 * deterministic accounting illustration, not an official forecast.
 */
export function projectDebt(input: FiscalScenario): ScenarioPoint[] {
  const scenario = scenarioSchema.parse(input);
  let debt=scenario.initialDebt, gdp=scenario.initialGdp;
  return Array.from({length:scenario.years+1},(_,i)=>{
    const primaryBalance=gdp*scenario.primaryBalanceShareGdp;
    const adjustment=gdp*scenario.fiscalAdjustmentShareGdp;
    const interest=debt*scenario.interestRate;
    const point={year:i,debt,gdp,debtToGdp:debt/gdp,interest,primaryBalance};
    debt=Math.max(0,debt+interest-primaryBalance-adjustment);
    gdp=gdp*(1+scenario.nominalGdpGrowth);
    return point;
  });
}

export function deficit(observation: FiscalObservation): number { return observation.outlays-observation.receipts; }
export function debtRatio(observation: FiscalObservation): number { return observation.debt/observation.gdp; }

export type ReadinessLevel = 'Ready to inspect' | 'Needs fresh source' | 'Needs independent review';
export interface WorkstreamReadiness { level: ReadinessLevel; detail: string; action: string; }

/** Converts evidence state into a transparent work queue, never a performance score. */
export function workstreamReadiness(input: { hasSnapshot: boolean; candidateGroups: number; registryCount: number; hasTreasuryDebt: boolean; }): WorkstreamReadiness[] {
  return [
    input.hasTreasuryDebt
      ? {level:'Ready to inspect',detail:'A current Treasury debt observation is saved for this session.',action:'Compare the definition and date before citing it.'}
      : {level:'Needs fresh source',detail:'No current Treasury observation has been retrieved in this session.',action:'Refresh Treasury debt from the command center.'},
    input.hasSnapshot
      ? {level: input.candidateGroups > 0 ? 'Ready to inspect' : 'Needs independent review',detail: input.candidateGroups > 0 ? `${input.candidateGroups} candidate invoice groups need document review.` : 'Saved extracts contain no repeat candidates under the current rule.',action:'Open spending intelligence and review provenance before drawing conclusions.'}
      : {level:'Needs fresh source',detail:'No local spending extract has been saved.',action:'Refresh one bounded official extract.'},
    input.registryCount > 0
      ? {level:'Needs independent review',detail:`${input.registryCount} local opportunity record${input.registryCount===1?'':'s'} need source and methodology review.`,action:'Record evidence and a review stage in the opportunity registry.'}
      : {level:'Needs fresh source',detail:'No local opportunities have been added.',action:'Add a source-backed opportunity record.'}
  ];
}

export const registryEntrySchema = z.object({
  id: z.string().min(1).max(120), title: z.string().min(1).max(500), agency: z.string().min(1).max(500),
  status: z.enum(['Published', 'Estimated', 'Approved', 'Implemented', 'Independently verified']),
  potentialEffect: z.string().max(500), evidenceUrl: z.url().startsWith('https://'),
  methodologyNote: z.string().max(5000), overlapGroup: z.string().max(120), updatedAt: z.iso.datetime()
}).superRefine((entry,ctx)=>{
  if(entry.status==='Independently verified' && !entry.methodologyNote.trim()) ctx.addIssue({code:'custom',message:'Independently verified entries require methodological notes.',path:['methodologyNote']});
});
export type RegistryEntry = z.infer<typeof registryEntrySchema>;
