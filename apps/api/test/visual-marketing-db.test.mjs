// @trace verifies FR-014-001, FR-014-003, FR-014-006, FR-014-008, FR-014-009, FR-014-010
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {handleApi,sendError} from '../api.mjs';
import pg from 'pg';
import {config} from '../config.mjs';
import {pool,transaction} from '../db.mjs';
import {OPERATOR,session} from '../viewer.mjs';
import {passwordHash} from '../team-auth.mjs';
import {createProject} from '../projects.mjs';
import {visualApi} from '../visual-marketing/api.mjs';
import {claim,finish} from '../visual-marketing/jobs.mjs';
import {STAGES,CHECKS} from '../visual-marketing/contracts.mjs';
const admin=new pg.Client({connectionString:config().adminUrl});await admin.connect();
after(async()=>{await admin.end();await pool.end();});
const b=randomUUID(),m0=randomUUID(),m1=randomUUID();
await transaction(b,OPERATOR,c=>c.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[b,'QA ONLY Visual Studio',b]));
for(const [id,name] of [[m0,'Owner'],[m1,'Reviewer']]){
 await admin.query('INSERT INTO zuri_go.members(id,business_id,display_name) VALUES($1,$2,$3)',[id,b,name]);
 await admin.query('INSERT INTO zuri_go.member_credentials(business_id,member_id,password_hash) VALUES($1,$2,$3)',[b,id,await passwordHash(randomUUID())]);
}
const as=(who,fn)=>transaction(b,who==='operator'?OPERATOR:who?session({m:who,cv:1}):null,fn);
const api=(path,method='GET',input=null,who='operator')=>as(who,c=>visualApi(c,b,path,method,input));
const key=()=>randomUUID();
async function setup(visibility='business',strategy=false){
 const p=await as('operator',c=>createProject(c,b,{name:'QA creative '+key().slice(0,8),owner_member_id:m0,visibility}));
 await api('/projects','POST',{project_id:p.id,idempotency_key:key(),strategy_approval_required:strategy});
 const brand=await api('/brand-profiles','POST',{project_id:p.id,idempotency_key:key(),confirmed:true,profile:{identity:'QA Tea'}});
 const payload={project_id:p.id,brand_profile_id:brand.id,objective:'awareness',product:'ชา',audience:'คนทำงาน',message:'พักกับชา',channel:'facebook',format:'image',aspect_ratio:'1:1',cta:'ดูรายละเอียด'};
 const input={project_id:p.id,idempotency_key:key(),row_version:1,brief:payload},brief=await api('/briefs','POST',input);assert.equal((await api('/briefs','POST',input)).id,brief.id);return {p,brief,payload};
}
async function complete(p,brief){for(const stage of STAGES){const d=await api('/projects/'+p.id);await api(`/projects/${p.id}/stages`,'POST',{row_version:d.project.row_version,idempotency_key:key(),stage,input_hash:brief.input_hash,output:{text:stage+' ชา',claims:[]}});}return api('/projects/'+p.id);}
test('AC-014-001-01 / AC-014-003-01 manual vertical slice persists, reloads and binds owner approval',async()=>{
 const {p,brief}=await setup();let d=await complete(p,brief);assert.equal(d.project.stage,'QA');assert.equal(d.runs.length,11);
 const item=d.artifacts.find(a=>a.kind==='BUNDLE'),input={row_version:d.project.row_version,idempotency_key:key(),assessment:Object.fromEntries(CHECKS.map(c=>[c,true]))};
 const qa=await api(`/artifacts/${item.id}/review`,'POST',input,m1);assert.equal(qa.result.status,'pass');
 const hashes=(await admin.query('SELECT content_hash,canonical_hash FROM zuri_go.visual_artifacts WHERE business_id=$1 AND id=$2',[b,item.id])).rows[0];assert.equal(item.content_hash,hashes.canonical_hash);assert.match(item.content_hash,/^[a-f0-9]{64}$/);assert.notEqual(hashes.content_hash,hashes.canonical_hash,'API hash aliases the database canonical hash, preserving the legacy hash');
 assert.deepEqual(await api(`/artifacts/${item.id}/review`,'POST',input,m1),JSON.parse(JSON.stringify(qa)),'receipt replay');
 await assert.rejects(api(`/artifacts/${item.id}/review`,'POST',{...input,assessment:{}},m1),{code:'IDEMPOTENCY_CONFLICT'});
 d=await api('/projects/'+p.id);const decision={row_version:d.project.row_version,idempotency_key:key(),artifact_hash:item.content_hash,qa_revision:qa.id,decision:'approve'};
 await assert.rejects(api(`/artifacts/${item.id}/approve`,'POST',decision,m1),{code:'APPROVAL_DENIED'});
 await assert.rejects(api(`/artifacts/${item.id}/approve`,'POST',{...decision,artifact_hash:'f'.repeat(64)},m0),{code:'STALE'});
 const out=await api(`/artifacts/${item.id}/approve`,'POST',decision,m0);assert.equal(out.actor_member_id,m0);
 d=await api('/projects/'+p.id);assert.equal(d.project.stage,'READY_FOR_CAMPAIGN');assert.equal(d.assets.length,1);
 const download=await api(`/assets/${d.assets[0].id}/download`);assert.match(download.text,/ART_DIRECTION/);assert.equal(createHash('sha256').update(download.text).digest('hex'),d.assets[0].metadata.checksum);
 await assert.rejects(api('/projects/'+p.id,'GET',null,null),{code:'NOT_FOUND'});
 await assert.rejects(api(`/assets/${d.assets[0].id}`,'GET',null,null),{code:'NOT_FOUND'});
});
test('approved claims require bounded source references that persist into reloaded QA context',async()=>{
 const {p,payload}=await setup();const profile={identity:'QA claims',approved_claims:['approved QA claim']};
 await assert.rejects(api('/brand-profiles','POST',{project_id:p.id,idempotency_key:key(),confirmed:true,profile}),{code:'CLAIM_SOURCE_REQUIRED'});
 await assert.rejects(api('/brand-profiles','POST',{project_id:p.id,idempotency_key:key(),confirmed:true,profile,source_refs:Array(21).fill('https://example.test/source')}),{code:'FIELD_INVALID'});
 await assert.rejects(api('/brand-profiles','POST',{project_id:p.id,idempotency_key:key(),confirmed:true,profile,source_refs:['x'.repeat(2001)]}),{code:'FIELD_INVALID'});
 const refs=['  https://example.test/approved-claim  '],brand=await api('/brand-profiles','POST',{project_id:p.id,idempotency_key:key(),confirmed:true,profile,source_refs:refs});assert.deepEqual(brand.source_refs,['https://example.test/approved-claim']);
 let d=await api('/projects/'+p.id);const brief=await api('/briefs','POST',{project_id:p.id,row_version:d.project.row_version,idempotency_key:key(),brief:{...payload,brand_profile_id:brand.id,proof_points:['approved QA claim']}});
 d=await api('/projects/'+p.id);assert.deepEqual(d.brands.find(row=>row.id===brand.id).source_refs,['https://example.test/approved-claim']);d=await complete(p,brief);
 const item=d.artifacts.find(a=>a.kind==='BUNDLE'),qa=await api(`/artifacts/${item.id}/review`,'POST',{row_version:d.project.row_version,idempotency_key:key(),assessment:Object.fromEntries(CHECKS.map(c=>[c,true]))},m1);
 const finding=qa.result.findings.find(row=>row.category==='claim_source_refs');assert.equal(finding.status,'pass');assert.deepEqual(finding.evidenceRefs,['https://example.test/approved-claim']);assert.equal(qa.result.status,'pass');
});
test('AC-014-009-01 / AC-014-009-02 forced RLS excludes Guest and widening does not expose frozen context',async()=>{
 const {p}=await setup('restricted');
 await assert.rejects(api('/projects/'+p.id,'GET',null,m1),{code:'NOT_FOUND'});
 await admin.query("UPDATE zuri_go.projects SET visibility='business' WHERE id=$1",[p.id]);
 await assert.rejects(api('/projects/'+p.id,'GET',null,m1),{code:'NOT_FOUND'});
 assert.equal((await api('/projects/'+p.id,'GET',null,m0)).project.project_id,p.id);
 await assert.rejects(api('/brand-profiles','POST',{project_id:p.id,idempotency_key:key(),confirmed:true,profile:{identity:'x'}},null),{code:'AUTH_REQUIRED'});
 assert.equal((await as(null,c=>c.query('SELECT * FROM visual_briefs'))).rowCount,0);
 const other=randomUUID();assert.equal((await transaction(other,OPERATOR,c=>c.query('SELECT * FROM visual_projects'))).rowCount,0);
});
test('AC-014-008-01 public projection contains only approved output; private context remains hidden',async()=>{
 const {p,brief,payload}=await setup('public');let d=await complete(p,brief);const item=d.artifacts.find(a=>a.kind==='BUNDLE');
 assert.equal((await api('/projects','GET',null,null)).public_outputs.some(x=>x.project_id===p.id),false);
 const qa=await api(`/artifacts/${item.id}/review`,'POST',{row_version:d.project.row_version,idempotency_key:key(),assessment:Object.fromEntries(CHECKS.map(c=>[c,true]))});d=await api('/projects/'+p.id);
 await api(`/artifacts/${item.id}/approve`,'POST',{row_version:d.project.row_version,idempotency_key:key(),artifact_hash:item.content_hash,qa_revision:qa.id,decision:'approve'},m0);
 const projected=(await api('/projects','GET',null,null)).public_outputs.find(x=>x.project_id===p.id);assert.ok(projected.payload.copy);assert.equal(projected.payload.outputs,undefined);
 await assert.rejects(api('/briefs/'+brief.id,'GET',null,null),{code:'NOT_FOUND'});
 d=await api('/projects/'+p.id);await api('/briefs','POST',{project_id:p.id,row_version:d.project.row_version,idempotency_key:key(),brief:{...payload,message:'new revision'}});
 assert.equal((await api('/projects','GET',null,null)).public_outputs.some(x=>x.project_id===p.id),false);
 assert.equal((await api('/projects/'+p.id)).decisions.length,1,'approval is historical');
});
test('R2 runtime role keeps approved public output immutable except one-way retraction',async()=>{
 const {p,brief}=await setup('public');let d=await complete(p,brief);const item=d.artifacts.find(a=>a.kind==='BUNDLE');
 const qa=await api(`/artifacts/${item.id}/review`,'POST',{row_version:d.project.row_version,idempotency_key:key(),assessment:Object.fromEntries(CHECKS.map(c=>[c,true]))},m1);d=await api('/projects/'+p.id);
 await api(`/artifacts/${item.id}/approve`,'POST',{row_version:d.project.row_version,idempotency_key:key(),artifact_hash:item.content_hash,qa_revision:qa.id,decision:'approve'},m0);
 const projection=(await as(m1,c=>c.query('SELECT * FROM visual_public_outputs WHERE business_id=$1 AND project_id=$2',[b,p.id]))).rows[0];assert.ok(projection);
 try{
  const forged={...projection.payload,copy:'UNAPPROVED QA MARKER',content_hash:'f'.repeat(64)};
  await assert.rejects(as(m1,c=>c.query('UPDATE visual_public_outputs SET payload=$3 WHERE business_id=$1 AND project_id=$2 AND artifact_id=$4',[b,p.id,forged,item.id])),{code:'42501'});
  await assert.rejects(as(m1,c=>c.query('UPDATE visual_public_outputs SET artifact_id=$3 WHERE business_id=$1 AND project_id=$2 AND artifact_id=$3',[b,p.id,item.id])),{code:'42501'});
  await assert.rejects(as(m1,c=>c.query('UPDATE visual_public_outputs SET decision_id=$3 WHERE business_id=$1 AND project_id=$2 AND artifact_id=$4',[b,p.id,projection.decision_id,item.id])),{code:'42501'});
  const unchanged=(await as(m1,c=>c.query('SELECT payload,artifact_id,decision_id FROM visual_public_outputs WHERE business_id=$1 AND project_id=$2',[b,p.id]))).rows[0];
  assert.deepEqual(unchanged,{payload:projection.payload,artifact_id:projection.artifact_id,decision_id:projection.decision_id});
  assert.equal((await as(m1,c=>c.query('UPDATE visual_public_outputs SET active=false WHERE business_id=$1 AND project_id=$2 AND artifact_id=$3',[b,p.id,item.id]))).rowCount,1);
  assert.equal((await api('/projects','GET',null,null)).public_outputs.some(x=>x.project_id===p.id),false);
  assert.equal((await as(m1,c=>c.query('UPDATE visual_public_outputs SET active=true WHERE business_id=$1 AND project_id=$2 AND artifact_id=$3',[b,p.id,item.id]))).rowCount,0);
 }finally{
  await admin.query('UPDATE zuri_go.visual_public_outputs SET payload=$1,active=$2 WHERE business_id=$3 AND project_id=$4 AND artifact_id=$5',[projection.payload,projection.active,b,p.id,item.id]);
 }
});
test('R3 runtime DML cannot forge review, decision, or Guest-visible publication',async()=>{
 const {p,brief}=await setup('public');let d=await complete(p,brief);const item=d.artifacts.find(a=>a.kind==='BUNDLE');
 const assessment=Object.fromEntries(CHECKS.map(c=>[c,true]));
 await api(`/artifacts/${item.id}/review`,'POST',{row_version:d.project.row_version,idempotency_key:key(),assessment},m1);
 let forgedReview,forgedOwnerReview,forgedDecision,forgedOutput;
 try{
  try{forgedReview=(await as(m1,c=>c.query("INSERT INTO visual_reviews(business_id,project_id,artifact_id,artifact_hash,result,actor_kind,actor_member_id) VALUES($1,$2,$3,$4,$5,'member',$6) RETURNING id",[b,p.id,item.id,item.content_hash,{status:'pass',findings:[],blockingIssues:[]},m1]))).rows[0];}catch(e){forgedReview={error:e.code};}
  try{forgedOwnerReview=(await as(m0,c=>c.query("INSERT INTO visual_reviews(business_id,project_id,artifact_id,artifact_hash,result,actor_kind,actor_member_id) VALUES($1,$2,$3,$4,$5,'member',$6) RETURNING id",[b,p.id,item.id,item.content_hash,{status:'pass',findings:[],blockingIssues:[]},m0]))).rows[0];}catch(e){forgedOwnerReview={error:e.code};}
  d=await api('/projects/'+p.id);const qa=await api(`/artifacts/${item.id}/review`,'POST',{row_version:d.project.row_version,idempotency_key:key(),assessment},m1);
  const reviewId=forgedReview?.id||qa.id;
  try{forgedDecision=(await as(m0,c=>c.query("INSERT INTO visual_decisions(business_id,project_id,artifact_id,artifact_hash,review_id,decision,actor_kind,actor_member_id) VALUES($1,$2,$3,$4,$5,'approve','member',$6) RETURNING id",[b,p.id,item.id,item.content_hash,reviewId,m0]))).rows[0];}catch(e){forgedDecision={error:e.code};}
  const dNow=await api('/projects/'+p.id),approved=await api(`/artifacts/${item.id}/approve`,'POST',{row_version:dNow.project.row_version,idempotency_key:key(),artifact_hash:item.content_hash,qa_revision:qa.id,decision:'approve'},m0);
  await admin.query('DELETE FROM zuri_go.visual_public_outputs WHERE business_id=$1 AND project_id=$2 AND artifact_id=$3',[b,p.id,item.id]);
  try{forgedOutput=(await as(m0,c=>c.query('INSERT INTO visual_public_outputs(business_id,project_id,artifact_id,decision_id,payload) VALUES($1,$2,$3,$4,$5) RETURNING artifact_id',[b,p.id,item.id,approved.id,{copy:'R3 forged publication marker',visual_prompt:'unapproved',content_hash:item.content_hash}]))).rows[0];}catch(e){forgedOutput={error:e.code};}
  const guest=(await api('/projects','GET',null,null)).public_outputs.some(x=>x.project_id===p.id&&x.payload.copy==='R3 forged publication marker');
  assert.equal(forgedReview?.error,'42501','runtime INSERT into visual_reviews must be denied');
  assert.equal(forgedOwnerReview?.error,'42501','owner runtime INSERT into visual_reviews must be denied');
  assert.equal(forgedDecision?.error,'42501','runtime INSERT into visual_decisions must be denied');
  assert.equal(forgedOutput?.error,'42501','runtime INSERT into visual_public_outputs must be denied');
  assert.equal(guest,false,'Guest must not read caller-supplied publication payload');
 }finally{
  await admin.query('DELETE FROM zuri_go.visual_public_outputs WHERE business_id=$1 AND project_id=$2',[b,p.id]);
  await admin.query('DELETE FROM zuri_go.visual_decisions WHERE business_id=$1 AND project_id=$2',[b,p.id]);
  await admin.query('DELETE FROM zuri_go.visual_reviews WHERE business_id=$1 AND project_id=$2',[b,p.id]);
 }
});
test('RG-R3-001 review function enforces current Project audience after visibility narrows',async()=>{
 const {p,brief}=await setup('public');const d=await complete(p,brief),item=d.artifacts.find(a=>a.kind==='BUNDLE'),assessment=Object.fromEntries(CHECKS.map(c=>[c,true]));
 await admin.query("UPDATE zuri_go.projects SET visibility='restricted' WHERE business_id=$1 AND id=$2",[b,p.id]);
 const before=Number((await admin.query('SELECT count(*) FROM zuri_go.visual_reviews WHERE business_id=$1 AND project_id=$2 AND artifact_id=$3',[b,p.id,item.id])).rows[0].count);
 await assert.rejects(as(m1,c=>c.query('SELECT * FROM zuri_go.visual_record_review($1::uuid,$2::uuid,$3::uuid,$4::jsonb)',[b,p.id,item.id,assessment])),error=>error.code==='42501');
 const after=Number((await admin.query('SELECT count(*) FROM zuri_go.visual_reviews WHERE business_id=$1 AND project_id=$2 AND artifact_id=$3',[b,p.id,item.id])).rows[0].count);
 assert.equal(after,before,'excluded Member must not append a validated review');
 const allowed=(await as(m0,c=>c.query('SELECT * FROM zuri_go.visual_record_review($1::uuid,$2::uuid,$3::uuid,$4::jsonb)',[b,p.id,item.id,assessment]))).rows[0];
 assert.equal(allowed.validated,true,'current Project owner must retain the review path');assert.equal(allowed.validated_pass,true);
});
test('AC-014-006-01 / AC-014-006-02 job lease, restart, cancellation fence and bounded execution',async()=>{
 process.env.ZURI_GO_VISUAL_ENDPOINT='http://127.0.0.1:11434';process.env.ZURI_GO_VISUAL_MODEL='qa-fake';
 try{
  const {p,brief}=await setup(),d=await api('/projects/'+p.id),input={row_version:d.project.row_version,idempotency_key:key(),input_hash:brief.input_hash,authorize_local_model:true};
  await assert.rejects(api(`/projects/${p.id}/run`,'POST',input,m0),{code:'EXECUTOR_UNAVAILABLE'});
  const queued=await api(`/projects/${p.id}/run`,'POST',input),job=await as('operator',c=>claim(c,b));assert.equal(job.id,queued.job_id);
  assert.equal(await as('operator',c=>finish(c,b,{...job,lease_token:key()},{output:{text:'bad',claims:[]}})),false);
  await admin.query("UPDATE zuri_go.visual_jobs SET lease_expires_at=now()-interval '1 second' WHERE id=$1",[job.id]);
  const reclaimed=await as('operator',c=>claim(c,b));assert.notEqual(reclaimed.lease_token,job.lease_token);assert.equal(reclaimed.attempt,2);
  assert.equal(await as('operator',c=>finish(c,b,job,{output:{text:'stale',claims:[]}})),false);
  assert.equal(await as('operator',c=>finish(c,b,reclaimed,{output:{text:'research',claims:[]},model:'qa-fake'})),true);
  assert.equal((await api('/projects/'+p.id)).project.stage,'STRATEGY');
  const running=await as('operator',c=>claim(c,b)),state=await api('/jobs/'+job.id);
  await api(`/jobs/${job.id}/cancel`,'POST',{row_version:state.row_version,idempotency_key:key()});
  assert.equal(await as('operator',c=>finish(c,b,running,{output:{text:'cancelled',claims:[]}})),false);
  assert.equal((await api('/jobs/'+job.id)).state,'cancelled');
  const cancelled=await api('/jobs/'+job.id),retryInput={row_version:cancelled.row_version,idempotency_key:key(),authorize_local_model:true};
  const retried=await api('/jobs/'+job.id+'/retry','POST',retryInput);assert.notEqual(retried.job_id,job.id);assert.equal((await api('/jobs/'+job.id+'/retry','POST',retryInput)).job_id,retried.job_id);
  const next=await api('/jobs/'+retried.job_id);await api('/jobs/'+next.id+'/cancel','POST',{row_version:next.row_version,idempotency_key:key()});
 }finally{delete process.env.ZURI_GO_VISUAL_ENDPOINT;delete process.env.ZURI_GO_VISUAL_MODEL;}
});
test('AC-014-006-01 concurrent HTTP requests replay a single durable job; unknown authority fields are rejected',async()=>{
 process.env.ZURI_GO_VISUAL_ENDPOINT='http://127.0.0.1:11434';process.env.ZURI_GO_VISUAL_MODEL='qa-fake';
 const server=createServer(async(req,res)=>{try{await handleApi(req,res,new URL(req.url,'http://127.0.0.1'),{businessId:b,storage:'postgresql-local',principal:OPERATOR});}catch(e){sendError(res,e);}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const {p,brief}=await setup(),d=await api('/projects/'+p.id),input={row_version:d.project.row_version,idempotency_key:key(),input_hash:brief.input_hash,authorize_local_model:true},base=`http://127.0.0.1:${server.address().port}`,url=`${base}/api/zuri-go/v1/businesses/${b}/visual-marketing/projects/${p.id}/run`;
  const call=async body=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Zuri-Go':'1'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
  const results=await Promise.all([call(input),call(input)]);assert.deepEqual(results.map(r=>r.status),[202,202]);assert.equal(results[0].body.job_id,results[1].body.job_id);
  assert.equal((await call({...input,actor:'admin'})).status,422);
  assert.equal(results[0].body.status_url,`/api/zuri-go/v1/businesses/${b}/visual-marketing/jobs/${results[0].body.job_id}`);const followed=await fetch(new URL(results[0].body.status_url,base));assert.equal(followed.status,200);const followedBody=await followed.json();assert.equal(followedBody.id,results[0].body.job_id);assert.equal(followedBody.state,'queued');
  const j=await api('/jobs/'+results[0].body.job_id);await api('/jobs/'+j.id+'/cancel','POST',{row_version:j.row_version,idempotency_key:key()});
 }finally{await new Promise(resolve=>server.close(resolve));delete process.env.ZURI_GO_VISUAL_ENDPOINT;delete process.env.ZURI_GO_VISUAL_MODEL;}
});
test('new Brief and exhausted lease close their root runs terminally',async()=>{
 process.env.ZURI_GO_VISUAL_ENDPOINT='http://127.0.0.1:11434';process.env.ZURI_GO_VISUAL_MODEL='qa-fake';
 try{
  const first=await setup(),d=await api('/projects/'+first.p.id),cancelled=await api(`/projects/${first.p.id}/run`,'POST',{row_version:d.project.row_version,idempotency_key:key(),input_hash:first.brief.input_hash,authorize_local_model:true});
  await api('/briefs','POST',{project_id:first.p.id,row_version:d.project.row_version,idempotency_key:key(),brief:{...first.payload,message:'replacement Brief'}});
  assert.equal((await api('/jobs/'+cancelled.job_id)).state,'cancelled');const cancelledRun=(await admin.query('SELECT status,completed_at FROM zuri_go.visual_runs WHERE business_id=$1 AND project_id=$2 AND id=$3',[b,first.p.id,cancelled.run_id])).rows[0];assert.equal(cancelledRun.status,'cancelled');assert.ok(cancelledRun.completed_at);
  const second=await setup(),d2=await api('/projects/'+second.p.id),queued=await api(`/projects/${second.p.id}/run`,'POST',{row_version:d2.project.row_version,idempotency_key:key(),input_hash:second.brief.input_hash,authorize_local_model:true}),running=await as('operator',c=>claim(c,b));assert.equal(running.id,queued.job_id);
  await admin.query("UPDATE zuri_go.visual_jobs SET attempt=2,lease_expires_at=now()-interval '1 second' WHERE business_id=$1 AND id=$2",[b,queued.job_id]);assert.equal(await as('operator',c=>claim(c,b)),null);
  assert.equal((await api('/jobs/'+queued.job_id)).state,'failed');const failedRun=(await admin.query('SELECT status,completed_at FROM zuri_go.visual_runs WHERE business_id=$1 AND project_id=$2 AND id=$3',[b,second.p.id,queued.run_id])).rows[0];assert.equal(failedRun.status,'failed');assert.ok(failedRun.completed_at);
  const third=await setup(),d3=await api('/projects/'+third.p.id),stale=await api(`/projects/${third.p.id}/run`,'POST',{row_version:d3.project.row_version,idempotency_key:key(),input_hash:third.brief.input_hash,authorize_local_model:true});await admin.query("UPDATE zuri_go.visual_jobs SET revision=revision-1 WHERE business_id=$1 AND id=$2",[b,stale.job_id]);assert.equal(await as('operator',c=>claim(c,b)),null);
  assert.equal((await api('/jobs/'+stale.job_id)).state,'failed');const staleRun=(await admin.query('SELECT status,completed_at FROM zuri_go.visual_runs WHERE business_id=$1 AND project_id=$2 AND id=$3',[b,third.p.id,stale.run_id])).rows[0];assert.equal(staleRun.status,'failed');assert.ok(staleRun.completed_at);
 }finally{delete process.env.ZURI_GO_VISUAL_ENDPOINT;delete process.env.ZURI_GO_VISUAL_MODEL;}
});
test('AC-014-003-02 / AC-014-008-02 strategy gate, illegal stage, blocking QA and revoked credentials fail closed',async()=>{
 const {p,brief}=await setup('business',true);let d=await api('/projects/'+p.id);
 await assert.rejects(api(`/projects/${p.id}/stages`,'POST',{row_version:d.project.row_version,idempotency_key:key(),stage:'COPY',input_hash:brief.input_hash,output:{text:'jump'}}),{code:'STALE'});
 for(const stage of ['RESEARCH','STRATEGY']){d=await api('/projects/'+p.id);await api(`/projects/${p.id}/stages`,'POST',{row_version:d.project.row_version,idempotency_key:key(),stage,input_hash:brief.input_hash,output:{text:stage}});}
 d=await api('/projects/'+p.id);const decision={row_version:d.project.row_version,idempotency_key:key(),input_hash:brief.input_hash,decision:'approve'};
 await assert.rejects(api(`/projects/${p.id}/stages`,'POST',{...decision,stage:'CONCEPT',output:{text:'x'},decision:undefined}),{code:'FIELD_UNKNOWN'});
 await assert.rejects(api(`/projects/${p.id}/stages`,'POST',{row_version:d.project.row_version,idempotency_key:key(),input_hash:brief.input_hash,stage:'CONCEPT',output:{text:'x'}}),{code:'STRATEGY_APPROVAL_REQUIRED'});
 await assert.rejects(api(`/projects/${p.id}/strategy-decision`,'POST',decision,m1),{code:'APPROVAL_DENIED'});await api(`/projects/${p.id}/strategy-decision`,'POST',decision,m0);
 for(const stage of ['CONCEPT','COPY','ART_DIRECTION']){d=await api('/projects/'+p.id);await api(`/projects/${p.id}/stages`,'POST',{row_version:d.project.row_version,idempotency_key:key(),stage,input_hash:brief.input_hash,output:{text:stage}});}
 d=await api('/projects/'+p.id);const item=d.artifacts.find(a=>a.kind==='BUNDLE'),qa=await api(`/artifacts/${item.id}/review`,'POST',{row_version:d.project.row_version,idempotency_key:key(),assessment:{}});assert.equal(qa.result.status,'needs_revision');d=await api('/projects/'+p.id);
 await assert.rejects(api(`/artifacts/${item.id}/approve`,'POST',{row_version:d.project.row_version,idempotency_key:key(),artifact_hash:item.content_hash,qa_revision:qa.id,decision:'approve'},m0),{code:'STALE'});
 await admin.query('UPDATE zuri_go.member_credentials SET enabled=false WHERE business_id=$1 AND member_id=$2',[b,m1]);
 await assert.rejects(api('/projects/'+p.id,'GET',null,m1),{code:'NOT_FOUND'});
});
test('AC-014-005-03 invalid optional provider configuration preserves manual access',async()=>{
 process.env.ZURI_GO_VISUAL_ENDPOINT='not a URL';process.env.ZURI_GO_VISUAL_MODEL='qa-only';
 try{assert.equal((await api('/team')).local_model_available,false);assert.ok((await api('/projects')).projects.length);}finally{delete process.env.ZURI_GO_VISUAL_ENDPOINT;delete process.env.ZURI_GO_VISUAL_MODEL;}
});
