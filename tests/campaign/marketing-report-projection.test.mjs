// @trace verifies AC-015-002-01, AC-015-002-02, AC-015-002-03, AC-015-002-04
import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createCampaign} from '../../apps/web/src/content/shared/model.mjs';
import {canonicalHash,validateWindow,readPreviewRequest,deriveReportedFacts,previewMarketingReport} from '../../apps/api/marketing-report.mjs';

const now=new Date('2026-10-05T05:00:00Z');
const window={start:'2026-09-21',endExclusive:'2026-09-28',timezone:'Asia/Bangkok',asOf:'2026-10-05T12:00:00+07:00'};
const state=()=>createCampaign('PRIVATE TITLE','leads',false);
function source(c=state()){
 return {businessId:'00000000-0000-4000-a000-000000000001',campaign:{sourceCampaignId:'00000000-0000-4000-a000-000000000002',code:'CAM-0001',objective:'leads',lifecycle:'active',currency:'THB'},sourceRevision:{campaignRowVersion:'9007199254740993',stateRowVersion:'2',statePayloadHash:canonicalHash(c),businessDomainRevision:'9',modelVersion:'1'},capturedAt:now.toISOString(),state:c};
}
const metric=(p,key)=>p.payload.measurements.find(m=>m.key===key);

test('weekly request validates dates, timezone and as-of without silently fixing input',()=>{
 assert.deepEqual(validateWindow(window,now),window);
 assert.equal(validateWindow({...window,timezone:'UTC'},now).timezone,'UTC');
 for(const change of [{start:'2026-09-22'},{endExclusive:'2026-09-29'},{start:'2026-02-30'},{timezone:'Mars/Phobos'},{asOf:'2026-10-05T13:00:00+07:00'},{asOf:'2026-10-05'},{asOf:'2026-02-30T00:00:00Z'},{businessId:'override'},{workspace:{}},{timezoneAttestation:'Asia/Bangkok'}]){
  assert.throws(()=>validateWindow({...window,...change},now),e=>e.status===422);
 }
 assert.throws(()=>validateWindow({...window,asOf:'2026-09-20T12:00:00Z'},now),e=>e.status===422);
});

test('bounded preview JSON rejects duplicate and escaped duplicate fields before projection',async()=>{
 const raw=JSON.stringify(window);
 assert.deepEqual(await readPreviewRequest(Readable.from([...Buffer.from(raw)].map(x=>Buffer.from([x]))),now),window);
 for(const input of ['not JSON',raw.replace('"start":','"start":"2026-09-21","st\\u0061rt":'),JSON.stringify({...window,actor:{kind:'operator'}})]){
  await assert.rejects(readPreviewRequest(Readable.from([input]),now),e=>[400,422].includes(e.status));
 }
 await assert.rejects(readPreviewRequest(Readable.from([' '.repeat(1025)]),now),e=>e.status===413);
});

test('unknown source timezone holds every scalar and n/N despite a watermark or injected state attestation',()=>{
 const c=state();c.start='2026-09-01';c.sources={ads:'2026-10-05',leads:'2026-10-05',orders:'2026-10-05',inventory:''};
 c.ads=[{id:'ad',date:'2026-09-21',spend:0,impressions:0,clicks:0}];c.timezoneAttestation={timezone:'Asia/Bangkok',approved:true};
 const p=previewMarketingReport(source(c),window);
 assert.equal(p.readiness,'HELD');assert.equal(p.payload.measurements.length,12);
 for(const m of p.payload.measurements){assert.equal(m.value,null);assert.equal(m.quality,'UNKNOWN');assert.ok(m.reasonCodes.includes('SOURCE_TIMEZONE_UNATTESTED'));assert.equal(m.provenance.timezoneState,'UNKNOWN');assert.equal(m.provenance.collectionKnownAt,null);if(m.ratio){assert.equal(m.ratio.numerator,null);assert.equal(m.ratio.denominator,null);}}
 assert.equal(metric(p,'reported_spend').provenance.watermarkDate,'2026-10-05');
});

test('calculation stage distinguishes observed zero from missing source and denominator',()=>{
 const c=state();assert.equal(deriveReportedFacts(c,window).spend,null);
 c.ads=[{id:'a',date:'2026-09-21',spend:0,impressions:0,clicks:0}];
 const f=deriveReportedFacts(c,window);assert.equal(f.spend,0);assert.equal(f.clicks,0);assert.equal(f.ctr,null);assert.equal(f.cpl,null);
 c.ads[0].impressions=null;assert.equal(deriveReportedFacts(c,window).impressions,null);
});

test('activity uses half-open events; stage entries and later cohort follow-up use their own periods',()=>{
 const c=state();c.windowDays=7;
 c.ads=[{id:'a',date:'2026-09-21',spend:20,impressions:200,clicks:10},{id:'excluded',date:'2026-09-28',spend:999,impressions:999,clicks:999}];
 c.leads=[{id:'old',date:'2026-09-01',mqlAt:'2026-09-22',sqlAt:'2026-09-23'},{id:'new',date:'2026-09-25',mqlAt:'2026-09-28'},{id:'outside',date:'2026-09-28'}];
 c.orders=[{id:'old-order',leadId:'old',date:'2026-09-10',status:'paid',amount:100,refund:30,refundAt:'2026-09-23'},{id:'later',leadId:'new',date:'2026-09-30',status:'paid',amount:200,refund:0}];
 const f=deriveReportedFacts(c,window);
 assert.equal(f.spend,20);assert.equal(f.leadCount,1);assert.equal(f.mql,1);assert.equal(f.sql,1);assert.equal(f.revenue,-30);assert.equal(f.orders,0);
 assert.equal(f.mature,1);assert.equal(f.pending,0);assert.equal(f.converted,1);assert.equal(f.cvr,1);assert.equal(f.cpl,20);assert.equal(f.cpo,null);
 const earlier=deriveReportedFacts(c,{...window,asOf:'2026-09-27T12:00:00+07:00'});
 assert.equal(earlier.mature,0);assert.equal(earlier.pending,1);assert.equal(earlier.cvr,null);
});

