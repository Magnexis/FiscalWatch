import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze,cents,csvCell,projectDebt,registryEntrySchema,reviewSchema,scenarioSchema,snapshotSchema,validatePortfolio,workstreamReadiness,type SpendingRow } from '../src/model';
import { budgetOptions } from '../src/evidence';
import { buildDebtStrategy } from '../src/strategy';

const row:SpendingRow={id:'a',vendor:'Vendor',vendorId:'UEI-1',agency:'Agency',date:'2026-01-01',amount:'0.10',category:'Supplies',invoice:'i1',kind:'payment',metric:'payment',source:'https://data.ct.gov/',contract:''};
test('cent-exact sums preserve credits and values beyond Number safe integer',()=>{
  assert.equal(cents('9007199254740993.01'),900719925474099301n);
  const a=analyze([row,{...row,id:'b',amount:'0.20'},{...row,id:'c',amount:'-0.05'}]);
  assert.equal(a.total,25n);assert.equal(a.positive,30n);assert.equal(a.credits,-5n);
  assert.throws(()=>cents('NaN'));assert.throws(()=>cents('0.001'));
});
test('exact repeated source rows excluded; conflicts block analysis',()=>{
  assert.equal(analyze([row,row]).count,1);assert.equal(analyze([row,row]).repeated,1);
  assert.throws(()=>analyze([row,{...row,amount:'1.00'}]),/Conflicting/);
});
test('distinct distributions are only review candidates, never savings',()=>{
  assert.equal(analyze([row,{...row,id:'b'}]).candidates.length,1);
  assert.equal(analyze([{...row,vendorId:''},{...row,id:'b',vendorId:''}]).candidates.length,0);
  assert.equal(analyze([{...row,kind:'grant'},{...row,id:'b',kind:'grant'}]).candidates.length,0);
});
test('protected identities do not become one fake recipient',()=>{
  const a=analyze([{...row,vendor:'REDACTED'},{...row,id:'b',vendor:'REDACTED'}]);
  assert.equal(a.vendors.length,2);assert.equal(a.candidates.length,0);
});
test('overlapping policy alternatives are rejected',()=>{
  assert.match(validatePortfolio(budgetOptions.slice(0,2))??'',/Overlapping/);
  assert.equal(validatePortfolio([budgetOptions[0],budgetOptions[2]]),null);
});
test('invalid imports and unsafe evidence URLs rejected',()=>{
  assert.equal(snapshotSchema.safeParse({schemaVersion:1,rows:[]}).success,false);
  assert.equal(reviewSchema.safeParse({id:'x',stage:'Adopted',note:'x',evidence:'javascript:alert(1)',updatedAt:new Date().toISOString()}).success,false);
  assert.equal(reviewSchema.safeParse({id:'x',stage:'Adopted',note:'x',evidence:'',updatedAt:new Date().toISOString()}).success,false);
  assert.equal(csvCell('=HYPERLINK("evil")'),'"\'=HYPERLINK(""evil"")"');
  assert.equal(csvCell('safe'),'"safe"');
});
test('empty analysis is valid and does not divide by zero',()=>{
  const a=analyze([]);assert.equal(a.total,0n);assert.deepEqual(a.vendors,[]);assert.equal(a.count,0);
});
test('all bundled real extracts validate and analyze without key conflicts',()=>{
  for(const key of ['ct','usaspending-contract','usaspending-grant']) {
    const data=snapshotSchema.parse(JSON.parse(readFileSync(new URL(`../public/data/${key}.json`,import.meta.url),'utf8')));
    assert.ok(data.rows.length>0);assert.ok(analyze(data.rows).count>0);
  }
});
test('debt projection is reproducible and a stronger primary balance lowers debt',()=>{
  const base={name:'test',years:2,initialDebt:100,initialGdp:100,nominalGdpGrowth:0,interestRate:.05,primaryBalanceShareGdp:0,fiscalAdjustmentShareGdp:0};
  assert.equal(projectDebt(base).at(-1)?.debt,110.25);
  assert.ok((projectDebt({...base,primaryBalanceShareGdp:.02}).at(-1)?.debt??Infinity)<110.25);
  assert.equal(scenarioSchema.safeParse({...base,years:51}).success,false);
});
test('registry requires trusted evidence and documented verified methodology',()=>{
  const base={id:'one',title:'Test',agency:'Agency',status:'Independently verified',potentialEffect:'$0',evidenceUrl:'https://www.gao.gov/',methodologyNote:'Reconciled documents and independent review.',overlapGroup:'one',updatedAt:new Date().toISOString()};
  assert.equal(registryEntrySchema.safeParse(base).success,true);
  assert.equal(registryEntrySchema.safeParse({...base,methodologyNote:''}).success,false);
  assert.equal(registryEntrySchema.safeParse({...base,evidenceUrl:'http://example.com'}).success,false);
});
test('work queue reports research readiness without inventing fiscal performance',()=>{
  const queue=workstreamReadiness({hasSnapshot:true,candidateGroups:2,registryCount:1,hasTreasuryDebt:false});
  assert.equal(queue[0].level,'Needs fresh source');
  assert.equal(queue[1].level,'Ready to inspect');
  assert.match(queue[1].detail,/2 candidate/);
  assert.equal(queue[2].level,'Needs independent review');
});
test('debt strategy turns disclosed assumptions into a research agenda, not a policy score',()=>{
  const scenario={name:'test',years:2,initialDebt:100,initialGdp:100,nominalGdpGrowth:0,interestRate:.05,primaryBalanceShareGdp:.06,fiscalAdjustmentShareGdp:0};
  const strategy=buildDebtStrategy(scenario,projectDebt(scenario));
  assert.equal(strategy.trajectory,'Improving');
  assert.equal(strategy.actions.length,3);
  assert.match(strategy.actions[0].detail,/interest-rate/i);
});
