import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { z } from 'zod';
import { opportunities, budgetOptions } from './evidence';
import { analyze, cents, csvCell, money, opportunitySchema, reviewSchema, snapshotSchema, validatePortfolio, type Review, type Snapshot } from './model';
import { download, explain, loadReviews, loadSnapshots, native, saveReview, storeSnapshot } from './storage';
import { refresh } from './connectors';
import './style.css';
import { invoke } from '@tauri-apps/api/core';

const sections=['Evidence register','Spending workbench','Policy comparison','Follow-up ledger','Methods & reports'] as const;
type Section=typeof sections[number];
function Source({url,children}:{url:string;children:React.ReactNode}) {
  const [failure,setFailure]=useState('');
  return <><a href={url} target="_blank" rel="noreferrer" onClick={e=>{if(native){e.preventDefault();void invoke('open_source',{url}).catch(err=>setFailure(explain(err)))}}}>{children} ↗</a>{failure&&<small role="alert">Could not open source: {failure}</small>}</>;
}
function Report({name,children}:{name:string;children:React.ReactNode}) {
  const [failure,setFailure]=useState('');
  return <><a href={`./reports/${name}.html`} target="_blank" rel="noreferrer" onClick={e=>{if(native){e.preventDefault();void invoke('open_report',{name}).catch(err=>setFailure(explain(err)))}}}>{children} ↗</a>{failure&&<small role="alert">Could not open report: {failure}</small>}</>;
}
function App() {
  const [section,setSection]=useState<Section>('Evidence register');
  const [query,setQuery]=useState(''); const [priority,setPriority]=useState('All priorities');
  const [selected,setSelected]=useState(opportunities[0].id);
  const [reviews,setReviews]=useState<Review[]>([]); const [note,setNote]=useState('');
  const [stage,setStage]=useState<Review['stage']>('Research');const [evidence,setEvidence]=useState('');
  const [snapshots,setSnapshots]=useState<Record<string,Snapshot>>({}); const [source,setSource]=useState('ct');
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
  const [selectedOptions,setSelectedOptions]=useState<string[]>([]);const [loading,setLoading]=useState(true);
  const [year,setYear]=useState(2026); const [page,setPage]=useState(0);
  const active=opportunities.find(o=>o.id===selected) ?? opportunities[0];
  const filtered=opportunities.filter(o=>(priority==='All priorities'||o.priority===priority)&&`${o.title} ${o.agency} ${o.id}`.toLowerCase().includes(query.toLowerCase()));
  const snapshot=snapshots[source];
  const rows=useMemo(()=>snapshot?.rows.filter(r=>`${r.vendor} ${r.agency} ${r.category} ${r.contract}`.toLowerCase().includes(query.toLowerCase()))??[],[snapshot,query]);
  const analysis=useMemo(()=>{try{return analyze(rows)}catch(e){return explain(e)}},[rows]);
  useEffect(()=>{
    const review=reviews.find(r=>r.id===selected);setNote(review?.note??'');setStage(review?.stage??'Research');setEvidence(review?.evidence??'');
  },[selected,reviews]);
  useEffect(()=>{setPage(0)},[source,query]);
  useEffect(()=>{
    async function start() {
      try {
        z.array(opportunitySchema).parse(opportunities);
        const stored=await loadReviews();setReviews(stored);
        const loaded:Record<string,Snapshot>={};
        for (const key of ['ct','usaspending-contract','usaspending-grant']) {
          const response=await fetch(`./data/${key}.json`); if(!response.ok)throw new Error(`Bundled ${key} extract unavailable`);
          loaded[key]=snapshotSchema.parse(await response.json());
        }
        for(const saved of await loadSnapshots()) loaded[saved.dataset]=saved;
        setSnapshots(loaded);
      } catch(e){setError(`Workspace could not fully load: ${explain(e)}. Check the bundled data or restore a valid backup.`)}
      finally{setLoading(false)}
    }
    void start();
  },[]);
  async function save() {
    setError('');setMessage('');
    try {
      const value=reviewSchema.parse({id:selected,stage,note,evidence,updatedAt:new Date().toISOString()});
      if(stage==='Adopted'&&!evidence)throw new Error('An adoption record needs an HTTPS evidence reference. Adoption does not establish realized savings.');
      await saveReview(value);setReviews([...reviews.filter(r=>r.id!==selected),value]);setMessage('Review saved locally.');
    }catch(e){setError(explain(e))}
  }
  async function refreshSource() {
    setBusy(true);setError('');setMessage('');
    try {
      const next=await refresh(source==='ct'?'ct':'usaspending',year,source==='usaspending-grant'?'grant':'contract');
      // Validate analysis before persisting; a conflicting key cannot silently replace an extract.
      analyze(next.rows);await storeSnapshot(next);setSnapshots({...snapshots,[source]:next});setMessage('Public extract refreshed and cached locally.');
    }catch(e){setError(`${explain(e)} Existing cached data was retained.`)}finally{setBusy(false)}
  }
  async function importSnapshot(file:File|undefined) {
    if(!file)return;setError('');
    try{
      if(file.size>10_000_000)throw new Error('Import exceeds 10 MB.');
      const next=snapshotSchema.parse(JSON.parse(await file.text()));analyze(next.rows);await storeSnapshot(next);
      const key=next.dataset;
      setSnapshots({...snapshots,[key]:next});setSource(key);setMessage('Validated snapshot imported.');
    }catch(e){setError(`Import failed: ${explain(e)}`)}
  }
  function exportRows() {
    const columns=['id','vendor','vendorId','agency','date','amount','kind','metric','invoice','contract','source'] as const;
    download('fiscalwatch-filtered-extract.csv',[columns.map(csvCell).join(','),...rows.map(row=>columns.map(k=>csvCell(row[k])).join(','))].join('\r\n'),'text/csv');
  }
  const chosen=budgetOptions.filter(o=>selectedOptions.includes(o.id));const conflict=validatePortfolio(chosen);
  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><b className="mark">F</b><div><strong>FiscalWatch</strong><small>MAGNEXIS · RESEARCH DESK</small></div></div>
      <div className="workspace"><span className="dot"/> United States <small>Connecticut pilot</small></div>
      <nav aria-label="Workspace">{sections.map((s,i)=><button key={s} className={section===s?'nav active':'nav'} onClick={()=>{setSection(s);setQuery('');setError('');setMessage('')}}><span className="nav-index">0{i+1}</span>{s}</button>)}</nav>
      <div className="side-bottom"><span className="tag">{native?'Desktop · SQLite':'Browser preview'}</span><p>Account-free local research.<br/>No telemetry. No automatic submissions.</p><small>RESEARCH RELEASE 0.1.0</small></div>
    </aside>
    <main>
      <header className="topbar"><span>Government Fiscal Accountability Initiative <span className="slash">/</span> {section}</span><span className="tag">Evidence checked 22 Oct 2026</span></header>
      <div className="page-title"><div><div className="eyebrow">MAGNEXIS / UNITED STATES</div><h1>{section}</h1><p>{section==='Evidence register'?'Turn documented recommendations into reviewable, accountable action.':section==='Spending workbench'?'Inspect source records, coverage and patterns before drawing conclusions.':section==='Policy comparison'?'Compare spending and revenue options against their original budget windows.':section==='Follow-up ledger'?'Track evidence and responses without confusing activity with results.':'Reproducible research, explicit assumptions and public source material.'}</p></div><button onClick={()=>download('fiscalwatch-reviews.json',JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),reviews},null,2))}>Export review backup</button></div>
      {loading&&<div className="notice" role="status">Loading local research workspace…</div>}
      {error&&<div className="notice error" role="alert">{error}</div>}
      {message&&<div className="notice success" role="status">{message}</div>}
      {section==='Evidence register'&&<>
        <div className="mission"><div><span className="eyebrow">FIRST MISSION</span><strong>$100m / year</strong><span>Independent verification target</span></div><div className="mission-note"><b>$0 independently verified annual savings so far.</b><p>Five selected GAO actions. Source estimates retain their original scope and period. No mixed-horizon total.</p></div></div>
        <div className="toolbar"><label className="search"><span>Search evidence</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search title, agency or GAO ID…"/></label><label>Priority<select value={priority} onChange={e=>setPriority(e.target.value)}>{['All priorities','First review','Second review','Hold for update'].map(x=><option key={x}>{x}</option>)}</select></label><span className="muted">{filtered.length} actions</span></div>
        <div className="split"><section className="register" aria-label="GAO actions">
          {filtered.length===0?<div className="empty">No actions match these filters.</div>:filtered.map(o=><button key={o.id} className={`record ${selected===o.id?'selected':''}`} onClick={()=>setSelected(o.id)}><div><span className="mono">{o.id}</span><span className="tag">{o.priority}</span></div><h2>{o.title}</h2><p>{o.agency}</p><footer><span>{o.status}</span><b>{o.estimate}</b></footer><small>{o.horizon}</small></button>)}
        </section><section className="inspector" aria-label="Selected recommendation"><span className="eyebrow">EVIDENCE INSPECTOR / {active.action}</span><h2>{active.title}</h2><Source url={active.source}>{active.report} · recommendation status</Source><p className="status-note">{active.statusDate}. Retrieved {active.retrieved}; source comments may predate retrieval.</p>
          <dl><dt>Recommended action</dt><dd>{active.recommendation}</dd><dt>Next verification step</dt><dd>{active.nextStep}</dd><dt>Estimate & period</dt><dd>{active.estimate} · {active.horizon}<br/><Source url={active.estimateSource}>Estimate source</Source></dd><dt>Implementation costs</dt><dd>{active.costs}</dd><dt>Affected populations</dt><dd>{active.affected}</dd><dt>Trade-offs</dt><dd>{active.tradeoffs}</dd><dt>Accounting constraint</dt><dd>{active.overlap}</dd></dl>
          <div className="review-editor"><h3>Local review</h3><label>Stage<select value={stage} onChange={e=>setStage(e.target.value as Review['stage'])}>{['Research','Awaiting response','Adopted','Closed'].map(x=><option key={x}>{x}</option>)}</select></label><label>Working notes<textarea maxLength={10000} rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="Evidence gaps, agency response, next action…"/></label><label>Supporting evidence URL<input value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="https://…"/></label><button className="primary" onClick={()=>void save()}>Save review</button><small>Saved on this device. Never sent to an office from this form.</small></div>
        </section></div>
      </>}
      {section==='Spending workbench'&&<>
        <div className="toolbar wrap"><label>Public extract<select value={source} onChange={e=>setSource(e.target.value)}><option value="ct">Connecticut payments</option><option value="usaspending-contract">Federal contracts · CT</option><option value="usaspending-grant">Federal grants · CT</option></select></label><label>Refresh fiscal year<input type="number" min="2020" max="2100" value={year} onChange={e=>setYear(Number(e.target.value))}/></label><button className="primary" disabled={busy||!native||!Number.isInteger(year)||year<2020||year>2100} onClick={()=>void refreshSource()}>{busy?'Fetching official source…':'Refresh official extract'}</button><label className="file-button">Import snapshot<input type="file" accept=".json,application/json" onChange={e=>{void importSnapshot(e.target.files?.[0]);e.target.value=''}}/></label><button onClick={exportRows} disabled={!rows.length}>Export filtered CSV</button></div>
        {!native&&<div className="notice">Live refresh is a native desktop command. Browser preview uses bundled extracts; snapshot import remains available.</div>}
        {snapshot?<><div className="coverage"><b>Bounded extract · {snapshot.rows.length} source rows</b><p>{snapshot.coverage}</p><small>Retrieved {new Date(snapshot.retrievedAt).toLocaleString()} · SHA-256 {snapshot.rawSha256}</small><details><summary>Query and source limitations</summary><pre>{snapshot.query}</pre><ul>{snapshot.warnings.map(w=><li key={w}>{w}</li>)}</ul></details></div>
        <label className="search standalone"><span>Filter loaded records</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Recipient, agency, description or contract…"/></label>
        {typeof analysis==='string'?<div className="notice error">{analysis}</div>:<>
          <div className="metrics"><div><span>Filtered net {source==='ct'?'payments':'award obligations'}</span><strong>{money(analysis.total)}</strong></div><div><span>Credits / negative amounts</span><strong>{money(analysis.credits)}</strong></div><div><span>Unique source records</span><strong>{analysis.count.toLocaleString()}</strong><small>{analysis.repeated} exact repeat rows excluded</small></div></div>
          <div className="analysis-grid"><section><h2>Recipient concentration</h2><p className="muted">Share of positive amounts in this filtered extract. No statewide inference.</p>{analysis.vendors.slice(0,6).map((v,i)=><div className="vendor" key={i}><div><span>{v.name||'Identity unavailable'}</span><b>{money(v.amount)}</b></div><progress max={10000} value={analysis.positive?Number(v.amount*10000n/analysis.positive):0}/></div>)}</section><section><h2>Invoice review candidates</h2><p className="muted">Same vendor ID, agency, date, invoice and positive amount across distinct distribution keys.</p><strong className="large">{analysis.candidates.length}</strong><p>These can be legitimate split distributions. They are not verified duplicates, recoverable amounts or allegations.</p>{analysis.candidates.slice(0,5).map((g,i)=><p className="candidate" key={i}>{g[0].vendor} · {g.length} lines · {money(cents(g[0].amount))} each</p>)}</section></div>
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Recipient / source</th><th>Agency</th><th>Category / description</th><th className="numeric">Amount</th></tr></thead><tbody>{rows.slice(page*40,(page+1)*40).map((r,i)=><tr key={`${r.id}:${i}`}><td>{r.date}</td><td><Source url={r.source}>{r.vendor||'Identity unavailable'}</Source><small>{r.invoice||r.contract}</small></td><td>{r.agency}</td><td>{r.category}</td><td className="numeric">{money(cents(r.amount))}</td></tr>)}</tbody></table>{!rows.length&&<div className="empty">No records match the current filter.</div>}</div><div className="pagination"><button disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page+1} of {Math.max(1,Math.ceil(rows.length/40))}</span><button disabled={(page+1)*40>=rows.length} onClick={()=>setPage(page+1)}>Next</button></div>
        </>}</>:<div className="empty">No extract loaded. Import a validated snapshot or refresh the official source in the desktop app.</div>}
      </>}
      {section==='Policy comparison'&&<>
        <div className="notice">Historical estimates, not a current legislative score. CBO’s December 2024 options use 2025–2034 and assumed start dates that have passed. Re-score against current law before adoption. CBO does not endorse options.</div>
        <div className="table-wrap"><table className="options"><thead><tr><th>Select</th><th>Option</th><th>2025–2034 deficit reduction</th><th>Affected groups & trade-offs</th></tr></thead><tbody>{budgetOptions.map(o=><tr key={o.id}><td><input type="checkbox" aria-label={`Select ${o.title}`} checked={selectedOptions.includes(o.id)} onChange={e=>setSelectedOptions(e.target.checked?[...selectedOptions,o.id]:selectedOptions.filter(x=>x!==o.id))}/></td><td><Source url={o.source}>{o.title}</Source><small>{o.costs}</small></td><td className="numeric">${o.low} billion</td><td>{o.effects}<small>{o.tradeoffs}</small></td></tr>)}</tbody></table></div>
        <div className="scenario"><h2>Research comparison basket</h2>{conflict?<p role="alert" className="error-text">{conflict}</p>:chosen.length?<><strong className="large">${chosen.reduce((n,o)=>n+o.low,0).toFixed(1)}bn</strong><p>Arithmetic sum of selected historical estimates. Not an integrated CBO score, forecast, annual savings estimate or independently verified benefit. Interactions and implementation costs still need review.</p><button onClick={()=>download('fiscalwatch-policy-comparison.json',JSON.stringify({window:'2025–2034',baseline:'CBO June 2024; historical estimates',status:'Unscored research comparison; not additive with GAO register',options:chosen},null,2))}>Export comparison</button></>:<p>Select options to compare historical amounts. Mutually overlapping alternatives are blocked.</p>}</div>
      </>}
      {section==='Follow-up ledger'&&<>
        <div className="notice">This is a local research record. “Awaiting response” is a user-entered stage; the app does not send messages. Adoption requires evidence and does not establish savings.</div>
        <div className="table-wrap"><table><thead><tr><th>Action</th><th>Stage</th><th>Notes / evidence</th><th>Updated</th></tr></thead><tbody>{reviews.map(r=><tr key={r.id}><td><button className="text-button" onClick={()=>{setSelected(r.id);setSection('Evidence register')}}>{r.id}</button></td><td>{r.stage}</td><td>{r.note||'No notes'}{r.evidence&&<small><Source url={r.evidence}>Supporting record</Source></small>}</td><td>{new Date(r.updatedAt).toLocaleDateString()}</td></tr>)}</tbody></table>{!reviews.length&&<div className="empty">No follow-ups recorded. Open a GAO action and save a local review to begin.</div>}</div>
        <label className="file-button restore">Restore review backup<input type="file" accept=".json" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;void(async()=>{try{if(file.size>1_000_000)throw new Error('Backup exceeds 1 MB');const raw=z.object({schemaVersion:z.literal(1),reviews:z.array(reviewSchema).max(500)}).parse(JSON.parse(await file.text()));if(raw.reviews.some(r=>!opportunities.some(o=>o.id===r.id)))throw new Error('Backup references an unknown recommendation');for(const r of raw.reviews)await saveReview(r);setReviews(await loadReviews());setMessage('Review backup restored; matching IDs replaced.')}catch(err){setError(explain(err))}})()}}/></label>
      </>}
      {section==='Methods & reports'&&<article className="methods">
        <h2>A research initiative with a measurable standard</h2><p>Mission: independently verify at least $100 million in potential annual government savings. This remains a research target. The current independently verified annual amount is $0.</p>
        <h3>Evidence ladder</h3><ol><li>Published source and recommendation confirmed.</li><li>Current status, legal baseline and estimate reconciled.</li><li>Implementation cost, distributional effects and overlaps reviewed.</li><li>Independent reviewer checks net annual estimate.</li><li>Agency implementation documented.</li><li>Realized net savings measured against a defensible counterfactual.</li></ol>
        <p>No selected action has passed independent net annual verification. GAO’s cumulative historical benefits cannot be claimed as Magnexis results.</p>
        <h3>Connecticut pilot</h3><p>Use a closed fiscal year, preserve source keys and negative amounts, validate suspicious-looking patterns against invoices and contracts, and request an agency response before publication of any allegation. Federal award obligations and state payments must remain separate.</p>
        <h3>30-day operating cycle</h3><ol><li>Days 1–7: check five GAO actions; obtain current agency status and recruit an independent reviewer.</li><li>Days 8–14: reconcile a CT payment sample with source documents and audit recommendations.</li><li>Days 15–21: publish methods, costs, uncertainty and corrections; obtain technical review.</li><li>Days 22–30: submit narrow requests to the delegation and oversight staff; record receipts and feedback.</li></ol>
        <h3>Research pack</h3><p><Source url="https://www.gao.gov/products/gao-26-108505">GAO 2026 report</Source> · <Source url="https://www.cbo.gov/publication/60557">CBO options</Source> · <Source url="https://data.ct.gov/Government/State-of-CT-Open-Expenditures-Ledger-Current/ajdm-rvz7">CT ledger</Source></p>
        <p><Report name="fiscal-impact-report">Open fiscal impact report</Report> · <Report name="policy-brief">Open congressional brief</Report></p>
        <h3>Corrections and referrals</h3><p>Keep a dated change record and source trail. An unusual spending pattern is not proof of wrongdoing. Credible federal allegations can be directed to <Source url="https://www.gao.gov/about/what-gao-does/fraud">GAO FraudNet</Source> after careful evidence review. FiscalWatch does not file allegations automatically.</p>
        <p>Treasury accepts <Source url="https://www.treasurydirect.gov/government/public-debt-reports/gifts/">voluntary debt-reduction gifts</Source>. Donations are outside this initiative’s research workflow; no personal contribution is required.</p>
        <h3>Local data</h3><p>Desktop notes and refreshed extracts are stored in the operating system’s application data directory under com.magnexis.fiscalwatch/fiscalwatch.sqlite3. Export backups before moving devices. The database is not encrypted; avoid personal or sensitive investigative records. Network requests occur only when you refresh an official extract.</p>
      </article>}
      <footer className="page-footer">MAGNEXIS FISCALWATCH <span>Public-data research · Nonpartisan · Source-linked</span></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
