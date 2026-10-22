import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { snapshotSchema, type Snapshot, type SpendingRow } from './model';
const scalar = z.union([z.string(),z.number()]).transform(String);
const rawRows = z.array(z.record(z.string(),z.unknown())).max(10000);
function str(value: unknown): string { return value == null ? '' : scalar.parse(value); }
async function digest(text: string): Promise<string> {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function dollars(value: unknown): string {
  const text=str(value);
  if (!/^-?\d+(\.\d{1,2})?$/.test(text)) throw new Error('Source amount missing or not precise to cents');
  return text;
}
export async function refresh(source:'ct'|'usaspending',year:number,kind:'contract'|'grant'): Promise<Snapshot> {
  const raw: unknown=await invoke('fetch_public_data',{request:{source,year,kind}});
  const serialized=JSON.stringify(raw);
  const records=rawRows.parse(source==='ct'?raw:z.object({results:rawRows}).parse(raw).results);
  const rows: SpendingRow[]=await Promise.all(records.map(async r=>source==='ct'?{
    id:'ct:'+await digest(JSON.stringify(['fiscal_year','payment_id','invoice_id','invoice_line_number','invoice_line_distribution_number','account','fund_code'].map(k=>str(r[k])))),
    vendor:str(r.vendor),vendorId:str(r.vendor_id),agency:str(r.department),date:str(r.payment_date).slice(0,10),
    amount:dollars(r.amount),category:str(r.expense_category),invoice:str(r.invoice_id),kind:'payment' as const,metric:'payment' as const,
    source:'https://data.ct.gov/resource/ajdm-rvz7.json',contract:str(r.contract_number)
  }:{
    id:'usa:'+z.string().min(1).parse(r.generated_internal_id),vendor:str(r['Recipient Name']),vendorId:str(r['Recipient UEI']),
    agency:str(r['Awarding Agency']),date:str(r['Base Obligation Date']||r['Start Date']).slice(0,10),amount:dollars(r['Award Amount']),
    category:str(r.Description),invoice:'',kind,metric:'award-obligation' as const,contract:str(r['Award ID']),
    source:'https://www.usaspending.gov/award/'+encodeURIComponent(str(r.generated_internal_id))
  }));
  return snapshotSchema.parse({schemaVersion:1,source,dataset:source==='ct'?'ct':`usaspending-${kind}`,retrievedAt:new Date().toISOString(),
    query:source==='ct'?`fiscal_year=${year}; limit=1000; ordered payment_date DESC,payment_id,invoice_id,invoice_line_number,invoice_line_distribution_number,account,fund_code`:
      `FY${year} (${year-1}-10-01 through ${year}-09-30); CT place of performance; ${kind}; first page; limit=100; sort Award Amount desc`,
    coverage:source==='ct'?`CT FY${year}; latest 1000 distribution rows, not representative or complete.`:`Federal FY${year}; top 100 CT ${kind} awards in the search date filter, not complete.`,
    complete:false,rows,rawSha256:await digest(serialized),hashBasis:'normalized-json',warnings:source==='ct'?[
      'Payment-distribution lines can share invoice and payment IDs. Similarity requires document review.',
      'Agency labels and protected payee redactions are preserved as supplied.'
    ]:['Award amounts are award-level obligations, not payments or necessarily obligations within the date filter.',
      'Do not add these amounts to CT payments or extrapolate the ranked sample.'],
  });
}
