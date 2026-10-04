// @trace verifies AC-015-001-02, AC-015-003-02 — pure contract and actual router denial.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createCampaign} from '../../web/src/content/shared/model.mjs';
import {canonicalHash,previewMarketingReport} from '../marketing-report.mjs';
import {canonicalText,readLedgerRequest,validateFreezeRequest,buildMarketingEnvelope,prepareMarketingReport,freezeMarketingReport,readMarketingReport,ledgerRetry} from '../marketing-report-ledger.mjs';
import {handleApi,sendError} from '../api.mjs';
import {pool} from '../db.mjs';

const b='00000000-0000-4000-a000-000000000001',c='00000000-0000-4000-a000-000000000002',key='00000000-0000-4000-a000-000000000003';
const window={start:'2026-09-21',endExclusive:'2026-09-28',timezone:'Asia/Bangkok',asOf:'2026-09-28T00:00:00+07:00'};
const state=createCampaign('private source', 'leads',false);
const revision={campaignRowVersion:'9007199254740993',stateRowVersion:'2',statePayloadHash:canonicalHash(state),businessDomainRevision:'1',modelVersion:'1'};
const preview=previewMarketingReport({businessId:b,campaign:{sourceCampaignId:c,code:'CAM-0001',objective:'leads',lifecycle:'draft',currency:'THB'},sourceRevision:revision,capturedAt:'2026-10-05T00:00:00.000Z',state},window);
const freeze={idempotencyKey:key,preparationId:c,expectedPreviewHash:preview.previewHash,expectedSourceRevision:revision};
after(()=>pool.end());

test('nested parser rejects escaped duplicates, extra authority, invalid UTF8, surrogate, and byte overflow',async()=>{
 const prepare={idempotencyKey:key,associationId:c,window};assert.deepEqual(await readLedgerRequest({body:JSON.stringify(prepare)},'prepare'),prepare);
 assert.deepEqual(await readLedgerRequest({body:JSON.stringify(freeze)},'freeze'),freeze);
 await assert.rejects(readLedgerRequest({body:JSON.stringify(prepare).replace('"start":','"st\\u0061rt":"2026-09-21","start":')},'prepare'),e=>e.code==='JSON_DUPLICATE_KEY');
 for(const body of [{...prepare,actor:'operator'},{...prepare,window:{...window,capturedAt:'now'}},{...freeze,expectedSourceRevision:{...revision,rawState:state}}])await assert.rejects(readLedgerRequest({body},'prepare'),e=>e.status===422);
 await assert.rejects(readLedgerRequest({body:Buffer.from([0xc3,0x28])},'prepare'),e=>e.code==='JSON_INVALID');
 await assert.rejects(readLedgerRequest({body:'{"x":"\\ud800"}'},'prepare'),e=>e.code==='JSON_UNICODE_INVALID');
 await assert.rejects(readLedgerRequest({body:' '.repeat(4097)},'prepare'),e=>e.status===413);
});

test('freeze requires exact string revisions and cannot receive payload/clock/target',()=>{
 assert.equal(validateFreezeRequest(freeze),freeze);
 for(const bad of [{...freeze,frozenAt:'now'},{...freeze,idempotencyKey:[key]},{...freeze,expectedPreviewHash:[preview.previewHash]},{...freeze,expectedSourceRevision:{...revision,stateRowVersion:2}},{...freeze,expectedPreviewHash:'F'.repeat(64)},{...freeze,expectedSourceRevision:{...revision,modelVersion:'2'}}])assert.throws(()=>validateFreezeRequest(bad),e=>e.status===422);
});

