import type { Opportunity, BudgetOption } from './model';
export const opportunities: Opportunity[] = [
  {
    id: 'GAO-16-189-M1', title: 'Medicare payments by place of service', agency: 'Congress / HHS',
    action: 'Matter for congressional consideration', report: 'GAO-16-189',
    source: 'https://www.gao.gov/products/gao-16-189',
    status: 'Open – Partially Addressed', statusDate: 'GAO comments through February 2026; includes November 2025 CMS rule', retrieved: '2026-10-22',
    estimate: '$156.9 billion', horizon: '2025–2034; historical CBO broad alternative',
    estimateSource: 'https://www.cbo.gov/budget-options/60908',
    recommendation: 'Review remaining authority to equalize clinically comparable outpatient payments across settings.',
    nextStep: 'Request a current CBO score net of enacted laws and CMS rules, with rural access and beneficiary cost-sharing analysis.',
    costs: 'Implementation, transition support, and any targeted hospital protections require a fresh score; not separately quantified here.',
    affected: 'Medicare beneficiaries, physician practices, hospitals, and rural or safety-net providers.',
    tradeoffs: 'Could reduce incentives to relocate routine services into higher-paid settings. Lower provider revenue could affect access; phase-in and service-level exceptions need evaluation.',
    overlap: 'Do not add the broad CBO alternative to narrower imaging or drug-administration alternatives. Do not count already implemented policies again.',
    annualVerified: 0, priority: 'First review'
  },
  {
    id: 'GAO-25-107497-R2', title: 'Evaluate VA–DOD health care sharing', agency: 'Department of Veterans Affairs',
    action: 'Executive recommendation 2', report: 'GAO-25-107497',
    source: 'https://www.gao.gov/products/gao-25-107497', status: 'Open',
    statusDate: 'Published status includes planned FY2027 Q3 performance review', retrieved: '2026-10-22',
    estimate: 'Tens of millions of dollars', horizon: 'Annually; qualitative potential in GAO 2026 annual report',
    estimateSource: 'https://www.gao.gov/products/gao-26-108505',
    recommendation: 'Evaluate sharing agreements against performance goals and use findings to improve delivery.',
    nextStep: 'Request evaluation design, referral volumes, marginal costs and access metrics; assess a small facility pilot.',
    costs: 'Data collection, coordination and evaluation costs are unquantified; do not assume they are zero.',
    affected: 'Veterans, servicemembers, their families, and participating VA and DOD facilities.',
    tradeoffs: 'Sharing could improve access and utilization, but capacity, travel burden and continuity of care constrain expansion.',
    overlap: 'Report net federal costs across both departments; interagency reimbursements alone are transfers, not savings.',
    annualVerified: 0, priority: 'First review'
  },
  {
    id: 'GAO-26-108018-R1', title: 'Evaluate nuclear waste classification options', agency: 'DOE Office of Environmental Management',
    action: 'Executive recommendation 1', report: 'GAO-26-108018',
    source: 'https://www.gao.gov/products/gao-26-108018', status: 'Open',
    statusDate: 'August 2026 agency implementation assertion; GAO requests supporting evidence', retrieved: '2026-10-22',
    estimate: '$73–210 billion', horizon: 'Lifecycle scenario in a 2020 DOE study cited by GAO; no annual profile',
    estimateSource: 'https://www.gao.gov/products/gao-26-108018',
    recommendation: 'Systematically assess lawful, safe treatment alternatives and communicate results and barriers to Congress.',
    nextStep: 'Obtain DOE evaluation evidence and independent technical review before endorsing any disposal change.',
    costs: 'Lifecycle modeling, treatment facilities, transport, monitoring and litigation risks need scenario-level costing.',
    affected: 'Cleanup workers, nearby communities, Tribal nations, receiving jurisdictions and taxpayers.',
    tradeoffs: 'Potentially faster cleanup must satisfy safety and environmental requirements, consultation duties and long-term disposal standards.',
    overlap: 'The scenario is not an incremental annual estimate; do not add it to other DOE cleanup totals.',
    annualVerified: 0, priority: 'Second review'
  },
  {
    id: 'GAO-20-2-R6', title: 'Improve Navy sustainment cost-risk analysis', agency: 'Department of the Navy',
    action: 'Executive recommendation 6', report: 'GAO-20-2',
    source: 'https://www.gao.gov/products/gao-20-2', status: 'Open – Partially Addressed',
    statusDate: 'February 2026 comments: documentation of sensitivity analysis still needed', retrieved: '2026-10-22',
    estimate: 'Billions of dollars', horizon: 'Potential across shipbuilding acquisition and sustainment; qualitative',
    estimateSource: 'https://www.gao.gov/products/gao-26-108505',
    recommendation: 'Use risk and sensitivity analysis in shipbuilding operating and support cost estimates.',
    nextStep: 'Request evidence supporting GAO closure criteria and a program-level cost-risk comparison.',
    costs: 'Cost-estimating staff, engineering review and corrective actions are unquantified.',
    affected: 'Sailors, acquisition staff, shipyards, suppliers and defense taxpayers.',
    tradeoffs: 'Earlier risk analysis can improve choices; added review effort and delivery schedules must be balanced against readiness.',
    overlap: 'The report’s $130 billion estimate growth is a cost problem, not a savings claim. Closed recommendations are not reopened here.',
    annualVerified: 0, priority: 'Second review'
  },
  {
    id: 'GAO-19-347-R1', title: 'Verify zero-income student loan applications', agency: 'Education / Federal Student Aid',
    action: 'Executive recommendation 1', report: 'GAO-19-347',
    source: 'https://www.gao.gov/products/gao-19-347', status: 'Open – Partially Addressed',
    statusDate: 'December 2025 comments planned implementation by September 2026; completion needs reconfirmation', retrieved: '2026-10-22',
    estimate: 'More than $2 billion', horizon: '2020–2029 estimate associated with enacted FUTURE Act authority',
    estimateSource: 'https://www.gao.gov/products/gao-19-347',
    recommendation: 'Confirm current verification controls and remaining gaps for applicants who self-certify zero income.',
    nextStep: 'Request post-September 2026 implementation status; establish current-law baseline before any new proposal.',
    costs: 'Data matching, privacy safeguards, correction procedures and servicer implementation need costing.',
    affected: 'Student borrowers, loan servicers, Education and IRS data subjects.',
    tradeoffs: 'Verification could reduce errors but must accommodate income changes, protect tax data and allow corrections.',
    overlap: 'Exclude the historical enacted-authority estimate from additional savings. Public award data cannot validate individual borrower eligibility.',
    annualVerified: 0, priority: 'Hold for update'
  }
];