test('cohort counts each lead once, rejects duplicate source IDs and applies refund as-of',()=>{
 const c=state();c.windowDays=7;c.leads=[{id:'l',date:'2026-09-21'}];
 c.orders=[{id:'o1',leadId:'l',date:'2026-09-23',status:'paid',amount:100,refund:100,refundAt:'2026-10-01'},{id:'o2',leadId:'l',date:'2026-09-24',status:'paid',amount:100,refund:0}];
 assert.equal(deriveReportedFacts(c,window).converted,1);
 c.orders.pop();const f=deriveReportedFacts(c,window);assert.equal(f.converted,0);assert.equal(f.orders,1);assert.equal(f.revenue,100);
 c.leads.push({...c.leads[0]});assert.throws(()=>deriveReportedFacts(c,window),e=>e.status===422);
});

test('preview projects only safe context and structured review; never copies private data or grants',()=>{
 const c=state(),secret='PRIVATE-CUSTOMER-PHONE-TOKEN';c.owner=secret;c.accounting=secret;c.definition=secret;c.targets={low:1,mid:2,high:null};c.cap=0;c.committed=null;
 c.leads=[{id:secret,date:'2026-09-22',channel:secret,phone:secret,chat:secret,sqlAt:'2026-09-23'}];
 c.reviews=[{id:'review-1',date:'2026-09-25',text:secret,actor:secret,snapshot:{settings:{version:2,owner:secret},metrics:{customer:secret},gate:{status:'BLOCK',message:secret}}}];
 const input=source(c);input.campaign.owner=secret;input.sourceRevision.token=secret;
 const before=structuredClone(input),p=previewMarketingReport(input,window);
 assert.deepEqual(input,before);assert.ok(!JSON.stringify(p).includes(secret));
 assert.deepEqual(Object.keys(p.payload).sort(),['context','measurements','missingFieldCodes','sourceReferences','weeklyReviewAssertion']);
 assert.equal(p.payload.context.releasedCap,'0');assert.equal(p.payload.context.targets.low,'1');
 const r=p.payload.weeklyReviewAssertion;assert.equal(r.reportedGateStatus,'BLOCK');assert.equal(r.approvalTrust,'UNVERIFIED');assert.deepEqual(r.findingCodes,['GATE_BLOCKED']);assert.deepEqual(r.recommendationCodes,[]);
 assert.equal(p.payload.sourceReferences.length,2);
 assert.ok(!p.payload.measurements.some(m=>/consent|ready|verified|roas|winner/i.test(m.key)));
});

test('unknown, malformed, future or wrong-period review never becomes an approval',()=>{
 for(const review of [{id:'r',date:'2026-09-25',snapshot:{settings:{version:1},gate:{status:'APPROVED'}}},{id:'r',date:'2026-09-25',snapshot:{settings:{version:1}}},{id:'r',date:'2026-09-28',snapshot:{settings:{version:1},gate:{status:'ON_TRACK'}}}]){
  const c=state();c.reviews=[review];const p=previewMarketingReport(source(c),window);assert.equal(p.payload.weeklyReviewAssertion,null);assert.ok(p.payload.missingFieldCodes.includes('WEEKLY_REVIEW_UNAVAILABLE'));
 }
});

test('preview hash binds scope, complete source revisions and capture time; raw private text stays outside safe review hash',()=>{
 const c=state(),s=source(c),p=previewMarketingReport(s,window);const {previewHash,...content}=p;
 assert.equal(previewHash,canonicalHash(content));assert.equal(previewMarketingReport(s,window).previewHash,previewHash);
 for(const changed of [{...s,capturedAt:'2026-10-05T05:00:01.000Z'},{...s,sourceRevision:{...s.sourceRevision,stateRowVersion:'3'}},{...s,businessId:'00000000-0000-4000-a000-000000000009'}])assert.notEqual(previewMarketingReport(changed,window).previewHash,previewHash);
 assert.equal(canonicalHash({b:{y:2,x:1},a:0}),canonicalHash({a:0,b:{x:1,y:2}}));
 assert.notEqual(canonicalHash([1,2]),canonicalHash([2,1]));
 for(const bad of [{x:NaN},{x:undefined},{x:Infinity}])assert.throws(()=>canonicalHash(bad),e=>e.status===422);
});

test('unsupported or imprecise source values fail closed rather than round into fabricated facts',()=>{
 for(const change of [{cap:Infinity},{cap:0.12345},{version:0},{ads:[{id:'a',date:'2026-09-21',spend:0,impressions:9007199254740992,clicks:0}]}])assert.throws(()=>previewMarketingReport(source({...state(),...change}),window),e=>e.status===422);
});

test('missing campaign state never synthesizes settings or source records',()=>{
 const s=source();s.state=null;s.sourceRevision.stateRowVersion=null;s.sourceRevision.statePayloadHash=null;
 const p=previewMarketingReport(s,window);assert.equal(p.payload.context.settingsVersion,null);assert.deepEqual(p.payload.sourceReferences,[]);assert.ok(p.payload.missingFieldCodes.includes('CAMPAIGN_STATE_MISSING'));
});
