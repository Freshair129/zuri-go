// @trace verifies AC-015-001-01, AC-015-001-02, AC-015-001-03, AC-015-002-03, AC-015-002-04, AC-015-003-01, AC-015-003-02, AC-015-003-03
// Optional disposable WASM PostgreSQL QA; never opens application config, a network database, or user storage.
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createCampaign} from '../../web/src/content/shared/model.mjs';
import {canonicalHash,previewMarketingReport,readMarketingReportSource} from '../marketing-report.mjs';
import {buildMarketingEnvelope,canonicalText,prepareMarketingReport,freezeMarketingReport,readMarketingReport} from '../marketing-report-ledger.mjs';

const modulePath=process.env.ZURI_GO_MARKETING_QA_MODULE;
let db;const skip=modulePath?false:'NOT_RUN: isolated PGlite QA module not configured';
const window={start:'2026-09-21',endExclusive:'2026-09-28',timezone:'Asia/Bangkok',asOf:'2026-09-28T00:00:00+07:00'};
const tables=['marketing_report_associations','marketing_report_preparations','marketing_reports','marketing_report_outbox'];
before(async()=>{
 if(!modulePath)return;
 const root=resolve('.local/marketing-qa/node_modules/@electric-sql/pglite');
 assert.equal(resolve(modulePath),resolve(root,'dist/index.js'),'QA import must be the explicit ignored local test dependency');
 const {PGlite}=await import(pathToFileURL(modulePath));const {pgcrypto}=await import(pathToFileURL(resolve(root,'dist/contrib/pgcrypto.js')));
 db=new PGlite({extensions:{pgcrypto}});await db.exec('CREATE ROLE zuri_go_app;');
 const folder=new URL('../migrations/',import.meta.url);
 for(const file of (await readdir(folder)).filter(f=>/^\d{3}_.+\.sql$/.test(f)).sort())await db.exec(await readFile(new URL(file,folder),'utf8'));
 await db.exec('GRANT USAGE ON SCHEMA zuri_go TO zuri_go_app; GRANT SELECT ON ALL TABLES IN SCHEMA zuri_go TO zuri_go_app; SET search_path TO zuri_go,public;');
});
after(async()=>{if(db)await db.close();});

async function fixture(change=()=>{}){
 await db.exec('RESET ROLE;');const b=randomUUID(),c=randomUUID(),a=randomUUID();const state=createCampaign('ข้อมูลส่วนตัว QA NEVER EXPORT','leads',false);
 state.cap=1234.125;state.targets={low:0,mid:12.5,high:50};state.sources.ads='2026-09-24';state.windowDays=14;
 state.reviews=[{id:'review-qa',date:'2026-09-25',notes:'PRIVATE PHONE QA',snapshot:{settings:{version:1},gate:{status:'DATA_HOLD'},private:'SECRET QA'}}];change(state);
 await db.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[b,'ISOLATED SYNTHETIC QA',b]);
 await db.query("INSERT INTO campaigns(id,business_id,code,name,objective) VALUES($1,$2,'CAM-0001','QA','leads')",[c,b]);
 await db.query('INSERT INTO campaign_states(business_id,campaign_id,state_json,payload_hash) VALUES($1,$2,$3,$4)',[b,c,JSON.stringify(state),canonicalHash(state)]);
 await db.query("INSERT INTO marketing_report_associations(id,business_id,source_deployment_id,external_binding_id,parent_tenant_id,parent_business_id,parent_initiative_id,reviewed_at,review_ref) VALUES($1,$2,'qa-local','qa-binding','qa-tenant','qa-business','qa-initiative',clock_timestamp(),'qa-review')",[a,b]);
 await scope(b);return {b,c,a,state};
}
async function scope(b,kind='operator'){await db.exec('RESET ROLE; SET ROLE zuri_go_app;');await db.query("SELECT set_config('zuri_go.business_id',$1,false),set_config('zuri_go.viewer_kind',$2,false)",[b,kind]);}
const tx=()=>({query:db.query.bind(db),zuriViewer:{kind:'operator'}});
const prepare=f=>prepareMarketingReport(tx(),f.b,f.c,{idempotencyKey:randomUUID(),associationId:f.a,window});
const request=p=>({idempotencyKey:randomUUID(),preparationId:p.preparation.id,expectedPreviewHash:p.preparation.preview.previewHash,expectedSourceRevision:p.preparation.preview.sourceRevision});
const counts=async b=>(await db.query("SELECT (SELECT count(*)::int FROM marketing_reports WHERE business_id=$1) reports,(SELECT count(*)::int FROM marketing_report_outbox WHERE business_id=$1) queues,(SELECT count(*)::int FROM change_events WHERE business_id=$1 AND entity_type='marketing_reports') audits",[b])).rows[0];
async function expirePreparation(id){
 await db.exec('RESET ROLE; ALTER TABLE marketing_report_preparations DISABLE TRIGGER marketing_append_only;');
 try{await db.query(`WITH altered AS (SELECT id,captured_at-interval '16 minutes' t,jsonb_set(canonical_preview::jsonb,'{capturedAt}',to_jsonb(marketing_time(captured_at-interval '16 minutes'))) v FROM marketing_report_preparations WHERE id=$1)
 UPDATE marketing_report_preparations p SET captured_at=a.t,expires_at=a.t+interval '15 minutes',canonical_preview=marketing_canonical(a.v),preview_hash=marketing_hash(a.v) FROM altered a WHERE p.id=a.id`,[id]);}
 finally{await db.exec('ALTER TABLE marketing_report_preparations ENABLE TRIGGER marketing_append_only;');}
}

