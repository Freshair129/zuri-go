import pg from 'pg';
import {sessionToken,sessionCookie} from '../team-auth.mjs';
import {saveTask} from '../../web/src/content/meeting/model.mjs';
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {config} from '../config.mjs';
import {pool,transaction} from '../db.mjs';
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
after(async()=>{await admin.end();await pool.end();});
let requestNumber=0;
async function call(route,{method='GET',body,cookie,headers={}}={}){
 const result={headers:{}};const res={setHeader:(k,v)=>result.headers[k]=v,writeHead:(status,h)=>{result.status=status;Object.assign(result.headers,h);},end:value=>{result.body=Buffer.isBuffer(value)?value:JSON.parse(value);}};
 await handler({url:'/api/index?route='+route,method,body,headers:{host:'zuri-qa.test',origin,'content-type':'application/json','x-zuri-go':'1',cookie:Array.isArray(cookie)?cookie.join('; '):cookie,'x-real-ip':'198.51.100.'+(++requestNumber),...headers}},res);return result;
}
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
test('attachments persist bytes, remain publicly readable, enforce bounds and become unavailable after removal',async()=>{
 const task=randomUUID();await transaction(business,c=>c.query('INSERT INTO tasks(id,business_id,code,title) VALUES($1,$2,$3,$4)',[task,business,task,'QA ONLY attachment test']));
 const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}}),cookie=login.headers['Set-Cookie'];
 await transaction(business,c=>c.query("UPDATE tasks SET legacy_metadata=$2 WHERE id=$1",[task,{id:'legacy-task-reference'}]));
 const path='businesses/'+business+'/tasks/legacy-task-reference/attachments';
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5s8AAAAASUVORK5CYII=';
 const created=await call(path,{method:'POST',cookie,body:{filename:'หลักฐาน.png',base64:png}});assert.equal(created.status,200);assert.equal(created.body.media_type,'image/png');assert.equal(created.body.uploaded_by_member_id,members[0].id);assert.ok(!('payload' in created.body));
 const downloaded=await call(path+'/'+created.body.id);assert.equal(downloaded.status,200);assert.equal(downloaded.body.toString('base64'),png);assert.match(downloaded.headers['Content-Disposition'],/^attachment/);
 const preview=await call(path+'/'+created.body.id+'&preview=1');assert.equal(preview.headers['Content-Type'],'image/png');assert.match(preview.headers['Content-Security-Policy'],/sandbox/);
 const svg=await call(path,{method:'POST',cookie,body:{filename:'unsafe.svg',base64:Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')}});
 assert.equal((await call(path+'/'+svg.body.id+'&preview=1')).headers['Content-Type'],'application/octet-stream');
 for(const body of [{filename:'../bad.txt',base64:'YQ=='},{filename:'x',base64:'???='},{filename:'x',base64:''}])assert.equal((await call(path,{method:'POST',cookie,body})).status,422);
 assert.equal((await call(path,{method:'POST',cookie,body:{filename:'big.bin',base64:Buffer.alloc(2097153).toString('base64')}})).status,413);
 for(let i=0;i<2;i++)assert.equal((await call(path,{method:'POST',cookie,body:{filename:'small'+i+'.txt',base64:'YQ=='}})).status,200);
 const parallel=await Promise.all([0,1].map(i=>call(path,{method:'POST',cookie,body:{filename:'concurrent'+i+'.txt',base64:'YQ=='}})));
 assert.equal(parallel.filter(r=>r.status===200).length,1);assert.ok(parallel.every(r=>[200,409,422].includes(r.status)));
 assert.equal((await call(path)).body.length,5);
 assert.equal((await transaction(randomUUID(),c=>c.query('SELECT id FROM task_attachments WHERE task_id=$1',[task]))).rowCount,0);
 assert.equal((await call(path,{method:'POST',cookie,body:{filename:'sixth',base64:'YQ=='}})).status,422);
 assert.equal((await call(path+'/'+created.body.id,{method:'PATCH',body:{deleted:true}})).status,401);
 assert.equal((await call(path+'/'+created.body.id,{method:'PATCH',cookie,body:{deleted:true}})).status,200);
 assert.equal((await call(path+'/'+created.body.id)).status,404);
 assert.equal((await call(path)).body.length,4);
 const logout=await call('logout',{method:'POST',cookie,body:{}});
 assert.equal((await call('session',{cookie:logout.headers['Set-Cookie']})).body.authenticated,false);
 assert.equal((await call(path,{cookie:logout.headers['Set-Cookie']})).status,200);
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
  const audit=await transaction(business,async c=>(await c.query('SELECT actor_member_id,actor_pid FROM change_events WHERE business_id=$1 AND entity_id=$2',[business,saved.body.id])).rows[0]);assert.equal(audit.actor_member_id,members[i].id);assert.equal(audit.actor_pid,members[i].pid);
 }
 const login=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}}),cookie=login.headers['Set-Cookie'];
 await credentialUpdate(members[0].id,'credential_version=credential_version+1');
 assert.equal((await call('session',{cookie})).body.authenticated,false);assert.equal((await call('businesses/'+business+'/channels',{method:'POST',cookie,body:{}})).status,401);
 await credentialUpdate(members[0].id,'enabled=false');assert.equal((await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}})).status,401);
 await credentialUpdate(members[0].id,'enabled=true');
 const logged=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}});
 const workspace=(await call('businesses/'+business+'/workspace')).body;
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
test('rate limiting is persisted in PostgreSQL and denies after the per-bucket threshold',async()=>{
 await transaction(business,c=>c.query("INSERT INTO team_login_limits(business_id,bucket,attempts,resets_at) VALUES($1,'global',400,now()+interval '15 minutes') ON CONFLICT(business_id,bucket) DO UPDATE SET attempts=400",[business]));
 const response=await call('login',{method:'POST',body:{password:'isolated-qa-team-password0'}});assert.equal(response.status,429);assert.equal(response.headers['Retry-After'],'900');
 assert.equal((await transaction(business,c=>c.query("SELECT attempts FROM team_login_limits WHERE business_id=$1 AND bucket='global'",[business]))).rows[0].attempts,401);
});
