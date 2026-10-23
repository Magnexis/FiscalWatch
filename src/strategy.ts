import type { FiscalScenario, ScenarioPoint } from './model';

export type Trajectory = 'Improving' | 'Stabilizing' | 'Rising pressure';
export interface DebtStrategy {
  trajectory: Trajectory;
  changeInDebtRatio: number;
  finalDebtRatio: number;
  actions: Array<{ title: string; detail: string; destination: 'Debt scenarios' | 'Opportunity registry' | 'Reporting & methods' }>;
}

/**
 * Converts a disclosed scenario into a research agenda. It deliberately does
 * not score policy quality, estimate adoption, or claim that any action will
 * reduce debt. The scenario's own assumptions remain the only inputs.
 */
export function buildDebtStrategy(scenario: FiscalScenario, points: ScenarioPoint[]): DebtStrategy {
  const first=points[0]; const last=points.at(-1) ?? first;
  const changeInDebtRatio=last.debtToGdp-first.debtToGdp;
  const trajectory:Trajectory=changeInDebtRatio < -.02 ? 'Improving' : changeInDebtRatio <= .02 ? 'Stabilizing' : 'Rising pressure';
  const actions=[
    {title:'Stress-test the assumptions',detail:`Test lower growth and higher interest-rate cases than the current ${scenario.name} assumptions before treating its result as decision-ready.`,destination:'Debt scenarios' as const},
    {title:'Separate evidence from estimates',detail:'Move only source-backed opportunities through the review ledger; potential effects and historical scores are not realized debt reduction.',destination:'Opportunity registry' as const},
    {title:'Document the fiscal case',detail:'Publish definitions, timing, implementation costs, overlaps, and distributional tradeoffs alongside any proposed measure.',destination:'Reporting & methods' as const}
  ];
  return {trajectory,changeInDebtRatio,finalDebtRatio:last.debtToGdp,actions};
}