test('SQL migration and canonical JS/SQL golden vectors, Unicode values and numeric/key notation',{skip},async()=>{
 const f=await fixture();await db.exec('RESET ROLE;');
 for(const value of [{z:[1,0.1,0.000001,1e-7,1e21,-0],a:'ภาษาไทย 😀 \n \\ "'},{'12':'b','2':'a',a:{z:false,a:null}},[1,2],[2,1]]){
  assert.equal((await db.query('SELECT marketing_canonical($1::jsonb) bytes,marketing_hash($1::jsonb) hash',[JSON.stringify(value)])).rows[0].bytes,canonicalText(value));
  assert.equal((await db.query('SELECT marketing_hash($1::jsonb) hash',[JSON.stringify(value)])).rows[0].hash,canonicalHash(value));
 }
 await scope(f.b);
});

test('SQL preparation matches P1 safe projection; replay keeps original time/hash/expiry after source edit',{skip},async()=>{
 const f=await fixture(),input={idempotencyKey:randomUUID(),associationId:f.a,window};
 const result=await prepareMarketingReport(tx(),f.b,f.c,input);assert.equal(result.replayed,false);
 const source=await readMarketingReportSource(tx(),f.b,f.c);source.capturedAt=result.preparation.preview.capturedAt;
 assert.deepEqual(result.preparation.preview,previewMarketingReport(source,window));assert.ok(!/SECRET QA|PHONE QA|ข้อมูลส่วนตัว/.test(JSON.stringify(result)));
 await db.exec('RESET ROLE;');await db.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[f.b]);await scope(f.b);
 assert.deepEqual(await prepareMarketingReport(tx(),f.b,f.c,input),{...result,replayed:true});
 await assert.rejects(prepareMarketingReport(tx(),f.b,f.c,{...input,window:{...window,asOf:'2026-09-29T00:00:00Z'}}),e=>e.code==='IDEMPOTENCY_CONFLICT');
});

