// @trace verifies AC-015-001-02, AC-015-001-03, AC-015-003-01, AC-015-003-02 — native multi-connection REPEATABLE READ acceptance.
// Opt-in ONLY: an already migrated, empty, test-owned local QA database. No migration/provisioning/cleanup of user storage.
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createCampaign} from '../../web/src/content/shared/model.mjs';
import {canonicalHash} from '../marketing-report.mjs';
import {prepareMarketingReport,freezeMarketingReport,ledgerRetry} from '../marketing-report-ledger.mjs';

const adminUrl=process.env.ZURI_GO_MARKETING_QA_ADMIN_URL,runtimeUrl=process.env.ZURI_GO_MARKETING_QA_RUNTIME_URL;
const skip=adminUrl||runtimeUrl?false:'NOT_RUN: native PostgreSQL QA admin/runtime targets not configured';
let admin,runtime;const window={start:'2026-09-21',endExclusive:'2026-09-28',timezone:'Asia/Bangkok',asOf:'2026-09-28T00:00:00+07:00'};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
before(async()=>{
 if(skip)return;
 assert.ok(adminUrl&&runtimeUrl,'both explicit QA targets are required');
 const a=new URL(adminUrl),r=new URL(runtimeUrl);
 for(const u of [a,r])assert.ok(['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&/^\/zuri_go_marketing_qa_[a-z0-9_]+$/.test(u.pathname),'refusing a non-local or non-test-owned QA target');
 assert.equal(a.hostname,r.hostname);assert.equal(a.port,r.port);assert.equal(a.pathname,r.pathname);
 admin=new pg.Pool({connectionString:adminUrl,max:2,connectionTimeoutMillis:4000,options:'-c search_path=zuri_go,public'});
 runtime=new pg.Pool({connectionString:runtimeUrl,max:3,connectionTimeoutMillis:4000,options:'-c search_path=zuri_go,public'});
 const inspected=(await admin.query("SELECT current_setting('server_version_num')::int version,(SELECT count(*)::int FROM zuri_go.businesses) businesses,(SELECT max(version) FROM public.zuri_go_migrations) schema")).rows[0];
 assert.ok(inspected.version>=160000);assert.equal(inspected.businesses,0,'QA database must be empty before this suite');assert.equal(inspected.schema,11,'QA schema must already be migrated by its owner');
 const role=(await runtime.query('SELECT current_user AS name,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];assert.equal(role.name,'zuri_go_app');assert.equal(role.rolsuper,false);assert.equal(role.rolbypassrls,false);
});
after(async()=>{await Promise.all([admin?.end(),runtime?.end()]);});

async function fixture(){
 const b=randomUUID(),c=randomUUID(),a=randomUUID(),state=createCampaign('NATIVE ISOLATED QA','leads',false);
 await admin.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[b,'ISOLATED MARKETING QA',b]);
 await admin.query("INSERT INTO campaigns(business_id,id,code,name,objective) VALUES($1,$2,'CAM-0001','QA','leads')",[b,c]);
 await admin.query('INSERT INTO campaign_states(business_id,campaign_id,state_json,payload_hash) VALUES($1,$2,$3,$4)',[b,c,state,canonicalHash(state)]);
 await admin.query("INSERT INTO marketing_report_associations(id,business_id,source_deployment_id,external_binding_id,parent_tenant_id,parent_business_id,parent_initiative_id,reviewed_at,review_ref) VALUES($1,$2,'native-qa','qa-binding','qa-tenant','qa-business','qa-initiative',clock_timestamp(),'qa-review')",[a,b]);
 return {b,c,a};
}
async function transaction(f,operation){
 for(let attempt=0;;attempt++){
  const client=await runtime.connect();try{
   await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');await client.query("SELECT set_config('zuri_go.business_id',$1,true),set_config('zuri_go.viewer_kind','operator',true)",[f.b]);client.zuriViewer={kind:'operator'};
   const result=await operation(client);await client.query('COMMIT');return result;
  }catch(e){await client.query('ROLLBACK');if(!ledgerRetry(e)||attempt>=2)throw e;}finally{client.release();}
 }
}
const preparation=f=>transaction(f,tx=>prepareMarketingReport(tx,f.b,f.c,{idempotencyKey:randomUUID(),associationId:f.a,window}));
const request=p=>({idempotencyKey:randomUUID(),preparationId:p.preparation.id,expectedPreviewHash:p.preparation.preview.previewHash,expectedSourceRevision:p.preparation.preview.sourceRevision});
const freeze=(f,input)=>transaction(f,tx=>freezeMarketingReport(tx,f.b,f.c,input));
const counts=async f=>(await admin.query("SELECT (SELECT count(*)::int FROM zuri_go.marketing_reports WHERE business_id=$1) reports,(SELECT count(*)::int FROM zuri_go.marketing_report_outbox WHERE business_id=$1) queues,(SELECT count(*)::int FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='marketing_reports') audits",[f.b])).rows[0];
async function waitForBlocked(pid){
 for(let i=0;i<40;i++){if((await admin.query('SELECT cardinality(pg_blocking_pids($1))>0 blocked',[pid])).rows[0].blocked)return;await delay(50);}
 assert.fail('QA freeze did not wait on the expected source lock');
}

test('concurrent same-key freeze retries serialization and replays exactly one report/queue/audit',{skip},async()=>{
 const f=await fixture(),p=await preparation(f),input=request(p),[a,b]=await Promise.all([freeze(f,input),freeze(f,input)]);
 assert.deepEqual(a.report,b.report);assert.deepEqual([a.replayed,b.replayed].sort(),[false,true]);assert.deepEqual(await counts(f),{reports:1,queues:1,audits:1});
});

test('concurrent different keys for one preparation and different preparations for one weekly scope conflict',{skip},async()=>{
 for(const samePreparation of [true,false]){
  const f=await fixture(),a=await preparation(f),b=samePreparation?a:await preparation(f);
  const results=await Promise.allSettled([freeze(f,request(a)),freeze(f,request(b))]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(results.find(x=>x.status==='rejected').reason.code,samePreparation?'PREPARATION_ALREADY_FROZEN':'REPORT_SCOPE_EXISTS');assert.deepEqual(await counts(f),{reports:1,queues:1,audits:1});
 }
});

test('campaign edit waiting ahead of freeze invalidates the snapshot after lock/retry',{skip},async()=>{
 const f=await fixture(),p=await preparation(f),lock=await admin.connect();let pending;
 try{
  await lock.query('BEGIN');await lock.query("UPDATE campaigns SET name='QA EDIT WHILE FREEZE WAITS' WHERE business_id=$1 AND id=$2",[f.b,f.c]);
  let pid;pending=transaction(f,async tx=>{pid=tx.processID;return freezeMarketingReport(tx,f.b,f.c,request(p));});const handled=pending.then(()=>null,e=>e);
  for(let i=0;i<100&&!pid;i++)await delay(10);assert.ok(pid);await waitForBlocked(pid);
  // A normal campaign writer audits while freeze holds NO KEY UPDATE on Business; its FK KEY SHARE must not deadlock.
  await lock.query("INSERT INTO change_events(business_id,entity_type,entity_id,event_type,actor_kind,request_id) VALUES($1,'campaigns',$2,'update','local_operator','qa-waiting-edit')",[f.b,f.c]);
  await lock.query('COMMIT');const error=await handled;assert.equal(error.code,'SOURCE_STALE');assert.deepEqual(await counts(f),{reports:0,queues:0,audits:0});
 }finally{await lock.query('ROLLBACK');lock.release();await pending?.catch(()=>{});}
});

test('expiry is checked after waiting, rather than against transaction-start time',{skip},async()=>{
 const f=await fixture(),p=await preparation(f);
 // Owner mutation is confined to this initially empty test-owned QA database; only synthetic preparation timestamp changes.
 const owner=await admin.connect();await owner.query('BEGIN');try{
  await owner.query('ALTER TABLE zuri_go.marketing_report_preparations DISABLE TRIGGER marketing_append_only');
  await owner.query(`WITH deadline AS MATERIALIZED (SELECT date_trunc('milliseconds',clock_timestamp())+interval '3 seconds' t), altered AS (
   SELECT p.id,d.t,jsonb_set(p.canonical_preview::jsonb,'{capturedAt}',to_jsonb(marketing_time(d.t-interval '15 minutes'))) v FROM marketing_report_preparations p CROSS JOIN deadline d WHERE p.business_id=$1 AND p.id=$2)
   UPDATE marketing_report_preparations p SET expires_at=a.t,captured_at=a.t-interval '15 minutes',canonical_preview=marketing_canonical(a.v),preview_hash=marketing_hash(a.v) FROM altered a WHERE p.id=a.id`,[f.b,p.preparation.id]);
  await owner.query('ALTER TABLE zuri_go.marketing_report_preparations ENABLE TRIGGER marketing_append_only');await owner.query('COMMIT');
 }catch(e){await owner.query('ROLLBACK');throw e;}finally{owner.release();}
 const lock=await admin.connect();let pending;
 try{
  await lock.query('BEGIN');await lock.query('SELECT id FROM businesses WHERE id=$1 FOR UPDATE',[f.b]);let pid;
  pending=transaction(f,async tx=>{pid=tx.processID;return freezeMarketingReport(tx,f.b,f.c,request(p));});const handled=pending.then(()=>null,e=>e);
  for(let i=0;i<100&&!pid;i++)await delay(10);assert.ok(pid);await waitForBlocked(pid);await delay(3200);await lock.query('COMMIT');const error=await handled;assert.equal(error.code,'PREPARATION_EXPIRED');assert.deepEqual(await counts(f),{reports:0,queues:0,audits:0});
 }finally{await lock.query('ROLLBACK');lock.release();await pending?.catch(()=>{});}
});

test('migration grant reconciliation hides intermediate INSERT privileges and rolls them back on interruption',{skip},async()=>{
 const f=await fixture(),source=await readFile(new URL('../migrate.mjs',import.meta.url),'utf8');
 const batch=source.slice(source.indexOf('// Keep intermediate broad grants invisible;'),source.indexOf("console.log('Zuri-Go schema 12"));
 const statements=[...batch.matchAll(/await client.query\('([^']+)'\)/g)].map(m=>m[1]);
 assert.equal(statements[0],'BEGIN');assert.deepEqual(statements.slice(-2),['COMMIT','ROLLBACK']);
 const owner=await admin.connect(),caller=await runtime.connect();
 try{
  await caller.query("SELECT set_config('zuri_go.business_id',$1,false),set_config('zuri_go.viewer_kind','operator',false)",[f.b]);
  await owner.query(statements[0]);await owner.query(statements[1]);await owner.query(statements[2]);
  assert.equal((await caller.query("SELECT has_table_privilege(current_user,'zuri_go.marketing_report_associations','INSERT') allowed")).rows[0].allowed,false);
  await assert.rejects(caller.query("INSERT INTO marketing_report_associations(business_id,source_deployment_id,external_binding_id,parent_tenant_id,parent_business_id,parent_initiative_id,reviewed_at,review_ref) VALUES($1,'forged-source','forged-binding','qa-tenant','qa-business','qa-initiative',clock_timestamp(),'fake-review')",[f.b]),e=>e.code==='42501');
  await owner.query('ROLLBACK');
  assert.equal((await caller.query("SELECT has_table_privilege(current_user,'zuri_go.marketing_report_associations','INSERT') allowed")).rows[0].allowed,false);
  // Execute the exact complete migrator batch (omit the catch-only ROLLBACK after its COMMIT).
  for(const statement of statements.slice(0,-1))await owner.query(statement);
  for(const table of ['marketing_report_associations','marketing_report_preparations','marketing_reports','marketing_report_outbox'])assert.deepEqual((await caller.query("SELECT has_table_privilege(current_user,$1,'INSERT') i,has_table_privilege(current_user,$1,'UPDATE') u,has_table_privilege(current_user,$1,'DELETE') d",['zuri_go.'+table])).rows[0],{i:false,u:false,d:false});
  assert.equal((await owner.query('SELECT count(*)::int n FROM marketing_report_associations WHERE business_id=$1',[f.b])).rows[0].n,1);
 }finally{await owner.query('ROLLBACK');owner.release();caller.release();}
});
