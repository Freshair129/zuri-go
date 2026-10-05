// @trace verifies AC-015-004-01, AC-015-004-02 — isolated native PostgreSQL sender.
// Opt-in, already migrated empty QA database only. Never provisions or cleans user storage.
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
import {createCampaign} from '../../web/src/content/shared/model.mjs';
import {canonicalHash} from '../marketing-report.mjs';
import {canonicalText,prepareMarketingReport,freezeMarketingReport} from '../marketing-report-ledger.mjs';
import {readMarketingDelivery,completeMarketingDelivery,settleMarketingDelivery,sendMarketingDelivery,requestMarketingReceipt} from '../marketing-report-delivery.mjs';

const adminUrl=process.env.ZURI_GO_MARKETING_QA_ADMIN_URL,runtimeUrl=process.env.ZURI_GO_MARKETING_QA_RUNTIME_URL;
const skip=adminUrl||runtimeUrl?false:'NOT_RUN: explicit native PostgreSQL QA targets not configured';
let admin,runtime;
const window={start:'2026-09-21',endExclusive:'2026-09-28',timezone:'Asia/Bangkok',asOf:'2026-09-28T00:00:00+07:00'};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
before(async()=>{
 if(skip)return;
 assert.ok(adminUrl&&runtimeUrl);
 const a=new URL(adminUrl),r=new URL(runtimeUrl);
 for(const u of [a,r])assert.ok(['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&/^\/zuri_go_marketing_qa_[a-z0-9_]+$/.test(u.pathname),'isolated local QA target required');
 assert.equal(a.hostname,r.hostname);assert.equal(a.port,r.port);assert.equal(a.pathname,r.pathname);
 admin=new pg.Pool({connectionString:adminUrl,max:3,options:'-c search_path=zuri_go,public'});
 runtime=new pg.Pool({connectionString:runtimeUrl,max:4,options:'-c search_path=zuri_go,public'});
 const inspected=(await admin.query('SELECT (SELECT count(*)::int FROM businesses) businesses,(SELECT max(version) FROM public.zuri_go_migrations) schema')).rows[0];
 assert.equal(inspected.businesses,0);assert.equal(inspected.schema,12);
 const role=(await runtime.query('SELECT current_user name,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];
 assert.equal(role.name,'zuri_go_app');assert.equal(role.rolsuper,false);assert.equal(role.rolbypassrls,false);
});
after(async()=>{await Promise.all([admin?.end(),runtime?.end()]);});
async function transaction(f,fn,kind='operator'){
 const tx=await runtime.connect();try{
  await tx.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  await tx.query("SELECT set_config('zuri_go.business_id',$1,true),set_config('zuri_go.viewer_kind',$2,true)",[f.b,kind]);tx.zuriViewer={kind};
  const result=await fn(tx);await tx.query('COMMIT');return result;
 }catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}
}
async function fixture(){
 const b=randomUUID(),c=randomUUID(),a=randomUUID(),state=createCampaign('ISOLATED QA','leads',false),f={b,c,a};
 await admin.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[b,'ISOLATED DELIVERY QA',b]);
 await admin.query("INSERT INTO campaigns(business_id,id,code,name,objective) VALUES($1,$2,'CAM-0001','QA','leads')",[b,c]);
 await admin.query('INSERT INTO campaign_states(business_id,campaign_id,state_json,payload_hash) VALUES($1,$2,$3,$4)',[b,c,state,canonicalHash(state)]);
 await admin.query("INSERT INTO marketing_report_associations(id,business_id,source_deployment_id,external_binding_id,parent_tenant_id,parent_business_id,parent_initiative_id,reviewed_at,review_ref) VALUES($1,$2,'native-qa','qa-binding','qa-tenant','qa-business','qa-initiative',clock_timestamp(),'qa-review')",[a,b]);
 const {preparation:p}=await transaction(f,tx=>prepareMarketingReport(tx,b,c,{associationId:a,idempotencyKey:randomUUID(),window}));
 const {report}=await transaction(f,tx=>freezeMarketingReport(tx,b,c,{idempotencyKey:randomUUID(),preparationId:p.id,expectedPreviewHash:p.preview.previewHash,expectedSourceRevision:p.preview.sourceRevision}));
 f.r=report.envelope.reportId;f.report=report;
 f.binding={associationId:a,rowVersion:'1',bindingId:'qa-binding',origin:'https://qa.invalid',credential:'zmr_'+'a'.repeat(43)};
 return f;
}
const claim=f=>transaction(f,async tx=>{
 await readMarketingDelivery(tx,f.b,f.r);
 return (await tx.query('SELECT marketing_delivery_claim($1,$2,$3,$4,$5) result',[f.b,f.r,f.a,'1','qa-binding'])).rows[0].result;
});
const finish=(f,c,result)=>transaction(f,tx=>completeMarketingDelivery(tx,f.b,f.r,c.claim,result));
function ack(f){const e=f.report.envelope;return {outcome:'ACK',httpStatus:201,canonicalReceipt:canonicalText({contractVersion:e.contractVersion,receiverReceiptId:randomUUID(),reportId:e.reportId,bindingId:e.target.bindingId,sourceCampaignId:e.campaign.sourceCampaignId,targetInitiativeId:e.target.initiativeId,reportRevision:1,payloadHash:e.payloadHash,acceptedAt:new Date().toISOString(),status:'ACCEPTED_REPORTED_EVIDENCE'})};}
const counts=async f=>(await admin.query(`SELECT (SELECT count(*)::int FROM marketing_report_deliveries WHERE business_id=$1) deliveries,
 (SELECT count(*)::int FROM marketing_report_delivery_attempts WHERE business_id=$1) attempts,(SELECT count(*)::int FROM marketing_report_delivery_receipts WHERE business_id=$1) receipts`,[f.b])).rows[0];
// Only synthetic QA clocks change; owner disables/re-enables the specific guards atomically.
async function clock(f,sql){
 const tx=await admin.connect();try{
  await tx.query('BEGIN');await tx.query('ALTER TABLE marketing_report_deliveries DISABLE TRIGGER marketing_delivery_guard');
  await tx.query('ALTER TABLE marketing_report_delivery_attempts DISABLE TRIGGER marketing_attempt_guard');
  await tx.query(sql,[f.b,f.r]);
  await tx.query('ALTER TABLE marketing_report_delivery_attempts ENABLE TRIGGER marketing_attempt_guard');
  await tx.query('ALTER TABLE marketing_report_deliveries ENABLE TRIGGER marketing_delivery_guard');await tx.query('COMMIT');
 }catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}
}
const eligible=f=>clock(f,'UPDATE marketing_report_deliveries SET next_eligible_at=clock_timestamp()-interval \'1 second\' WHERE business_id=$1 AND report_id=$2');
async function blocked(pid){for(let i=0;i<100;i++){if((await admin.query('SELECT cardinality(pg_blocking_pids($1))>0 blocked',[pid])).rows[0].blocked)return;await delay(20);}assert.fail('expected native lock wait');}

test('concurrent lazy initialization commits one claim; serialization retry cannot send twice',{skip},async()=>{
 const f=await fixture();assert.equal((await transaction(f,tx=>readMarketingDelivery(tx,f.b,f.r))).delivery.state,'QUEUED');assert.deepEqual(await counts(f),{deliveries:0,attempts:0,receipts:0});
 let calls=0;
 const send=()=>sendMarketingDelivery({transaction:fn=>transaction(f,fn),businessId:f.b,reportId:f.r,bindings:[f.binding],requestReceipt:async()=>{calls++;await delay(50);return ack(f);}});
 const results=await Promise.allSettled([send(),send()]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(calls,1);assert.deepEqual(await counts(f),{deliveries:1,attempts:1,receipts:1});
 assert.ok(['DELIVERY_LEASE_ACTIVE','DELIVERY_TERMINAL'].includes(results.find(x=>x.status==='rejected').reason.code));
});

test('receipt matching, atomic ACK, immutable custody and schema011 preservation',{skip},async()=>{
 const f=await fixture(),original=(await admin.query('SELECT canonical_envelope,payload_hash FROM marketing_reports WHERE id=$1',[f.r])).rows[0],c=await claim(f),bad=ack(f);
 bad.canonicalReceipt=canonicalText({...JSON.parse(bad.canonicalReceipt),payloadHash:'a'.repeat(64)});
 await assert.rejects(finish(f,c,bad),e=>e.code==='23514');assert.deepEqual(await counts(f),{deliveries:1,attempts:1,receipts:0});
 assert.equal((await finish(f,c,ack(f))).delivery.state,'ACKNOWLEDGED');
 await assert.rejects(finish(f,c,ack(f)),e=>e.code==='DELIVERY_LEASE_STALE');await assert.rejects(claim(f),e=>e.message==='DELIVERY_TERMINAL');
 await assert.rejects(admin.query('UPDATE marketing_report_delivery_receipts SET binding_id=\'other\' WHERE report_id=$1',[f.r]),e=>e.code==='42501');
 const receipt=(await admin.query('SELECT retain_until=accepted_at+interval \'90 days\' retained FROM marketing_report_delivery_receipts WHERE report_id=$1',[f.r])).rows[0];assert.equal(receipt.retained,true);
 assert.deepEqual((await admin.query('SELECT canonical_envelope,payload_hash FROM marketing_reports WHERE id=$1',[f.r])).rows[0],original);
 assert.equal((await admin.query('SELECT state FROM marketing_report_outbox WHERE report_id=$1',[f.r])).rows[0].state,'QUEUED');
});

test('RLS, direct DML/helper execution and foreign viewer scope fail closed',{skip},async()=>{
 const f=await fixture();await claim(f);
 for(const kind of ['guest','member'])await transaction(f,async tx=>{
  for(const table of ['marketing_report_deliveries','marketing_report_delivery_attempts','marketing_report_delivery_receipts'])assert.equal((await tx.query('SELECT * FROM '+table)).rowCount,0);
 },kind);
 for(const sql of ['UPDATE marketing_report_deliveries SET state=\'UNKNOWN\'','DELETE FROM marketing_report_delivery_attempts','SELECT marketing_delivery_scope($1,$2)'])await assert.rejects(transaction(f,tx=>tx.query(sql,sql.includes('$1')?[f.b,f.r]:[])),e=>e.code==='42501');
 await assert.rejects(transaction(f,tx=>tx.query('SELECT marketing_delivery_read($1,$2)',[f.b,f.r]),'guest'),e=>e.code==='P0001');
 await assert.rejects(transaction({b:randomUUID()},tx=>tx.query('SELECT marketing_delivery_read($1,$2)',[f.b,f.r])),e=>e.code==='P0001');
 const force=(await admin.query("SELECT bool_and(relrowsecurity AND relforcerowsecurity) forced FROM pg_class WHERE relname IN('marketing_report_deliveries','marketing_report_delivery_attempts','marketing_report_delivery_receipts')")).rows[0];assert.equal(force.forced,true);
});

test('network observes committed claim without held Business lock or pool connection',{skip},async()=>{
 const f=await fixture();let calls=0;
 const result=await sendMarketingDelivery({transaction:fn=>transaction(f,fn),businessId:f.b,reportId:f.r,bindings:[f.binding],requestReceipt:async({canonicalEnvelope})=>{
  calls++;assert.equal(canonicalEnvelope,f.report.canonicalEnvelope);assert.equal(runtime.idleCount,runtime.totalCount);
  const owner=await admin.connect();try{await owner.query('BEGIN');await owner.query('SELECT id FROM businesses WHERE id=$1 FOR UPDATE NOWAIT',[f.b]);assert.equal((await owner.query('SELECT state FROM marketing_report_deliveries WHERE report_id=$1',[f.r])).rows[0].state,'SENDING');await owner.query('ROLLBACK');}finally{owner.release();}
  return ack(f);
 }});assert.equal(calls,1);assert.equal(result.delivery.state,'ACKNOWLEDGED');
});

test('four attempts, minimum backoff, Retry-After cap/age exhaustion and terminal rejection',{skip},async()=>{
 const f=await fixture();for(let n=1;n<=4;n++){
  const c=await claim(f),result=await finish(f,c,{outcome:n===2?'RATE_LIMIT':'UNKNOWN',httpStatus:n===2?429:503,retryDelaySeconds:n===2?120:null});
  assert.equal(result.delivery.attemptCount,n);assert.equal(result.delivery.state,n===4?'EXHAUSTED':n===2?'RETRY_SCHEDULED':'UNKNOWN');
  if(n<4){const row=(await admin.query('SELECT extract(epoch FROM d.next_eligible_at-a.finished_at)::int seconds FROM marketing_report_deliveries d JOIN marketing_report_delivery_attempts a ON a.report_id=d.report_id AND a.attempt_number=d.attempt_count WHERE d.report_id=$1',[f.r])).rows[0];assert.ok(row.seconds>=[60,300,900][n-1]);await assert.rejects(claim(f),e=>e.message==='DELIVERY_NOT_ELIGIBLE');await eligible(f);}
 }await assert.rejects(claim(f),e=>e.message==='DELIVERY_TERMINAL');assert.equal((await counts(f)).attempts,4);
 const rate=await fixture(),rc=await claim(rate);assert.equal((await finish(rate,rc,{outcome:'RATE_LIMIT',httpStatus:429,retryDelaySeconds:86400})).delivery.state,'EXHAUSTED');
 const rejected=await fixture(),jc=await claim(rejected);assert.equal((await finish(rejected,jc,{outcome:'REJECTED',httpStatus:403})).delivery.state,'REJECTED');
});

test('explicit expired settlement fences stale worker and reclaims with fresh lease',{skip},async()=>{
 const f=await fixture(),c=await claim(f);await assert.rejects(transaction(f,tx=>settleMarketingDelivery(tx,f.b,f.r)),e=>e.code==='DELIVERY_LEASE_ACTIVE');
 await clock(f,`WITH tick AS MATERIALIZED (SELECT clock_timestamp() t),moved AS (UPDATE marketing_report_delivery_attempts SET started_at=tick.t-interval '61 seconds',lease_expires_at=tick.t-interval '1 second' FROM tick WHERE business_id=$1 AND report_id=$2 RETURNING lease_expires_at)
 UPDATE marketing_report_deliveries SET lease_expires_at=(SELECT lease_expires_at FROM moved) WHERE business_id=$1 AND report_id=$2`);
 await assert.rejects(finish(f,c,ack(f)),e=>e.code==='DELIVERY_LEASE_STALE');
 assert.equal((await transaction(f,tx=>settleMarketingDelivery(tx,f.b,f.r))).delivery.state,'UNKNOWN');await eligible(f);const fresh=await claim(f);assert.notEqual(fresh.claim.leaseId,c.claim.leaseId);
 await assert.rejects(finish(f,c,ack(f)),e=>e.code==='DELIVERY_LEASE_STALE');assert.equal((await finish(f,fresh,ack(f))).delivery.state,'ACKNOWLEDGED');
});

test('post-lock association revocation/archive deny Complete and leave unresolved claim',{skip},async()=>{
 for(const archived of [false,true]){
  const f=await fixture(),c=await claim(f),owner=await admin.connect();let pending;
  try{
   await owner.query('BEGIN');await owner.query(archived?'UPDATE businesses SET archived_at=clock_timestamp() WHERE id=$1':'UPDATE marketing_report_associations SET active=false,row_version=row_version+1 WHERE id=$1',[archived?f.b:f.a]);
   let pid;pending=transaction(f,async tx=>{pid=tx.processID;return completeMarketingDelivery(tx,f.b,f.r,c.claim,ack(f));});const handled=pending.then(()=>null,e=>e);
   while(!pid)await delay(5);await blocked(pid);await owner.query('COMMIT');let error=await handled;
   if(error.code==='40001')error=await finish(f,c,ack(f)).then(()=>null,e=>e);
   assert.equal(error.code,archived?'REPORT_DENIED':'ASSOCIATION_DENIED');assert.equal((await counts(f)).receipts,0);
   assert.equal((await admin.query('SELECT state FROM marketing_report_deliveries WHERE report_id=$1',[f.r])).rows[0].state,'SENDING');
  }finally{await owner.query('ROLLBACK');owner.release();await pending?.catch(()=>{});}
 }
});

test('Complete lock deadline returns within five seconds and never repeats HTTP',{skip},async()=>{
 const f=await fixture(),owner=await admin.connect();let calls=0,pending;
 try{
  pending=sendMarketingDelivery({transaction:fn=>transaction(f,fn),businessId:f.b,reportId:f.r,bindings:[f.binding],requestReceipt:async()=>{calls++;await owner.query('BEGIN');await owner.query('SELECT id FROM businesses WHERE id=$1 FOR UPDATE',[f.b]);return ack(f);}});
  const start=performance.now();await assert.rejects(pending,e=>e.code==='DELIVERY_LOCK_TIMEOUT');assert.ok(performance.now()-start<7000);assert.equal(calls,1);assert.equal((await counts(f)).receipts,0);
 }finally{await owner.query('ROLLBACK');owner.release();await pending?.catch(()=>{});}
});

test('final attempt-row lock crosses lease: both ACK and non-ACK use fresh post-lock DB clock',{skip},async()=>{
 for(const outcome of ['ACK','UNKNOWN']){
  const f=await fixture(),c=await claim(f);
  await clock(f,`WITH tick AS MATERIALIZED (SELECT clock_timestamp() t),moved AS (UPDATE marketing_report_delivery_attempts SET started_at=tick.t-interval '58 seconds',lease_expires_at=tick.t+interval '2 seconds' FROM tick WHERE business_id=$1 AND report_id=$2 RETURNING lease_expires_at)
   UPDATE marketing_report_deliveries SET lease_expires_at=(SELECT lease_expires_at FROM moved) WHERE business_id=$1 AND report_id=$2`);
  const owner=await admin.connect();let pending;
  try{
   await owner.query('BEGIN');await owner.query('SELECT id FROM marketing_report_delivery_attempts WHERE report_id=$1 FOR UPDATE',[f.r]);let pid;
   pending=transaction(f,async tx=>{pid=tx.processID;return completeMarketingDelivery(tx,f.b,f.r,c.claim,outcome==='ACK'?ack(f):{outcome:'UNKNOWN',httpStatus:503});});const handled=pending.then(()=>null,e=>e);
   while(!pid)await delay(5);await blocked(pid);await delay(2200);await owner.query('COMMIT');assert.equal((await handled).code,'DELIVERY_LEASE_STALE');
   assert.equal((await counts(f)).receipts,0);assert.equal((await admin.query('SELECT outcome FROM marketing_report_delivery_attempts WHERE report_id=$1',[f.r])).rows[0].outcome,null);
  }finally{await owner.query('ROLLBACK');owner.release();await pending?.catch(()=>{});}
 }
});

test('first committed Claim 24-hour deadline is independent of lease; attempt four may still ACK',{skip},async()=>{
 const aged=await fixture(),ac=await claim(aged);
 await clock(aged,"UPDATE marketing_report_deliveries SET first_sent_at=clock_timestamp()-interval '24 hours' WHERE business_id=$1 AND report_id=$2");
 await assert.rejects(finish(aged,ac,ack(aged)),e=>e.code==='DELIVERY_LEASE_STALE');assert.equal((await counts(aged)).receipts,0);
 await clock(aged,`WITH tick AS MATERIALIZED (SELECT clock_timestamp() t),moved AS (UPDATE marketing_report_delivery_attempts SET started_at=tick.t-interval '61 seconds',lease_expires_at=tick.t-interval '1 second' FROM tick WHERE business_id=$1 AND report_id=$2 RETURNING lease_expires_at)
 UPDATE marketing_report_deliveries SET lease_expires_at=(SELECT lease_expires_at FROM moved) WHERE business_id=$1 AND report_id=$2`);
 assert.equal((await transaction(aged,tx=>settleMarketingDelivery(tx,aged.b,aged.r))).delivery.state,'EXHAUSTED');
 const retry=await fixture();for(let n=1;n<=3;n++){const c=await claim(retry);await finish(retry,c,{outcome:'UNKNOWN'});await eligible(retry);}
 const fourth=await claim(retry);assert.equal(fourth.claim.attemptNumber,4);assert.equal((await finish(retry,fourth,ack(retry))).delivery.state,'ACKNOWLEDGED');
});