test('atomic freeze has exact JS/SQL envelope parity, immutable read/replay and one queue/audit',{skip},async()=>{
 const f=await fixture(),p=await prepare(f),input=request(p),before=await readMarketingReportSource(tx(),f.b,f.c);
 const result=await db.transaction(client=>freezeMarketingReport({query:client.query.bind(client),zuriViewer:{kind:'operator'}},f.b,f.c,input));
 assert.equal(result.replayed,false);const wire=result.report.envelope;
 const expected=buildMarketingEnvelope(p.preparation,{source_deployment_id:'qa-local',external_binding_id:'qa-binding',parent_initiative_id:'qa-initiative'},{reportId:wire.reportId,frozenAt:wire.frozenAt});
 assert.deepEqual(wire,expected.envelope);assert.equal(result.report.canonicalEnvelope,expected.bytes);assert.equal(result.report.state,'QUEUED');
 assert.deepEqual(await counts(f.b),{reports:1,queues:1,audits:1});assert.deepEqual(await readMarketingReport(tx(),f.b,wire.reportId),result.report);
 const after=await readMarketingReportSource(tx(),f.b,f.c);assert.deepEqual({...after,capturedAt:before.capturedAt},before);
 await db.exec('RESET ROLE;');await db.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[f.b]);await scope(f.b);
 assert.deepEqual(await freezeMarketingReport(tx(),f.b,f.c,input),{...result,replayed:true});
 await assert.rejects(freezeMarketingReport(tx(),f.b,f.c,{...input,expectedPreviewHash:'a'.repeat(64)}),e=>e.code==='IDEMPOTENCY_CONFLICT');
 await assert.rejects(freezeMarketingReport(tx(),f.b,f.c,{...input,idempotencyKey:randomUUID()}),e=>e.code==='PREPARATION_ALREADY_FROZEN');
 const second=await prepare(f);await assert.rejects(freezeMarketingReport(tx(),f.b,f.c,request(second)),e=>e.code==='REPORT_SCOPE_EXISTS');
 await db.exec('RESET ROLE;');await db.query('UPDATE marketing_report_associations SET active=false WHERE business_id=$1 AND id=$2',[f.b,f.a]);await scope(f.b);
 await assert.rejects(freezeMarketingReport(tx(),f.b,f.c,input),e=>e.code==='ASSOCIATION_DENIED');await assert.rejects(readMarketingReport(tx(),f.b,wire.reportId),e=>e.status===404);
});

test('every source revision/hash or confirmed preview mismatch rejects before report/queue/audit writes',{skip},async()=>{
 for(const mutate of [async f=>db.query('UPDATE campaigns SET name=name||\' edit\' WHERE id=$1',[f.c]),async f=>db.query('UPDATE campaign_states SET row_version=row_version+1 WHERE campaign_id=$1',[f.c]),async f=>db.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[f.b]),async f=>{const state={...f.state,cap:42};return db.query('UPDATE campaign_states SET state_json=$2,payload_hash=$3 WHERE campaign_id=$1',[f.c,JSON.stringify(state),canonicalHash(state)]);}]){
  const f=await fixture(),p=await prepare(f);await db.exec('RESET ROLE;');await mutate(f);await scope(f.b);
  await assert.rejects(freezeMarketingReport(tx(),f.b,f.c,request(p)),e=>e.code==='SOURCE_STALE');assert.deepEqual(await counts(f.b),{reports:0,queues:0,audits:0});
 }
 const f=await fixture(),p=await prepare(f);await assert.rejects(freezeMarketingReport(tx(),f.b,f.c,{...request(p),expectedPreviewHash:'a'.repeat(64)}),e=>e.code==='PREVIEW_MISMATCH');
});

test('expiry checks server clock; committed replay survives expiry; stale association version stays denied',{skip},async()=>{
 const f=await fixture(),p=await prepare(f);
 // Only this disposable in-memory QA owner can replace the timestamp to avoid a 15-minute sleep.
 await expirePreparation(p.preparation.id);await scope(f.b);
 await assert.rejects(freezeMarketingReport(tx(),f.b,f.c,request(p)),e=>e.code==='PREPARATION_EXPIRED');assert.deepEqual(await counts(f.b),{reports:0,queues:0,audits:0});
 const g=await fixture(),q=await prepare(g),input=request(q),frozen=await freezeMarketingReport(tx(),g.b,g.c,input);
 await expirePreparation(q.preparation.id);await scope(g.b);
 assert.deepEqual(await freezeMarketingReport(tx(),g.b,g.c,input),{...frozen,replayed:true});
 await db.exec('RESET ROLE;');await db.query('UPDATE marketing_report_associations SET active=true WHERE id=$1',[g.a]);await scope(g.b);
 await assert.rejects(freezeMarketingReport(tx(),g.b,g.c,input),e=>e.code==='ASSOCIATION_STALE');
});

test('fault between report/queue and queue/audit rolls back all rows; source remains unchanged',{skip},async()=>{
 for(const table of ['marketing_report_outbox','change_events']){
  const f=await fixture(),p=await prepare(f),source=await readMarketingReportSource(tx(),f.b,f.c);
  await db.exec(`RESET ROLE; CREATE OR REPLACE FUNCTION qa_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'QA FAULT'; END $$; CREATE TRIGGER qa_fault BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION qa_fail();`);await scope(f.b);
  await assert.rejects(db.transaction(client=>freezeMarketingReport({query:client.query.bind(client),zuriViewer:{kind:'operator'}},f.b,f.c,request(p))),/QA FAULT/);
  assert.deepEqual(await counts(f.b),{reports:0,queues:0,audits:0});const after=await readMarketingReportSource(tx(),f.b,f.c);assert.deepEqual({...after,capturedAt:source.capturedAt},source);
  await db.exec(`RESET ROLE; DROP TRIGGER qa_fault ON ${table};`);
 }
});