test('envelope hashes bytes without self hash; source identifiers and original window survive; no raw source leaks',()=>{
 const association={source_deployment_id:'local-qa',external_binding_id:'parent-binding',parent_initiative_id:'parent-initiative'};
 const result=buildMarketingEnvelope({preview},association,{reportId:key,frozenAt:'2026-10-05T00:02:00.000Z'});
 assert.equal(result.bytes,canonicalText(result.envelope));const {payloadHash,...content}=result.envelope;
 assert.equal(payloadHash,canonicalHash(content));assert.notEqual(payloadHash,canonicalHash(result.envelope));
 assert.equal(result.envelope.source.sourceBusinessId,b);assert.equal(result.envelope.sourceRevision.campaignRowVersion,'9007199254740993');assert.deepEqual(result.envelope.window,window);
 assert.ok(result.envelope.payload.measurements.every(m=>m.value===null&&m.quality==='UNKNOWN'));
 assert.ok(!/private source|capturedAt|preparationId|previewHash/.test(result.bytes));
 assert.throws(()=>buildMarketingEnvelope({preview:{...preview,previewHash:'a'.repeat(64)}},association,{reportId:key,frozenAt:'2026-10-05T00:02:00Z'}));
 for(const mutate of [p=>p.payload.private='SECRET',p=>p.payload.measurements[0].value='99',p=>p.payload.context.actor='owner',p=>p.payload.sourceReferences[0].notes='SECRET',p=>p.payload.measurements[0].provenance.timezoneState='VERIFIED']){
  const forged=structuredClone(preview);mutate(forged);delete forged.previewHash;forged.previewHash=canonicalHash(forged);
  assert.throws(()=>buildMarketingEnvelope({preview:forged},association,{reportId:key,frozenAt:'2026-10-05T00:02:00.000Z'}),e=>e.code==='PREPARATION_INVALID');
 }
});

test('adapter denies unresolved operator before query; private GET never returns raw DB errors',async()=>{
 let calls=0;const tx={query:async()=>{calls++;return {rows:[]};}};
 for(const fn of [prepareMarketingReport,freezeMarketingReport,readMarketingReport])await assert.rejects(fn(tx,b,c,freeze),e=>e.status===403);
 assert.equal(calls,0);
 const active={...tx,zuriViewer:{kind:'operator'}};await assert.rejects(readMarketingReport(active,b,c),e=>e.status===404);assert.equal(calls,1);
 const stale={...active,query:async()=>{throw Object.assign(Error('SOURCE_STALE'),{code:'P0001'});}};
 await assert.rejects(freezeMarketingReport(stale,b,c,freeze),e=>e.status===409&&e.code==='SOURCE_STALE');
});

test('retry policy is bounded by router and accepts serialization or exact ledger uniqueness only',()=>{
 assert.equal(ledgerRetry({code:'40001'}),true);assert.equal(ledgerRetry({code:'23505',constraint:'marketing_freeze_key'}),true);
 assert.equal(ledgerRetry({code:'23505',constraint:'unrelated_key'}),false);assert.equal(ledgerRetry({code:'P0001'}),false);
});

test('all ledger routes deny hosted/Guest/Member/cross Business and malformed methods before DB',async()=>{
 for(const path of [`campaigns/${c}/marketing-report-preparations`,`campaigns/${c}/marketing-reports`,`marketing-reports/${c}`]){
  const method=path.startsWith('campaigns')?'POST':'GET';
  const call=async(options={},methodOverride=method,body={})=>new Promise(resolve=>{const res={writeHead(status,headers){this.status=status;assert.equal(headers['Cache-Control'],'no-store');},end(){resolve(this.status);}};handleApi({method:methodOverride,body,headers:{'x-zuri-go':'1','content-type':'application/json'}},res,new URL(`http://127.0.0.1/api/zuri-go/v1/businesses/${b}/${path}`),{businessId:b,storage:'postgresql-local',principal:{kind:'operator'},...options}).catch(e=>sendError(res,e));});
  for(const options of [{storage:'postgresql-cloud'},{requireMember:true},{principal:null},{principal:{kind:'session'}},{businessId:c}])assert.equal(await call(options),403);
  assert.equal(await call({},method==='POST'?'GET':'POST'),405);
  if(method==='POST')assert.equal(await call(),422);
 }
});
