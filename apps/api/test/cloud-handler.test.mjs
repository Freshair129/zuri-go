import pg from 'pg';
import {sessionToken,sessionCookie} from '../team-auth.mjs';
import {saveMember,saveTask,addSource,saveReview,addBatch,commitBatch,reviewHash} from '../../web/src/content/meeting/model.mjs';
import {readFile} from 'node:fs/promises';
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {config} from '../config.mjs';
import {pool,transaction} from '../db.mjs';
import {OPERATOR} from '../viewer.mjs';
import {passwordHash} from '../team-auth.mjs';
const local=config(),business=randomUUID(),origin='https://zuri-qa.test';
Object.assign(process.env,{VERCEL:'1',ZURI_GO_DATABASE_URL:local.databaseUrl,ZURI_GO_BUSINESS_ID:business,ZURI_GO_PUBLIC_ORIGIN:origin,ZURI_GO_SESSION_SECRET:'isolated-test-session-secret-at-least-32-bytes',ZURI_GO_TEAM_PASSWORD_HASH:await passwordHash('isolated-qa-team-password')});
const {default:handler}=await import('../cloud.mjs');
await transaction(business,c=>c.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[business,'QA ONLY · cloud access verification',business]));
const members=[];const admin=new pg.Client({connectionString:local.adminUrl});await admin.connect();
for(let i=0;i<4;i++){
 const m=await transaction(business,async c=>(await c.query('INSERT INTO members(business_id,display_name) VALUES($1,$2) RETURNING *',[business,'QA Member '+i])).rows[0]);members.push(m);
 await admin.query('BEGIN');await admin.query("SELECT set_config('zuri_go.business_id',$1,true)",[business]);await admin.query('INSERT INTO zuri_go.member_credentials(business_id,member_id,password_hash) VALUES($1,$2,$3)',[business,m.id,await passwordHash('isolated-qa-team-password'+i)]);await admin.query('COMMIT');
}
async function credentialUpdate(id,sql){await admin.query('BEGIN');try{await admin.query("SELECT set_config('zuri_go.business_id',$1,true)",[business]);await admin.query('UPDATE zuri_go.businesses SET domain_revision=domain_revision+1 WHERE id=$1',[business]);await admin.query('UPDATE zuri_go.member_credentials SET '+sql+' WHERE business_id=$1 AND member_id=$2',[business,id]);await admin.query('COMMIT');}catch(e){await admin.query('ROLLBACK');throw e;}}
// Direct checks run as the owner: this file runs as the hosted runtime, where no operator viewer exists.
async function asOwner(sql,params){await admin.query('BEGIN');try{await admin.query("SELECT set_config('zuri_go.business_id',$1,true)",[business]);const r=await admin.query(sql,params);await admin.query('COMMIT');return r;}catch(e){await admin.query('ROLLBACK');throw e;}}
after(async()=>{await admin.end();await pool.end();});
let requestNumber=0;
async function call(route,{method='GET',body,cookie,headers={}}={}){
 const result={headers:{}};const res={setHeader:(k,v)=>result.headers[k]=v,writeHead:(status,h)=>{result.status=status;Object.assign(result.headers,h);},end:value=>{result.body=Buffer.isBuffer(value)?value:JSON.parse(value);}};
 await handler({url:'/api/index?route='+route,method,body,headers:{host:'zuri-qa.test',origin,'content-type':'application/json','x-zuri-go':'1',cookie:Array.isArray(cookie)?cookie.join('; '):cookie,'x-real-ip':'198.51.100.'+(++requestNumber),...headers}},res);return result;
}
test('AC-014-006-03 hosted Visual Studio denies Guest mutations and never starts a background executor',async()=>{
 const prefix='businesses/'+business+'/visual-marketing';
 assert.equal((await call(prefix+'/projects')).status,200);
 assert.equal((await call(prefix+'/projects',{method:'POST',body:{}})).status,401);
 const cookie=(await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}})).headers['Set-Cookie'];
 const response=await call(prefix+'/projects/'+randomUUID()+'/run',{method:'POST',cookie,body:{row_version:1,idempotency_key:randomUUID(),input_hash:'x',authorize_local_model:true}});
 assert.equal(response.status,503);assert.equal(response.body.code,'EXECUTOR_UNAVAILABLE');
});
test('hosted API allows guest reads, denies writes, and supports individual member login',async()=>{
 assert.equal((await call('bootstrap')).status,200);assert.equal((await call('session')).body.authenticated,false);assert.equal((await call('businesses/'+business+'/channels',{method:'POST',body:{}})).status,401);
 assert.equal((await call('login',{method:'POST',body:{password:'wrong'}})).status,401);
 const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}});assert.equal(login.status,200);const cookie=login.headers['Set-Cookie'][0];assert.match(cookie,/Secure; SameSite=Strict/);
 assert.equal((await call('session',{cookie})).body.businessId,business);assert.equal((await call('bootstrap',{cookie})).body.storage,'postgresql-cloud');
 assert.equal((await call('bootstrap',{cookie:cookie.replace(/member=./,'member=x')})).status,200);assert.equal((await call('businesses/'+business+'/workspace',{method:'PUT',body:{},cookie:cookie.replace(/member=./,'member=x')})).status,401);
 assert.equal((await call('businesses/'+randomUUID()+'/state',{cookie})).status,403);
 assert.equal((await call('businesses/'+business+'/imports',{method:'POST',cookie,body:{}})).status,403);
 assert.equal((await call('logout',{method:'POST',cookie,body:{},headers:{origin:'https://evil.test'}})).status,403);
 assert.match((await call('logout',{method:'POST',cookie,body:{}})).headers['Set-Cookie'][0],/Max-Age=0/);
});
test('Vercel parsed JSON writes persist across independently authenticated sessions',async()=>{
 const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}}),cookie=login.headers['Set-Cookie'];
 const created=await call('businesses/'+business+'/channels',{method:'POST',cookie,body:{display_name:'QA ONLY · persistence',platform:'other'}});assert.equal(created.status,200);
 const another=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}});
 const state=await call('businesses/'+business+'/state',{cookie:another.headers['Set-Cookie']});assert.equal(state.status,200);assert.ok(state.body.channel_accounts.some(x=>x.id===created.body.id));
});
test('guest write attempts cannot alter state, including attachments and wrong businesses',async()=>{
 const before=await call('businesses/'+business+'/state');
 for(const [method,path] of [['POST','channels'],['PATCH',randomUUID()],['PUT','workspace'],['POST','tasks/'+randomUUID()+'/attachments'],['PATCH','tasks/'+randomUUID()+'/attachments/'+randomUUID()]]){
  assert.equal((await call('businesses/'+business+'/'+path,{method,body:{name:'unauthorized'}})).status,401);
 }
 assert.equal((await call('businesses/'+randomUUID()+'/state')).status,403);
 assert.deepEqual((await call('businesses/'+business+'/state')).body,before.body);
});
test('the transcript upload route needs a signed-in Member and reaches the meeting lookup (FR-011-010)',async()=>{
 const route='businesses/'+business+'/meetings/'+randomUUID()+'/transcript';
 assert.equal((await call(route,{method:'POST',body:{reason:'x'}})).status,401,'a Guest cannot upload');
 const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}}),cookie=login.headers['Set-Cookie'];
 assert.equal((await call(route,{method:'POST',cookie,body:{reason:'x'}})).status,404,'an unknown or hidden meeting answers 404');
 assert.equal((await call('businesses/'+business+'/meetings/'+randomUUID()+'/transcript',{method:'PATCH',cookie,body:{}})).status,404,'only POST uploads');
});
test('the meeting commit on the hosted API: Guest 401, a Member commits and replays, PUT refuses a receipt, the package carries the module (WI-09)',async()=>{
 const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password1'}}),cookie=login.headers['Set-Cookie'],base='businesses/'+business,route=base+'/meeting-commits';
 assert.equal((await call(route,{method:'POST',body:{meetingId:'x',batchId:'y',choices:[]}})).status,401,'a Guest cannot commit');
 assert.equal((await call(route,{method:'POST',cookie,body:{meetingId:'x',batchId:'y',choices:[]}})).status,404,'an unknown or hidden meeting answers 404');
 assert.equal((await call(route,{method:'POST',cookie,body:{}})).status,422,'the body is checked');
 assert.equal((await call(route+'/'+randomUUID(),{method:'POST',cookie,body:{}})).status,404,'only the collection route commits');
 // A Member saves a meeting with a draft batch; the client cannot turn it into tasks by sending a receipt.
 const workspace=(await call(base+'/workspace',{cookie})).body,d=workspace.meetingTaskManager;
 const src={sourceInstanceId:'qa-cloud',projectId:'p',recordingId:randomUUID(),contentHash:'h-'+randomUUID(),sourceMode:'native',segments:[{segmentId:'s1',startMs:0,endMs:500,text:'ตรวจหน้าเว็บ'}]};
 const mid=addSource(d,src,{title:'QA hosted meeting'}),sourceId=d.meetings.find(m=>m.id===mid).sourceId,review=randomUUID(),rid=saveReview(d,{id:review,sourceId,segments:src.segments,reviewHash:await reviewHash(review,src.segments)});
 addBatch(d,mid,{draftBatchId:'batch-'+mid,reviewRevisionId:rid,reviewHash:d.reviews.find(r=>r.id===rid).reviewHash,sourceHash:src.contentHash,items:[{proposalId:'p1',kind:'task',title:'ตรวจหน้าเว็บ',evidence:[{segmentId:'s1',startMs:0,endMs:500,quote:'ตรวจหน้าเว็บ',reviewRevisionId:rid}]}]});
 const saved=await call(base+'/workspace',{method:'PUT',cookie,body:{version:workspace.version,meetingTaskManager:d}});assert.equal(saved.status,200,JSON.stringify(saved.body));
 const choices=[{proposalId:'p1',mode:'create',title:'ตรวจหน้าเว็บ (hosted)',responsibleId:members[1].id,week:'2026-09-28',priority:'must'}],forged=structuredClone(saved.body.meetingTaskManager);
 commitBatch(forged,'batch-'+mid,choices);
 const refused=await call(base+'/workspace',{method:'PUT',cookie,body:{version:saved.body.version,meetingTaskManager:forged}});assert.equal(refused.status,422);assert.equal(refused.body.code,'RECEIPT_SERVER_OWNED');
 assert.equal((await asOwner("SELECT count(*)::int n FROM zuri_go.tasks WHERE business_id=$1 AND title='ตรวจหน้าเว็บ (hosted)'",[business])).rows[0].n,0);
 const batch=saved.body.meetingTaskManager.batches.find(x=>x.id==='batch-'+mid),body={meetingId:mid,batchId:batch.id,reviewRevisionId:batch.reviewRevisionId,reviewHash:batch.reviewHash,sourceHash:batch.sourceHash,choices};
 const first=await call(route,{method:'POST',cookie,body});assert.equal(first.status,200,JSON.stringify(first.body));assert.equal(first.body.replayed,false);assert.equal(first.body.receipt.taskIds.length,1);
 assert.ok(first.body.workspace.meetingTaskManager.tasks.some(t=>t.title==='ตรวจหน้าเว็บ (hosted)'&&/^TSK-/.test(t.code||'TSK-')),'the response carries the viewer-scoped workspace');
 const again=await call(route,{method:'POST',cookie:(await call('login',{method:'POST',body:{password:'isolated-qa-team-password2'}})).headers['Set-Cookie'],body});assert.equal(again.body.replayed,true);assert.deepEqual(again.body.receipt.taskIds,first.body.receipt.taskIds);
 const stale=await call(base+'/workspace',{method:'PUT',cookie,body:{version:saved.body.version,meetingTaskManager:saved.body.meetingTaskManager}});assert.equal(stale.status,409,'a client save from before the commit is refused');
 // The hosted package lists the module and every module it imports (the package copies only named files).
 const builder=await readFile(new URL('../../../scripts/deploy/build_cloud.py',import.meta.url),'utf8'),listOf=start=>[...builder.split(/\r?\n/).find(l=>l.startsWith(start)).matchAll(/'([^']+)'/g)].map(x=>x[1]);
 const listed=new Set(listOf("for path in ['api.mjs'")),shared=new Set(listOf("for path in ['shared/model.mjs'"));
 assert.ok(listed.has('meeting-commit.mjs'));
 for(const file of listed){const source=await readFile(new URL('../'+file,import.meta.url),'utf8');
  for(const [,target] of source.matchAll(/from '\.\/([a-z-]+\.mjs)'/g))assert.ok(listed.has(target),file+' imports '+target+' which the package lacks');
  for(const [,target] of source.matchAll(/from '\.\.\/web\/src\/content\/([a-z\/-]+\.mjs)'/g))assert.ok(shared.has(target)||shared.has(target.replace(/^\.\//,'')),file+' imports '+target+' which the package lacks');}
});
test('attachments persist bytes, follow their task visibility, enforce bounds and become unavailable after removal',async()=>{
 const task=randomUUID();await transaction(business,c=>c.query('INSERT INTO tasks(id,business_id,code,title) VALUES($1,$2,$3,$4)',[task,business,task,'QA ONLY attachment test']));
 const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}}),cookie=login.headers['Set-Cookie'];
 await asOwner("UPDATE zuri_go.tasks SET legacy_metadata=$2 WHERE id=$1",[task,{id:'legacy-task-reference'}]);
 const path='businesses/'+business+'/tasks/legacy-task-reference/attachments';
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5s8AAAAASUVORK5CYII=';
 const created=await call(path,{method:'POST',cookie,body:{filename:'หลักฐาน.png',base64:png}});assert.equal(created.status,200);assert.equal(created.body.media_type,'image/png');assert.equal(created.body.uploaded_by_member_id,members[0].id);assert.ok(!('payload' in created.body));
 // A Guest gets 404 for a business task's attachments, exactly as for a missing one (FR-011-007 AC-02).
 assert.equal((await call(path+'/'+created.body.id)).status,404);assert.equal((await call(path)).status,404);
 const downloaded=await call(path+'/'+created.body.id,{cookie});assert.equal(downloaded.status,200);assert.equal(downloaded.body.toString('base64'),png);assert.match(downloaded.headers['Content-Disposition'],/^attachment/);
 const preview=await call(path+'/'+created.body.id+'&preview=1',{cookie});assert.equal(preview.headers['Content-Type'],'image/png');assert.match(preview.headers['Content-Security-Policy'],/sandbox/);
 const svg=await call(path,{method:'POST',cookie,body:{filename:'unsafe.svg',base64:Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')}});
 assert.equal((await call(path+'/'+svg.body.id+'&preview=1',{cookie})).headers['Content-Type'],'application/octet-stream');
 for(const body of [{filename:'../bad.txt',base64:'YQ=='},{filename:'x',base64:'???='},{filename:'x',base64:''}])assert.equal((await call(path,{method:'POST',cookie,body})).status,422);
 assert.equal((await call(path,{method:'POST',cookie,body:{filename:'big.bin',base64:Buffer.alloc(2097153).toString('base64')}})).status,413);
 for(let i=0;i<2;i++)assert.equal((await call(path,{method:'POST',cookie,body:{filename:'small'+i+'.txt',base64:'YQ=='}})).status,200);
 const parallel=await Promise.all([0,1].map(i=>call(path,{method:'POST',cookie,body:{filename:'concurrent'+i+'.txt',base64:'YQ=='}})));
 assert.equal(parallel.filter(r=>r.status===200).length,1);assert.ok(parallel.every(r=>[200,409,422].includes(r.status)));
 assert.equal((await call(path,{cookie})).body.length,5);
 assert.equal((await transaction(randomUUID(),c=>c.query('SELECT id FROM task_attachments WHERE task_id=$1',[task]))).rowCount,0);
 assert.equal((await call(path,{method:'POST',cookie,body:{filename:'sixth',base64:'YQ=='}})).status,422);
 assert.equal((await call(path+'/'+created.body.id,{method:'PATCH',body:{deleted:true}})).status,401);
 assert.equal((await call(path+'/'+created.body.id,{method:'PATCH',cookie,body:{deleted:true}})).status,200);
 assert.equal((await call(path+'/'+created.body.id,{cookie})).status,404);
 assert.equal((await call(path,{cookie})).body.length,4);
 const logout=await call('logout',{method:'POST',cookie,body:{}});
 assert.equal((await call('session',{cookie:logout.headers['Set-Cookie']})).body.authenticated,false);
 assert.equal((await call(path,{cookie:logout.headers['Set-Cookie']})).status,404,'after logout the reader is a Guest (FR-011-007 AC-05)');
 assert.equal((await call(path,{method:'POST',cookie:logout.headers['Set-Cookie'],body:{}})).status,401);
});
test('four individual identities, single-code binding, audit actors, disabled/reset sessions and legacy rejection',async()=>{
 const old=sessionCookie(sessionToken(business,process.env.ZURI_GO_SESSION_SECRET));
 assert.equal((await call('businesses/'+business+'/channels',{method:'POST',cookie:old,body:{}})).status,401);
 assert.equal((await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}})).status,200);
 for(let i=0;i<4;i++){
  const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password'+i}});assert.equal(login.status,200);assert.equal(login.body.member.memberId,members[i].id);assert.equal(login.body.member.pid,members[i].pid);
  const spoof=await call('login',{method:'POST',body:{pid:members[(i+1)%4].pid,memberId:members[(i+1)%4].id,password:'isolated-qa-team-password'+i}});assert.equal(spoof.status,200);assert.equal(spoof.body.member.memberId,members[i].id);
  const saved=await call('businesses/'+business+'/channels',{method:'POST',cookie:login.headers['Set-Cookie'],body:{display_name:'QA actor '+i,platform:'other'}});assert.equal(saved.status,200);
  const audit=(await asOwner('SELECT actor_member_id,actor_pid FROM zuri_go.change_events WHERE business_id=$1 AND entity_id=$2',[business,saved.body.id])).rows[0];assert.equal(audit.actor_member_id,members[i].id);assert.equal(audit.actor_pid,members[i].pid);
 }
 const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}}),cookie=login.headers['Set-Cookie'];
 await credentialUpdate(members[0].id,'credential_version=credential_version+1');
 assert.equal((await call('session',{cookie})).body.authenticated,false);assert.equal((await call('businesses/'+business+'/channels',{method:'POST',cookie,body:{}})).status,401);
 await credentialUpdate(members[0].id,'enabled=false');assert.equal((await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}})).status,401);
 await credentialUpdate(members[0].id,'enabled=true');
 const logged=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}});
 // Read as the Member: a Guest view no longer holds business tasks, and saving it would drop them (409).
 const workspace=(await call('businesses/'+business+'/workspace',{cookie:logged.headers['Set-Cookie']})).body;
 const tid=saveTask(workspace.meetingTaskManager,{title:'QA claimed actor',responsibleId:members[0].id});
 workspace.meetingTaskManager.events.forEach(e=>{e.actor='spoofed other member';e.actorMemberId=members[1].id;e.actorPid=members[1].pid;});
 const written=await call('businesses/'+business+'/workspace',{method:'PUT',cookie:logged.headers['Set-Cookie'],body:{version:workspace.version,meetingTaskManager:workspace.meetingTaskManager}});assert.equal(written.status,200,JSON.stringify(written.body));
 const event=written.body.meetingTaskManager.events.find(e=>e.taskId===tid);assert.equal(event.actorPid,members[0].pid);assert.equal(event.actorMemberId,members[0].id);
 const publicState=JSON.stringify((await call('businesses/'+business+'/state')).body);assert.ok(!/password_hash|credential_version|isolated-qa-team-password/.test(publicState));
 assert.equal((await call('businesses/'+business+'/members/'+members[0].id,{method:'PATCH',cookie:logged.headers['Set-Cookie'],body:{pid:'ZGO-P9999'}})).status,422);
 await assert.rejects(()=>transaction(business,c=>c.query("UPDATE members SET pid='ZGO-P9999' WHERE id=$1",[members[0].id])),/PID is immutable/);
 assert.equal((await transaction(business,c=>c.query('SELECT pid FROM members WHERE id=$1',[members[0].id]))).rows[0].pid,members[0].pid);
 await assert.rejects(()=>transaction(business,c=>c.query('UPDATE member_credentials SET enabled=false WHERE member_id=$1',[members[1].id])),/permission denied/);
});
test('Guests read public items only on every hosted read path; no operator viewer exists here (FR-011-003, -007)',async()=>{
 await asOwner("UPDATE zuri_go.tasks SET status='blocked',blocker='QA' WHERE business_id=$1 AND title='QA ONLY attachment test'",[business]);
 const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password1'}}),cookie=login.headers['Set-Cookie'];
 const member=(await call('businesses/'+business+'/workspace',{cookie})).body;assert.ok(member.meetingTaskManager.tasks.length>0);assert.ok(member.meetingTaskManager.events.length>0);
 const guest=(await call('businesses/'+business+'/workspace')).body;
 assert.equal(guest.meetingTaskManager.tasks.length,0);assert.equal(guest.meetingTaskManager.events.length,0);assert.ok(guest.campaignWorkspace.campaigns.every(c=>!c.tasks.length));
 const state=(await call('businesses/'+business+'/state')).body;assert.equal(state.tasks.length,0);assert.equal(state.task_roles.length,0);assert.equal(state.weekly_plan_tasks.length,0);
 assert.equal((await call('businesses/'+business+'/overview',{cookie})).body.taskAttention.length,1);
 assert.equal((await call('businesses/'+business+'/overview')).body.taskAttention.length,0,'hidden tasks are neither listed nor counted');
 const session=(await call('session',{cookie})).body;assert.equal(session.admin,false);assert.deepEqual(session.teamIds,[]);assert.equal((await call('session')).body.admin,false);
 assert.equal((await call('businesses/'+business+'/teams')).status,401);assert.equal((await call('businesses/'+business+'/teams',{cookie})).status,200);
 assert.equal((await call('businesses/'+business+'/teams',{method:'POST',cookie,body:{name:'ไม่ใช่ admin'}})).status,403);
 await assert.rejects(transaction(business,OPERATOR,c=>c.query('SELECT 1')),e=>e.code==='VIEWER_OPERATOR_HOSTED');
});
test('Task Manager routes on the hosted API: Guest 401 on writes, viewer-filtered reads, attachments still routed (FR-010-009, -010)',async()=>{
 const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password2'}}),cookie=login.headers['Set-Cookie'],base='businesses/'+business;
 assert.equal((await call(base+'/tasks',{method:'POST',body:{idempotency_key:randomUUID(),title:'x'}})).status,401);
 const created=await call(base+'/tasks',{method:'POST',cookie,body:{idempotency_key:randomUUID(),title:'งานผ่าน API',visibility:'restricted',roles:{R:members[2].id}}});
 assert.equal(created.status,200,JSON.stringify(created.body));assert.match(created.body.code,/^TSK-/);
 assert.equal((await call(base+'/tasks/'+created.body.id)).status,404,'a Guest gets the same 404 as for a missing task');
 assert.equal((await call(base+'/tasks/'+created.body.id,{cookie})).body.id,created.body.id);
 assert.ok(!(await call(base+'/tasks')).body.tasks.some(t=>t.id===created.body.id));
 const project=await call(base+'/projects',{method:'POST',cookie,body:{name:'โปรเจกต์ผ่าน API'}});assert.equal(project.status,200);assert.match(project.body.code,/^PRJ-/);
 assert.equal((await call(base+'/tasks/'+created.body.id+'/attachments',{cookie})).status,200,'the attachments route is not shadowed');
 assert.equal((await call(base+'/tasks&board=mine')).status,401);
});
test('Guests read only the ID, PID, display name and status of each Member on every hosted read path (WI-12 D16)',async()=>{
 await asOwner("UPDATE zuri_go.members SET email='d16@example.test',phone='0899999999',notes='หมายเหตุลับ D16',nickname='ชื่อเล่น D16' WHERE business_id=$1 AND id=$2",[business,members[1].id]);
 const base='businesses/'+business,secrets=['d16@example.test','0899999999','หมายเหตุลับ D16','ชื่อเล่น D16'],total=(await asOwner('SELECT count(*)::int n FROM zuri_go.members WHERE business_id=$1',[business])).rows[0].n;
 const cookie=(await call('login',{method:'POST',body:{password:'isolated-qa-team-password2'}})).headers['Set-Cookie'];
 for(const path of [base+'/workspace',base+'/state',base+'/overview','bootstrap','session']){const guest=await call(path);assert.equal(guest.status,200,path);for(const s of secrets)assert.equal(JSON.stringify(guest.body).includes(s),false,path+' '+s);}
 const workspace=(await call(base+'/workspace')).body.meetingTaskManager.members,state=(await call(base+'/state')).body.members;
 assert.equal(workspace.length,total);assert.equal(state.length,total);
 for(const m of workspace)assert.deepEqual(Object.keys(m).sort(),['displayName','id','pid','status']);
 for(const m of state)assert.deepEqual(Object.keys(m).sort(),['display_name','id','pid','status']);
 assert.ok(workspace.every(m=>m.displayName&&m.pid),'the names and PIDs a Guest needs are there');
 for(const path of [base+'/workspace',base+'/state'])for(const s of secrets)assert.equal(JSON.stringify((await call(path,{cookie})).body).includes(s),true,'a Member reads '+s+' on '+path);
 assert.equal((await call(base+'/teams')).status,401,'the team routes list Members only to the signed in');
});
test('the registry rules hold on the hosted workspace save: 403 for another Member or a new Member, own details yes, own status no, the admin any (WI-12 D3)',async()=>{
 const base='businesses/'+business,others='เฉพาะ Business admin แก้ทะเบียนสมาชิกของคนอื่นหรือเพิ่มสมาชิกได้',ownStatus='เปลี่ยนสถานะของตัวเองไม่ได้ ติดต่อ Business admin';
 const loginAs=async i=>(await call('login',{method:'POST',body:{password:'isolated-qa-team-password'+i}})).headers['Set-Cookie'];
 const put=async(cookie,change)=>{const ws=(await call(base+'/workspace',{cookie})).body,d=structuredClone(ws.meetingTaskManager);change(d);return call(base+'/workspace',{method:'PUT',cookie,body:{version:ws.version,meetingTaskManager:d}});};
 const of=(d,m)=>d.members.find(x=>x.id===m.id),stored=m=>asOwner('SELECT nickname,status FROM zuri_go.members WHERE business_id=$1 AND id=$2',[business,m.id]).then(r=>r.rows[0]),count=()=>asOwner('SELECT count(*)::int n FROM zuri_go.members WHERE business_id=$1',[business]).then(r=>r.rows[0].n);
 const member=await loginAs(2),start=await count(),before=await stored(members[3]);
 let refused=await put(member,d=>{of(d,members[3]).nickname='แก้โดยคนอื่น';});assert.equal(refused.status,403);assert.equal(refused.body.error,others);
 refused=await put(member,d=>{of(d,members[3]).status='inactive';});assert.equal(refused.status,403);assert.equal(refused.body.error,others);
 refused=await put(member,d=>saveMember(d,{displayName:'สมาชิกใหม่ hosted'}));assert.equal(refused.status,403);assert.equal(refused.body.error,others);
 refused=await put(member,d=>{of(d,members[2]).status='inactive';});assert.equal(refused.status,403);assert.equal(refused.body.error,ownStatus);
 assert.deepEqual(await stored(members[3]),before);assert.equal(await count(),start);assert.equal((await stored(members[2])).status,'active');
 const own=await put(member,d=>{of(d,members[2]).nickname='ชื่อเล่น hosted';});assert.equal(own.status,200,JSON.stringify(own.body));assert.equal((await stored(members[2])).nickname,'ชื่อเล่น hosted');
 assert.equal((await put(member,()=>{})).status,200,'an unchanged registry saves');
 // The Business admin edits others, changes status and adds Members (set by the operator script, never by a request).
 await asOwner('UPDATE zuri_go.members SET is_business_admin=true WHERE business_id=$1 AND id=$2',[business,members[3].id]);
 const admin=await loginAs(3);
 assert.equal((await put(admin,d=>{of(d,members[2]).status='inactive';})).status,200);assert.equal((await stored(members[2])).status,'inactive');
 assert.equal((await put(admin,d=>{of(d,members[2]).status='active';})).status,200);
 assert.equal((await put(admin,d=>saveMember(d,{displayName:'สมาชิกใหม่ hosted โดยแอดมิน'}))).status,200);assert.equal(await count(),start+1);
 refused=await put(admin,d=>{of(d,members[3]).status='inactive';});assert.equal(refused.status,403);assert.equal(refused.body.error,ownStatus);
});
test('rate limiting is persisted in PostgreSQL and denies after the per-bucket threshold',async()=>{
 await transaction(business,c=>c.query("INSERT INTO team_login_limits(business_id,bucket,attempts,resets_at) VALUES($1,'global',400,now()+interval '15 minutes') ON CONFLICT(business_id,bucket) DO UPDATE SET attempts=400",[business]));
 const response=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}});assert.equal(response.status,429);assert.equal(response.headers['Retry-After'],'900');
 assert.equal((await transaction(business,c=>c.query("SELECT attempts FROM team_login_limits WHERE business_id=$1 AND bucket='global'",[business]))).rows[0].attempts,401);
});