test('direct SQL cannot forge caller evidence or read/write as Guest/Member; broad migrator grants are revoked on rerun',{skip},async()=>{
 const f=await fixture(),p=await prepare(f);await freezeMarketingReport(tx(),f.b,f.c,request(p));
 for(const table of tables){for(const sql of [`INSERT INTO ${table} DEFAULT VALUES`,`UPDATE ${table} SET business_id=business_id`,`DELETE FROM ${table}`])await assert.rejects(db.exec(sql),e=>e.code==='42501');}
 for(const kind of ['guest','member']){await scope(f.b,kind);for(const table of tables)assert.equal((await db.query(`SELECT * FROM ${table}`)).rows.length,0);assert.equal((await db.query("SELECT * FROM change_events WHERE entity_type='marketing_reports'")).rows.length,0);await assert.rejects(db.query('SELECT marketing_freeze($1,$2,$3::jsonb)',[f.b,f.c,JSON.stringify(request(p))]),/REPORT_DENIED/);}
 await scope(f.b);const forged={idempotencyKey:randomUUID(),associationId:f.a,window,preview:{private:'CORRECTLY HASHED PRIVATE'},previewHash:canonicalHash({private:'CORRECTLY HASHED PRIVATE'})};
 await assert.rejects(db.query('SELECT marketing_prepare($1,$2,$3::jsonb)',[f.b,f.c,JSON.stringify(forged)]),/REQUEST_INVALID/);
 await assert.rejects(db.query('SELECT marketing_freeze($1,$2,$3::jsonb)',[f.b,f.c,JSON.stringify({...request(p),envelope:{payload:'FAKE'},payloadHash:canonicalHash({payload:'FAKE'})})]),/REQUEST_INVALID/);
 await assert.rejects(db.query('SELECT marketing_projection($1,$2,$3::jsonb,clock_timestamp())',[f.b,f.c,JSON.stringify(window)]),e=>e.code==='42501');
 await db.exec('RESET ROLE;');for(const table of tables.slice(1))await assert.rejects(db.exec(`UPDATE ${table} SET business_id=business_id`),/MARKETING_IMMUTABLE/);await scope(f.b);
 await scope(randomUUID());assert.equal((await db.query('SELECT * FROM marketing_report_preparations')).rows.length,0);
 await assert.rejects(db.query('SELECT marketing_prepare($1,$2,$3::jsonb)',[f.b,f.c,JSON.stringify({idempotencyKey:randomUUID(),associationId:f.a,window})]),/REPORT_DENIED/);
 await db.exec('RESET ROLE; GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA zuri_go TO zuri_go_app;');
 const migrator=await readFile(new URL('../migrate.mjs',import.meta.url),'utf8');const revoke=migrator.match(/await client.query\('(REVOKE INSERT,UPDATE,DELETE ON zuri_go\.marketing_report_associations[^']+)'\)/)[1];await db.exec(revoke);await scope(f.b);
 for(const table of tables){assert.deepEqual((await db.query("SELECT has_table_privilege('zuri_go_app',$1,'INSERT') i,has_table_privilege('zuri_go_app',$1,'UPDATE') u,has_table_privilege('zuri_go_app',$1,'DELETE') d",['zuri_go.'+table])).rows[0],{i:false,u:false,d:false});}
});

test('source incomplete, invalid raw hash and directly injected private fields cannot produce a preparation',{skip},async()=>{
 const f=await fixture();await db.exec('RESET ROLE;');await db.query('DELETE FROM campaign_states WHERE campaign_id=$1',[f.c]);await scope(f.b);await assert.rejects(prepare(f),e=>e.code==='SOURCE_INCOMPLETE');
 const g=await fixture();await db.exec('RESET ROLE;');await db.query("UPDATE campaign_states SET payload_hash=repeat('a',64) WHERE campaign_id=$1",[g.c]);await scope(g.b);await assert.rejects(prepare(g),e=>e.code==='SOURCE_INVALID');
});
