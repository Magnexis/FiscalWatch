import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { native } from './storage';

const treasuryResponse=z.object({data:z.array(z.object({record_date:z.string(),debt_held_public_amt:z.string(),tot_pub_debt_out_amt:z.string()})).min(1)});
export interface TreasuryDebt { date:string; debtHeldByPublicBillions:number; totalDebtBillions:number; source:string; retrievedAt:string; }

/** Native-only adapter; browser preview intentionally has no third-party calls. */
export async function refreshTreasuryDebt():Promise<TreasuryDebt> {
  if(!native) throw new Error('Official refresh is available in the installed desktop application.');
  const raw:unknown=await invoke('fetch_treasury_debt');
  const first=treasuryResponse.parse(raw).data[0];
  const publicDebt=Number(first.debt_held_public_amt)/1_000_000_000;
  const totalDebt=Number(first.tot_pub_debt_out_amt)/1_000_000_000;
  if(!Number.isFinite(publicDebt)||!Number.isFinite(totalDebt)) throw new Error('Treasury returned an unusable debt value.');
  return {date:first.record_date,debtHeldByPublicBillions:publicDebt,totalDebtBillions:totalDebt,
    source:'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny',retrievedAt:new Date().toISOString()};
}

export const US_PROFILE={
  country:'United States', currency:'USD', fiscalYear:'October 1 – September 30',
  definitions:'Treasury debt held by the public is distinct from total public debt outstanding. GDP, deficit, and interest measures are intentionally unavailable until their official series are retrieved and reconciled.',
  plannedSources:['Treasury FiscalData','USAspending.gov','GAO','CBO','BEA (key required)','Federal Reserve (planned)']
} as const;