export const budgetOptions: BudgetOption[] = [
  { id: 'site-broad', title: 'Site-neutral outpatient payments: broad alternative', source: 'https://www.cbo.gov/budget-options/60908', low:156.9,high:156.9,group:'site-neutral',
    annual:[0,7.4,12.5,14.4,14.6,16.9,18.9,21,24.8,26.4],
    effects:'Lower Medicare payments; affects hospitals and beneficiaries. Overlaps the GAO Medicare action.',
    costs:'Net outlay estimate under the historical baseline; transition and access protections require rescoring.',
    tradeoffs:'Potentially lower beneficiary costs and consolidation incentives; hospital revenue and access concerns.' },
  { id:'site-drug',title:'Site-neutral payments: off-campus drug administration', source:'https://www.cbo.gov/budget-options/60908',low:5.6,high:5.6,group:'site-neutral',
    annual:[0,.3,.4,.5,.5,.6,.7,.8,.9,.9],effects:'Narrower alternative affecting off-campus hospital services.',costs:'Historical estimate; November 2025 CMS changes require a new current-law baseline.',tradeoffs:'Smaller scope and provider effects. Cannot be added to the broad alternative.' },
  { id:'crop',title:'Crop insurance subsidies and insurer compensation',source:'https://www.cbo.gov/budget-options/60893',low:46.7,high:46.7,group:'crop',
    annual:[1.7,4.9,4.9,4.9,5,5,5,5.1,5.1,5.1],effects:'Lower premium support and insurer reimbursements; farmers and insurers bear changes.',costs:'CBO combines both components; implementation and current program law need review.',tradeoffs:'Lower federal subsidy costs could increase farmer premiums or reduce participation and insurer service capacity.' },
  { id:'carry',title:'Tax carried interest as ordinary labor income',source:'https://www.cbo.gov/budget-options/60946',low:13,high:13,group:'carried-interest',
    annual:[.5,1.1,1.3,1.3,1.3,1.4,1.4,1.5,1.5,1.6],effects:'Higher revenues from investment managers’ compensation; JCT estimate published by CBO.',costs:'Administration and behavioral responses need current-law review; not a stand-alone implementation budget.',tradeoffs:'Raises tax on compensation treated as capital gains; timing, fund structure and investment incentives can respond.' }
];
