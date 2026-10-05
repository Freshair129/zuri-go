// FEAT-011 against real PostgreSQL: every viewer kind on every read path, row-level security with the
// application filter bypassed, the viewer-scoped save, widening, teams, the admin guard, restricted meetings,
// tasks from a confidential meeting and transcript custody.
// @trace verifies FR-011-001, FR-011-002, FR-011-003, FR-011-004, FR-011-005, FR-011-006, FR-011-007, FR-011-008, FR-011-009, FR-011-010, FR-011-011, FR-011-012, NFR-011-001
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {config} from '../config.mjs';
import {pool,transaction} from '../db.mjs';
import {OPERATOR,session} from '../viewer.mjs';
import {authorizeWrite} from '../member-auth.mjs';
import {passwordHash} from '../team-auth.mjs';
import {snapshot,save,audit,observe} from '../service.mjs';
import {readLegacy,saveLegacy,uploadTranscript} from '../workspace.mjs';
import {commitMeeting} from '../meeting-commit.mjs';
import {attachmentAction} from '../attachments.mjs';
import {listTeams,saveTeam} from '../teams.mjs';
import {empty,seedWorkspace,saveMember,saveTask,addSource,saveReview,addBatch,validateState,reviewHash} from '../../web/src/content/meeting/model.mjs';
const seed=JSON.parse(await readFile(new URL('../../web/src/content/meeting/seed.json',import.meta.url),'utf8'));
const admin=new pg.Client({connectionString:config().adminUrl});await admin.connect();
after(async()=>{await admin.end();await pool.end();});
const b=randomUUID();
await owner('INSERT INTO zuri_go.businesses(id,name,slug) VALUES($1,$2,$3)',[b,'QA ONLY · visibility verification',b]);
async function owner(sql,params){await admin.query('BEGIN');try{await admin.query("SELECT set_config('zuri_go.business_id',$1,true)",[b]);const r=await admin.query(sql,params);await admin.query('COMMIT');return r;}catch(e){await admin.query('ROLLBACK');throw e;}}
const principal=who=>who==='guest'?null:who==='operator'?OPERATOR:session({m:who.id,cv:1});
const as=(who,fn)=>transaction(b,principal(who),fn);
// Writes by a Member go through authorizeWrite, as the API does.
const write=(who,fn)=>transaction(b,principal(who),async c=>{if(who!=='operator')await authorizeWrite(c,b);return fn(c);});
const titles=ws=>ws.meetingTaskManager.tasks.map(t=>t.title).sort();
// The meeting commit belongs to the server (PLAN-002 WI-09): a client save no longer carries a receipt, so these tests commit through the endpoint's function.
const commitAs=(who,d,mid,choices,patch={})=>{const batch=d.batches.find(x=>x.meetingId===mid);return write(who,c=>commitMeeting(c,b,{meetingId:mid,batchId:batch.id,reviewRevisionId:batch.reviewRevisionId,reviewHash:batch.reviewHash,sourceHash:batch.sourceHash,choices,...patch},c.zuriViewer));};

// Four seeded Members: m0 accounting (A of the restricted task), m1 sales, m2 named viewer, m3 Business admin.
let domain=empty();seedWorkspace(domain,seed);
let ws=await as('operator',c=>readLegacy(c,b));
ws=await write('operator',c=>saveLegacy(c,b,{version:ws.version,meetingTaskManager:domain}));
const rows=(await owner('SELECT id,legacy_metadata FROM zuri_go.members WHERE business_id=$1',[b])).rows;
const people=ws.meetingTaskManager.members.map(m=>({legacy:m.id,id:rows.find(r=>(r.legacy_metadata?.id||r.id)===m.id).id}));
const [m0,m1,m2,m3]=people;
for(const p of people)await owner('INSERT INTO zuri_go.member_credentials(business_id,member_id,password_hash) VALUES($1,$2,$3)',[b,p.id,await passwordHash('qa-'+randomUUID())]);
await owner('UPDATE zuri_go.members SET is_business_admin=true WHERE business_id=$1 AND id=$2',[b,m3.id]);
const team=await write('operator',c=>saveTeam(c,b,{kind:'operator'},{name:'บัญชี QA',memberIds:[m0.legacy]}));
const teamB=await write('operator',c=>saveTeam(c,b,{kind:'operator'},{name:'ขาย QA',memberIds:[m1.legacy]}));
ws=await as('operator',c=>readLegacy(c,b));
// t0 public, t1 business, t2 team บัญชี, t3 restricted (R/A m0, viewer m2), t4 business by default.
domain=ws.meetingTaskManager;const [t0,t1,t2,t3,t4]=domain.tasks.map(t=>t.id);
const set=(id,patch,raci)=>{const t=domain.tasks.find(x=>x.id===id);if(raci)saveTask(domain,{id,version:t.version,...raci});Object.assign(domain.tasks.find(x=>x.id===id),patch);};
set(t0,{visibility:'public',visibilityReason:'QA public item'});
set(t2,{visibility:'team',teamId:team.id},{responsibleId:m0.legacy,accountableId:m0.legacy,consultedIds:[],informedIds:[]});
set(t3,{visibility:'restricted',viewerIds:[m2.legacy]},{responsibleId:m0.legacy,accountableId:m0.legacy,consultedIds:[],informedIds:[]});
ws=await write('operator',c=>saveLegacy(c,b,{version:ws.version,meetingTaskManager:domain}));
const title=id=>ws.meetingTaskManager.tasks.find(t=>t.id===id).title;
const expected={guest:[t0,t1,t2,t3,t4],m0:[t0,t1,t2,t3,t4],m1:[t0,t1,t2,t3,t4],m2:[t0,t1,t2,t3,t4],m3:[t0,t1,t2,t3,t4],operator:[t0,t1,t2,t3,t4]};
const who={guest:'guest',m0,m1,m2,m3,operator:'operator'};

test('Guest and every active Member read all Business rows through workspace and state',async()=>{
 for(const [name,ids] of Object.entries(expected)){
  const read=await as(who[name],c=>readLegacy(c,b));assert.deepEqual(titles(read),ids.map(title).sort(),name+' workspace');
  const state=await as(who[name],c=>snapshot(c,b));assert.equal(state.tasks.filter(t=>t.source_kind!=='campaign-legacy').length,ids.length,name+' state');
  assert.ok(state.task_roles.every(r=>state.tasks.some(t=>t.id===r.task_id)),name+' roles follow tasks');
 }
 const guest=await as('guest',c=>readLegacy(c,b));assert.ok(guest.meetingTaskManager.events.length>0,'Guest reads Business history');
 assert.deepEqual(titles(await as(m3,c=>readLegacy(c,b))),titles(guest),'Business-admin flag grants no additional data rights');
});
test('Guest and Member RLS reads are Business-wide, while tenant scope and audit immutability remain',async()=>{
 const count=(who,sql)=>as(who,async c=>(await c.query(sql,[b])).rowCount);
 for(const [name,ids] of Object.entries(expected))assert.equal(await count(who[name],"SELECT id FROM tasks WHERE business_id=$1 AND source_kind<>'campaign-legacy'"),ids.length,name);
 for(const table of ['task_roles','task_viewers','team_members','teams','meeting_participants','ai_briefs','change_events'])assert.equal(await count('guest',`SELECT 1 FROM ${table} WHERE business_id=$1`),await count(m1,`SELECT 1 FROM ${table} WHERE business_id=$1`),'Guest shares '+table+' read scope');
 assert.ok(await count('guest',"SELECT 1 FROM weekly_plan_tasks w JOIN tasks t ON t.id=w.task_id WHERE w.business_id=$1 AND t.visibility IN('team','restricted')")>0);
 const other=randomUUID();assert.equal(await transaction(other,null,async c=>(await c.query('SELECT 1 FROM tasks WHERE business_id=$1',[b])).rowCount),0,'a different Business cannot read these rows');
 await write(m1,c=>audit(c,b,'qa_fixture',randomUUID(),null,{fixture:true},'create'));
 const event=(await as(m1,c=>c.query("SELECT id,actor_kind,actor_member_id,actor_pid,actor_subject FROM change_events WHERE business_id=$1 AND actor_member_id=$2 ORDER BY occurred_at DESC LIMIT 1",[b,m1.id]))).rows[0];
 assert.ok(event);assert.equal(event.actor_kind,'authenticated');assert.equal(event.actor_member_id,m1.id);assert.equal(event.actor_pid,event.actor_subject);
 await assert.rejects(as(m1,c=>c.query('UPDATE change_events SET event_type=event_type WHERE business_id=$1 AND id=$2',[b,event.id])),e=>e.code==='42501','audit updates are denied');
 await assert.rejects(as('guest',c=>c.query('DELETE FROM change_events WHERE business_id=$1 AND id=$2',[b,event.id])),e=>e.code==='42501','audit deletes are denied');
 const role=(await admin.query("SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname='zuri_go_app'")).rows[0];assert.deepEqual(role,{rolsuper:false,rolbypassrls:false});
});
test('metric observations reject direct runtime UPDATE while audited corrections append a revision',async()=>{
 const channel=await write(m1,c=>save(c,b,'channels',{platform:'facebook',display_name:'QA immutable metric'}));
 const series=(await as(m1,c=>c.query("SELECT id FROM metric_series WHERE business_id=$1 AND channel_account_id=$2 AND metric_code='followers_total'",[b,channel.id]))).rows[0];assert.ok(series);
 const input={series_id:series.id,effective_at:'2026-10-01T00:00:00.000Z',value:1200,source_ref:'QA original metric'};
 const first=await write(m1,c=>observe(c,b,input));
 const before=(await as(m2,c=>c.query('SELECT * FROM metric_observations WHERE business_id=$1 AND id=$2',[b,first.id]))).rows[0];assert.ok(before);
 await assert.rejects(as(m2,c=>c.query('UPDATE metric_observations SET value=9999,is_current=false WHERE business_id=$1 AND id=$2',[b,first.id])),{code:'42501'},'runtime table UPDATE is revoked');
 assert.deepEqual((await as('guest',c=>c.query('SELECT * FROM metric_observations WHERE business_id=$1 AND id=$2',[b,first.id]))).rows[0],before,'failed direct UPDATE leaves immutable history unchanged');
 const correction=await write(m2,c=>observe(c,b,{...input,value:1250,source_ref:'QA corrected metric',expected_id:first.id,correction_reason:'QA source correction'}));
 assert.equal(correction.revision,2);assert.equal(correction.supersedes_id,first.id);assert.equal(Number(correction.value),1250);assert.equal(correction.is_current,true);
 const after=(await as('guest',c=>c.query('SELECT value,source_ref,revision,supersedes_id,is_current FROM metric_observations WHERE business_id=$1 AND id=$2',[b,first.id]))).rows[0];
 const {value:preservedValue,...history}=after;assert.equal(Number(preservedValue),1200,'correction preserves the original numeric value');
 assert.deepEqual(history,{source_ref:'QA original metric',revision:1,supersedes_id:null,is_current:false},'correction changes only the current marker on the old row');
 const event=(await as('guest',c=>c.query("SELECT actor_kind,actor_member_id,actor_pid,actor_subject,before_data,after_data FROM change_events WHERE business_id=$1 AND entity_type='metric_observations' AND entity_id=$2 AND event_type='observe'",[b,correction.id]))).rows[0];
 const memberPid=(await owner('SELECT pid FROM zuri_go.members WHERE business_id=$1 AND id=$2',[b,m2.id])).rows[0].pid;
 assert.ok(event);assert.equal(event.actor_kind,'authenticated');assert.equal(event.actor_member_id,m2.id);assert.equal(event.actor_pid,memberPid);assert.equal(event.actor_subject,memberPid);assert.equal(event.before_data.id,first.id);assert.equal(event.after_data.id,correction.id);
});
test('Guest reads attachments and history; active Members create and retire attachments',async()=>{
 const tid=(await owner("SELECT id FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'id'=$2",[b,t3])).rows[0].id;
 const file=await write(m0,c=>attachmentAction(c,b,t3,null,'POST',{filename:'สลิป.txt',base64:'YQ=='}));
 assert.equal((await as(m1,c=>attachmentAction(c,b,t3,file.id,'GET'))).id,file.id);
 assert.equal((await as('guest',c=>attachmentAction(c,b,t3,file.id,'GET'))).id,file.id);
 const before=(await owner("SELECT count(*)::int n FROM zuri_go.change_events WHERE business_id=$1 AND entity_id=$2",[b,file.id])).rows[0].n;
 await assert.rejects(as('guest',c=>attachmentAction(c,b,t3,null,'POST',{filename:'no.txt',base64:'YQ=='})),e=>e.code==='42501'||e.status===404);
 assert.equal((await owner("SELECT count(*)::int n FROM zuri_go.change_events WHERE business_id=$1 AND entity_id=$2",[b,file.id])).rows[0].n,before,'failed Guest mutation adds no audit event');
 const removed=await write(m1,c=>attachmentAction(c,b,t3,file.id,'DELETE',{}));assert.equal(removed.deleted,true);
 assert.equal((await as('guest',c=>attachmentAction(c,b,t3,file.id,'GET'))).deleted_at!=null,true,'soft-deleted file history remains readable');
 const seen=(who)=>as(who,async c=>(await c.query("SELECT 1 FROM change_events WHERE business_id=$1 AND entity_type IN('task_attachments','task_viewers','task_visibility') AND entity_id IN($2,$3)",[b,file.id,tid])).rowCount);
 assert.ok(await seen(m1)>0);assert.ok(await seen('guest')>0);
 assert.equal((await as(m1,async c=>(await c.query('SELECT deleted_at FROM task_attachments WHERE business_id=$1 AND id=$2',[b,file.id])).rows[0])).deleted_at!=null,true);
});
test('any active Member edits formerly restricted rows; Guest saves are denied',async()=>{
 const before=(await owner("SELECT row_version,visibility,legacy_metadata FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'id'=$2",[b,t3])).rows[0];
 assert.notEqual(team.id,teamB.id);const teams=await as(m1,c=>listTeams(c,b,c.zuriViewer));assert.ok(teams.find(x=>x.id===teamB.id).memberIds.includes(m1.legacy));assert.equal(teams.find(x=>x.id===team.id).memberIds.includes(m1.legacy),false,'Member belongs to Team B, not Team A');
 let mine=await as(m1,c=>readLegacy(c,b));const d=mine.meetingTaskManager,t=d.tasks.find(x=>x.id===t3);
 saveTask(d,{id:t3,version:t.version,description:'แก้งาน restricted โดย Member คนละทีม',responsibleId:m1.legacy,accountableId:m1.legacy,consultedIds:[],informedIds:[]});
 d.tasks.find(x=>x.id===t3).visibility='business';
 saveTask(d,{id:t2,version:d.tasks.find(x=>x.id===t2).version,description:'แก้งาน Team A จาก Member Team B'});
 mine=await write(m1,c=>saveLegacy(c,b,{version:mine.version,meetingTaskManager:d}));
 assert.equal(mine.meetingTaskManager.tasks.find(x=>x.id===t2).description,'แก้งาน Team A จาก Member Team B');
 assert.equal(mine.meetingTaskManager.tasks.find(x=>x.id===t3).description,'แก้งาน restricted โดย Member คนละทีม');
 const after=(await owner("SELECT row_version,visibility,legacy_metadata FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'id'=$2",[b,t3])).rows[0];
 assert.ok(Number(after.row_version)>Number(before.row_version));assert.equal(after.visibility,'business');
 assert.equal((await as(m2,c=>readLegacy(c,b))).meetingTaskManager.tasks.find(x=>x.id===t3).description,'แก้งาน restricted โดย Member คนละทีม');
 const forged=structuredClone(mine.meetingTaskManager);forged.events.push({id:randomUUID(),type:'forged',actorMemberId:m0.id,actorPid:'spoof'});
 await write(m1,c=>saveLegacy(c,b,{version:mine.version,meetingTaskManager:forged}));
 const forgedEvent=(await owner("SELECT actor_member_id,actor_pid,actor_subject,after_data FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='legacy_task_event' AND request_id=$2",[b,forged.events.at(-1).id])).rows[0];
 assert.equal(forgedEvent.actor_member_id,m1.id);assert.equal(forgedEvent.actor_pid,forgedEvent.actor_subject);assert.notEqual(forgedEvent.actor_pid,'spoof');
 await assert.rejects(as('guest',c=>saveLegacy(c,b,{version:mine.version,meetingTaskManager:mine.meetingTaskManager})),e=>e.status===401);
});
test('audience metadata and RACI remain editable data, never access predicates',async()=>{
 const read=await as(m2,c=>readLegacy(c,b)),d=read.meetingTaskManager;Object.assign(d.tasks.find(t=>t.id===t3),{visibility:'restricted',viewerIds:[m0.legacy],responsibleId:m0.legacy});
 await write(m2,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 for(const viewer of ['guest',m0,m1,m2,m3])assert.ok((await as(viewer,c=>readLegacy(c,b))).meetingTaskManager.tasks.some(t=>t.id===t3),String(viewer)+' sees the same restricted row');
});
test('all Members manage Teams; Guests read them and are denied writes',async()=>{
 const sales=await write(m1,c=>saveTeam(c,b,c.zuriViewer,{name:'ขาย QA Member '+randomUUID(),memberIds:[m1.legacy,m3.legacy]}));
 assert.deepEqual([...sales.memberIds].sort(),[m1.legacy,m3.legacy].sort());
 assert.equal((await as(m3,c=>listTeams(c,b,c.zuriViewer))).length,3);
 assert.equal((await as('guest',c=>listTeams(c,b,c.zuriViewer))).length,3);
 const updated=await write(m3,c=>saveTeam(c,b,c.zuriViewer,{name:'ขาย ปรับโดย Member admin-flag',memberIds:[m0.legacy,m3.legacy],row_version:sales.row_version},sales.id));
 assert.equal(updated.name,'ขาย ปรับโดย Member admin-flag');assert.deepEqual([...updated.memberIds].sort(),[m0.legacy,m3.legacy].sort());
 await assert.rejects(as('guest',c=>saveTeam(c,b,c.zuriViewer,{name:'ห้ามเขียน'})),e=>e.status===403);
 await write(m1,c=>saveTeam(c,b,c.zuriViewer,{archived:true,row_version:updated.row_version},sales.id));
 assert.ok((await as('guest',c=>listTeams(c,b,c.zuriViewer))).find(t=>t.id===sales.id).archived_at);
 await assert.rejects(write(m1,c=>c.query('UPDATE members SET is_business_admin=true WHERE business_id=$1 AND id=$2',[b,m1.id])),/operator only/);
 const audit=(await owner("SELECT count(*)::int n FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='teams'",[b])).rows[0].n;assert.ok(audit>=3);
});
test('former restricted meetings, references, receipts and history are Business-readable',async()=>{
 let read=await as('operator',c=>readLegacy(c,b));const d=read.meetingTaskManager;
 const src={sourceInstanceId:'qa-visibility',projectId:'p',recordingId:randomUUID(),contentHash:'h-'+randomUUID(),sourceMode:'native',segments:[{segmentId:'s1',startMs:0,endMs:500,text:'งบเงินเดือน'}]};
 const mid=addSource(d,src,{title:'ประชุมลับ HR'}),sourceId=d.meetings.find(m=>m.id===mid).sourceId,rid=saveReview(d,{sourceId,segments:src.segments,reviewHash:'rh-'+mid});
 addBatch(d,mid,{draftBatchId:'batch-'+mid,reviewRevisionId:rid,reviewHash:'rh-'+mid,sourceHash:src.contentHash,items:[{proposalId:'p1',kind:'task',title:'ปรับเงินเดือน',evidence:[{segmentId:'s1',startMs:0,endMs:500,quote:'งบเงินเดือน',reviewRevisionId:rid}]}]});
 Object.assign(d.meetings.find(m=>m.id===mid),{visibility:'restricted',participantIds:[m0.legacy],organizerId:m0.legacy});
 read=await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 await commitAs('operator',d,mid,[{proposalId:'p1',mode:'create',title:'ปรับเงินเดือน',responsibleId:m2.legacy,week:seed.weekStart}]);
 // FR-011-009 (P3, WI-09): the task the server's commit created is restricted with the meeting's participant m0 as a viewer; m2 is named as R.
 // Audience metadata and RACI remain recorded, while reads use the Business boundary.
 const created=await as('operator',c=>readLegacy(c,b)),made=created.meetingTaskManager.tasks.find(t=>t.title==='ปรับเงินเดือน');
 assert.deepEqual([...made.viewerIds].sort(),[m0.legacy]);assert.equal(made.responsibleId,m2.legacy);
 made.viewerIds=[m2.legacy];read=await write('operator',c=>saveLegacy(c,b,{version:created.version,meetingTaskManager:created.meetingTaskManager}));
 const m0view=await as(m0,c=>readLegacy(c,b)),m1view=await as(m1,c=>readLegacy(c,b)),m2view=await as(m2,c=>readLegacy(c,b));
 for(const view of [m0view,m1view,m2view,await as('guest',c=>readLegacy(c,b))]){
  assert.ok(view.meetingTaskManager.meetings.some(m=>m.id===mid));
  assert.ok(view.meetingTaskManager.sources.some(s=>s.meetingId===mid));
  assert.ok(view.meetingTaskManager.receipts.some(r=>r.batchId==='batch-'+mid));
  assert.ok(everywhere(view,'งบเงินเดือน'));
 }
 const visible=m2view.meetingTaskManager.tasks.find(t=>t.title==='ปรับเงินเดือน');assert.equal(visible.sourceRefsWithheld,undefined);assert.equal(visible.sourceRefs.length,1);
 await write(m0,c=>saveLegacy(c,b,{version:m0view.version,meetingTaskManager:m0view.meetingTaskManager}));
 const fresh=await as(m2,c=>readLegacy(c,b));await write(m2,c=>saveLegacy(c,b,{version:fresh.version,meetingTaskManager:fresh.meetingTaskManager}));
 const full=await as('operator',c=>readLegacy(c,b));
 assert.equal(full.meetingTaskManager.receipts.filter(r=>r.batchId==='batch-'+mid).length,1,'receipt kept');
 assert.equal(full.meetingTaskManager.tasks.find(t=>t.title==='ปรับเงินเดือน').sourceRefs.length,1,'meeting reference kept');
});

// ---- FEAT-011 phase P3: FR-011-009 and FR-011-010 -------------------------------------------------------------------
// A meeting with one source, one review and one draft batch whose evidence quote is unique to the label.
async function addMeeting(d,label,access){
 const quote='ข้อความลับ '+label,src={sourceInstanceId:'qa-p3',projectId:'p',recordingId:randomUUID(),contentHash:'h-'+randomUUID(),sourceMode:'native',segments:[{segmentId:'s1',startMs:0,endMs:500,text:quote}]};
 const mid=addSource(d,src,{title:'ประชุม '+label}),sourceId=d.meetings.find(m=>m.id===mid).sourceId,review=randomUUID();
 const rid=saveReview(d,{id:review,sourceId,segments:src.segments,reviewHash:await reviewHash(review,src.segments)});
 addBatch(d,mid,{draftBatchId:'batch-'+mid,reviewRevisionId:rid,reviewHash:d.reviews.find(r=>r.id===rid).reviewHash,sourceHash:src.contentHash,items:[{proposalId:'p1',kind:'task',title:'งาน '+label,evidence:[{segmentId:'s1',startMs:0,endMs:500,quote,reviewRevisionId:rid}]}]});
 Object.assign(d.meetings.find(m=>m.id===mid),access);
 return {mid,quote,src,rid,pick:()=>({sources:d.sources.filter(s=>s.meetingId===mid),reviews:d.reviews.filter(r=>r.meetingId===mid),batches:d.batches.filter(x=>x.meetingId===mid)})};
}
const restricted=(...people)=>({visibility:'restricted',participantIds:people.map(p=>p.legacy),organizerId:people[0].legacy});
const meetingRow=mid=>owner("SELECT id,visibility,transcript_custody,legacy_metadata FROM zuri_go.meetings WHERE business_id=$1 AND legacy_metadata->>'id'=$2",[b,mid]).then(r=>r.rows[0]);
const revisionRows=mid=>meetingRow(mid).then(m=>owner('SELECT id,kind,content_hash,segments,legacy_metadata FROM zuri_go.meeting_revisions WHERE business_id=$1 AND meeting_id=$2 ORDER BY kind',[b,m.id])).then(r=>r.rows);
const batchRows=mid=>meetingRow(mid).then(m=>owner('SELECT items,legacy_metadata FROM zuri_go.meeting_draft_batches WHERE business_id=$1 AND meeting_id=$2',[b,m.id])).then(r=>r.rows);
const taskOf=title=>owner("SELECT id,visibility FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'title'=$2",[b,title]).then(r=>r.rows[0]);
// What the recording machine keeps after a Member saves the meeting to the hosted API: a participant saves a new restricted meeting.
async function savedByMember(label,people=[m0,m1],{commit=false}={}){
 let read=await as(people[0],c=>readLegacy(c,b));const d=read.meetingTaskManager,made=await addMeeting(d,label,restricted(...people));
 const full=made.pick();
 read=await write(people[0],c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 // The server commits on the stubs it stored: spans only, no quote text (WI-09).
 if(commit)read=(await commitAs(people[0],d,made.mid,[{proposalId:'p1',mode:'create',title:'งานจากประชุม '+label,responsibleId:people[0].legacy,accountableId:people[0].legacy,week:seed.weekStart}])).workspace;
 return {...made,full,read};
}
const everywhere=(value,text)=>JSON.stringify(value).includes(text);

test('a task created from a restricted meeting is restricted with its participants as viewers, whatever the client sent (FR-011-009)',async()=>{
 let read=await as('operator',c=>readLegacy(c,b));const d=read.meetingTaskManager;
 const made=await addMeeting(d,'FR009',restricted(m0,m1,m2));
 read=await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 // The request carries choices only; an audience it claims anyway (here a wider one) is ignored.
 read=(await commitAs('operator',d,made.mid,[{proposalId:'p1',mode:'create',title:'งานจากประชุมลับ FR009',responsibleId:m3.legacy,accountableId:m0.legacy,week:seed.weekStart,visibility:'business',viewerIds:[]}],{visibility:'business',viewerIds:[]})).workspace;
 const row=await taskOf('งานจากประชุมลับ FR009'),id=read.meetingTaskManager.tasks.find(t=>t.title==='งานจากประชุมลับ FR009').id;
 assert.equal(row.visibility,'restricted');
 const viewers=(await owner('SELECT member_id FROM zuri_go.task_viewers WHERE business_id=$1 AND task_id=$2',[b,row.id])).rows.map(r=>r.member_id).sort();
 assert.deepEqual(viewers,[m0.id,m1.id,m2.id].sort(),'AC-011-009-01: the three participants are its viewers');
 const asTask=v=>v.meetingTaskManager.tasks.find(t=>t.id===id);
 // Every active Member and the Guest sees the former restricted record and its linked evidence.
 const r=await as(m3,c=>readLegacy(c,b));assert.ok(asTask(r));assert.equal(asTask(r).sourceRefsWithheld,undefined);assert.equal(asTask(r).sourceRefs.length,1);
 assert.equal(everywhere(r,made.quote),true);assert.equal(r.meetingTaskManager.meetings.some(m=>m.id===made.mid),true);assert.equal(r.meetingTaskManager.batches.some(x=>x.meetingId===made.mid),true);
 assert.equal(everywhere(await as(m0,c=>readLegacy(c,b)),made.quote),true,'a participant reads the quote');
 const guest=await as('guest',c=>readLegacy(c,b));assert.ok(asTask(guest));assert.equal(everywhere(guest,made.quote),true);
 // Editing the legacy audience metadata does not change who reads the evidence.
 let own=await as(m0,c=>readLegacy(c,b));Object.assign(asTask(own),{visibility:'public',visibilityReason:'metadata only'});
 await write(m0,c=>saveLegacy(c,b,{version:own.version,meetingTaskManager:own.meetingTaskManager}));
 for(const who of [await as('guest',c=>readLegacy(c,b)),await as(m3,c=>readLegacy(c,b))]){assert.equal(everywhere(who,made.quote),true);assert.equal(who.meetingTaskManager.meetings.some(m=>m.id===made.mid),true);}
 // /state returns task rows with their metadata: the quotes copied there follow the meeting too (RCA zuri-go-meeting-quotes-outside-meeting-audience).
 for(const who of ['guest',m3])assert.equal(everywhere(await as(who,c=>snapshot(c,b)),made.quote),false);
 // WI-09: a task created by the server's commit keeps no quote in its row at all (they live in meeting_task_links); the audience reads them through the meeting (asserted above).
 assert.equal(everywhere(await as(m1,c=>snapshot(c,b)),made.quote),false);
});
test('a direct query finds no quote text in the task row or the links for someone outside the meeting (WI-09, NFR-011-001)',async()=>{
 let read=await as('operator',c=>readLegacy(c,b));const d=read.meetingTaskManager;
 const made=await addMeeting(d,'WI09-direct',restricted(m0,m1));
 await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 await commitAs('operator',d,made.mid,[{proposalId:'p1',mode:'create',title:'งานจากประชุมลับ WI09',responsibleId:m3.legacy,accountableId:m0.legacy,week:seed.weekStart}]);
 const query=who=>as(who,async c=>({tasks:(await c.query('SELECT legacy_metadata FROM tasks WHERE business_id=$1',[b])).rows,links:(await c.query('SELECT evidence FROM meeting_task_links WHERE business_id=$1',[b])).rows}));
 // The task row keeps no evidence quote; the Business-wide meeting link remains readable to every viewer.
 const outside=await query(m3);assert.ok(outside.tasks.some(r=>r.legacy_metadata.title==='งานจากประชุมลับ WI09'),'the task row is readable');
 assert.equal(everywhere(outside.tasks,made.quote),false);assert.equal(everywhere(outside.links,made.quote),true);assert.ok(outside.links.length>0);
 const inside=await query(m1);assert.equal(everywhere(inside.tasks,made.quote),false,'no quote in the task row for anyone');assert.equal(everywhere(inside.links,made.quote),true,'the meeting audience finds it in the links');
 const task=(await owner("SELECT legacy_metadata FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'title'='งานจากประชุมลับ WI09'",[b])).rows[0].legacy_metadata;
 assert.equal(task.sourceRefs.length,1);assert.equal(task.sourceRefs[0].evidence,undefined,'the reference is stored without evidence');assert.equal(task.sourceRefs[0].proposalId,'p1');
 // A client save cannot put the quote back into the task row.
 const view=await as(m1,c=>readLegacy(c,b));assert.equal(everywhere(view.meetingTaskManager.tasks.find(t=>t.title==='งานจากประชุมลับ WI09').sourceRefs,made.quote),true,'the participant reads the evidence re-attached');
 await write(m1,c=>saveLegacy(c,b,{version:view.version,meetingTaskManager:view.meetingTaskManager}));
 assert.equal(everywhere((await owner("SELECT legacy_metadata FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'title'='งานจากประชุมลับ WI09'",[b])).rows,made.quote),false);
});
test('a task from a business meeting keeps the level the client chose (FR-011-009, holdout)',async()=>{
 let read=await as('operator',c=>readLegacy(c,b));const d=read.meetingTaskManager;
 const made=await addMeeting(d,'FR009-open',{visibility:'business'});
 await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 await commitAs('operator',d,made.mid,[{proposalId:'p1',mode:'create',title:'งานจากประชุมทั่วไป',responsibleId:m3.legacy,week:seed.weekStart}]);
 assert.equal((await taskOf('งานจากประชุมทั่วไป')).visibility,'business');
});
test('a Member saves a restricted meeting as stubs; the operator keeps full content (FR-011-010, AC-011-010-01)',async()=>{
 const made=await savedByMember('FR010-a',[m0,m1],{commit:true});
 const meeting=await meetingRow(made.mid);assert.equal(meeting.transcript_custody,'local_only');
 const revisions=await revisionRows(made.mid);assert.equal(revisions.length,2);
 for(const r of revisions){assert.deepEqual(r.segments,[],'no transcript segments in the hosted database');assert.equal(r.legacy_metadata.withheld,true);assert.deepEqual(r.legacy_metadata.segments,[]);}
 assert.equal(revisions.find(r=>r.kind==='source').content_hash,made.src.contentHash,'the hash is kept so the recording machine can prove its copy');
 const [batch]=await batchRows(made.mid);assert.equal(batch.legacy_metadata.withheld,true);assert.equal(everywhere(batch,made.quote),false,'no evidence text in the draft batch');assert.equal(batch.items[0].evidence[0].segmentId,'s1');
 assert.equal((await owner('SELECT evidence FROM zuri_go.meeting_task_links WHERE business_id=$1',[b])).rows.some(r=>everywhere(r.evidence,made.quote)),false,'no evidence text in the task links');
 assert.equal(meeting.legacy_metadata.workingCopy,undefined);
 // Approved tasks reach the hosted database: the commit made a restricted task for the two participants (FR-011-009 through a Member).
 assert.equal((await taskOf('งานจากประชุม FR010-a')).visibility,'restricted');
 // Reads of stubs pass the server and the client validation, and a participant can save them back unchanged.
 for(const who of [m0,m1]){const view=await as(who,c=>readLegacy(c,b));assert.doesNotThrow(()=>validateState(view.meetingTaskManager));
  const source=view.meetingTaskManager.sources.find(s=>s.meetingId===made.mid);assert.equal(source.withheld,true);assert.deepEqual(source.segments,[]);assert.equal(view.meetingTaskManager.meetings.find(m=>m.id===made.mid).transcriptCustody,'local_only');
  assert.equal(everywhere(view.meetingTaskManager.sources.concat(view.meetingTaskManager.reviews,view.meetingTaskManager.batches).filter(x=>x.meetingId===made.mid),made.quote),false);
  await write(who,c=>saveLegacy(c,b,{version:view.version,meetingTaskManager:view.meetingTaskManager}));}
 assert.equal((await as(m2,c=>readLegacy(c,b))).meetingTaskManager.meetings.some(m=>m.id===made.mid),true,'every active Member sees the meeting');
 // The local operator keeps full content and is not bound by custody.
 let read=await as('operator',c=>readLegacy(c,b));const d=read.meetingTaskManager,local=await addMeeting(d,'FR010-operator',restricted(m0));
 await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 const kept=await revisionRows(local.mid);assert.equal(kept.length,2);for(const r of kept){assert.equal(r.segments.length,1);assert.equal(r.legacy_metadata.withheld,undefined);}
 assert.equal((await batchRows(local.mid))[0].items[0].evidence[0].quote,local.quote);assert.equal((await meetingRow(local.mid)).transcript_custody,'local_only');
});
test('a stub cannot be overwritten, and only custody can mark a revision withheld (FR-011-010)',async()=>{
 const made=await savedByMember('FR010-b');
 const source=(await revisionRows(made.mid)).find(r=>r.kind==='source'),before=structuredClone(source);
 await assert.rejects(as(m0,c=>c.query('UPDATE meeting_revisions SET content_hash=$3 WHERE business_id=$1 AND id=$2',[b,source.id,'forged-hash'])),{code:'42501'},'direct runtime UPDATE cannot alter immutable revision metadata');
 await assert.rejects(as(m0,c=>c.query("UPDATE meeting_revisions SET segments='[{\"segmentId\":\"forged\",\"startMs\":0,\"endMs\":10,\"text\":\"forged\"}]'::jsonb WHERE business_id=$1 AND id=$2",[b,source.id])),{code:'42501'},'direct runtime UPDATE cannot fill a withheld revision outside the upload routine');
 assert.deepEqual((await revisionRows(made.mid)).find(r=>r.id===source.id),before,'failed direct updates preserve the revision');
 const view=await as(m0,c=>readLegacy(c,b)),d=view.meetingTaskManager;d.sources.find(s=>s.meetingId===made.mid).segments=made.full.sources[0].segments;
 await write(m0,c=>saveLegacy(c,b,{version:view.version,meetingTaskManager:d}));// accepted, but only the upload can store full content
 for(const r of await revisionRows(made.mid)){assert.deepEqual(r.segments,[],'full content sent in a save is not stored');assert.equal(r.legacy_metadata.withheld,true);}
 const changed=await as(m0,c=>readLegacy(c,b)),c2=changed.meetingTaskManager;c2.sources.find(s=>s.meetingId===made.mid).coverage={status:'complete'};
 await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:changed.version,meetingTaskManager:c2})),/ห้ามเขียนทับ/,'a stub cannot be rewritten with other metadata');
 const open=await as(m0,c=>readLegacy(c,b)),o=open.meetingTaskManager,plain=await addMeeting(o,'FR010-forged',{visibility:'business'});
 o.sources.find(s=>s.meetingId===plain.mid).withheld=true;o.sources.find(s=>s.meetingId===plain.mid).segments=[];
 await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:open.version,meetingTaskManager:o})),e=>e.status===422,'a revision of a meeting that is not local_only cannot claim to be withheld');
});
test('an empty transcript upload cannot change custody; transcript revisions may upload without batches',async()=>{
 const empty=await savedByMember('FR010-empty-upload',[m0,m1]),emptyMeeting=await meetingRow(empty.mid);
 await owner('DELETE FROM zuri_go.meeting_draft_batches WHERE business_id=$1 AND meeting_id=$2',[b,emptyMeeting.id]);
 await owner("DELETE FROM zuri_go.meeting_revisions WHERE business_id=$1 AND meeting_id=$2 AND kind='review'",[b,emptyMeeting.id]);
 await owner("DELETE FROM zuri_go.meeting_revisions WHERE business_id=$1 AND meeting_id=$2 AND kind='source'",[b,emptyMeeting.id]);
 const input={reason:'QA empty transcript upload',sources:[],reviews:[],batches:[]};
 await assert.rejects(write(m0,c=>uploadTranscript(c,b,empty.mid,input)),e=>e.status===422,'the service rejects a custody transition with no withheld transcript revisions');
 await assert.rejects(write(m0,c=>c.query('SELECT zuri_go.complete_meeting_transcript_upload($1::uuid,$2::uuid,$3::text,$4::jsonb,$5::text[])',[b,emptyMeeting.id,input.reason,JSON.stringify([]),[]])),{code:'22023'},'the database routine rejects an empty revision set even when there are no stubs');
 assert.equal((await meetingRow(empty.mid)).transcript_custody,'local_only','empty upload leaves custody unchanged');
 assert.equal((await owner("SELECT count(*)::int AS n FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='meetings' AND event_type='transcript_upload' AND entity_id=$2",[b,emptyMeeting.id])).rows[0].n,0,'empty upload appends no audit event');

 const noBatch=await savedByMember('FR010-zero-batch',[m0,m1]),noBatchMeeting=await meetingRow(noBatch.mid);
 await owner('DELETE FROM zuri_go.meeting_draft_batches WHERE business_id=$1 AND meeting_id=$2',[b,noBatchMeeting.id]);
 const result=await write(m0,c=>uploadTranscript(c,b,noBatch.mid,{reason:'QA transcript without draft batch',sources:noBatch.full.sources,reviews:noBatch.full.reviews,batches:[]}));
 assert.equal((await meetingRow(noBatch.mid)).transcript_custody,'cloud','non-empty transcript revisions may upload without batches');
 const event=(await owner("SELECT after_data FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='meetings' AND event_type='transcript_upload' AND entity_id=$2",[b,noBatchMeeting.id])).rows[0];
 assert.ok(event);assert.ok(event.after_data.revisionIds.length>0);assert.deepEqual(event.after_data.batchIds,[]);
 assert.doesNotThrow(()=>validateState(result.meetingTaskManager));
});
test('only a meeting participant may explicitly upload a custody-held transcript; uploaded evidence is Guest-readable',async()=>{
 const made=await savedByMember('FR010-c',[m0,m1],{commit:true}),full=made.full,body=(patch={})=>({reason:'ต้องใช้ตรวจหลักฐานร่วมกัน',...full,...patch});
 const heldMeeting=await meetingRow(made.mid),stubRevisions=await revisionRows(made.mid),batchIds=(await owner("SELECT legacy_metadata->'batch'->>'id' AS id FROM zuri_go.meeting_draft_batches WHERE business_id=$1 AND meeting_id=$2 AND legacy_metadata->>'withheld'='true' ORDER BY legacy_metadata->'batch'->>'id'",[b,heldMeeting.id])).rows.map(r=>r.id);
 await assert.rejects(write(m0,c=>c.query('SELECT zuri_go.complete_meeting_transcript_upload($1::uuid,$2::uuid,$3::text,$4::jsonb,$5::text[])',[b,heldMeeting.id,'QA upload reason',null,batchIds])),{code:'22023'},'the database upload routine rejects NULL revision arrays');
 const forgedStubs=stubRevisions.map(row=>{const doc=(row.kind==='source'?full.sources:full.reviews).find(r=>r.id===row.legacy_metadata.id);return {id:row.id,segments:doc.segments,metadata:{...doc,withheld:true}};});
 await assert.rejects(write(m0,c=>c.query('SELECT zuri_go.complete_meeting_transcript_upload($1::uuid,$2::uuid,$3::text,$4::jsonb,$5::text[])',[b,heldMeeting.id,'QA upload reason',JSON.stringify(forgedStubs),batchIds])),{code:'42501'},'the database upload routine rejects metadata still marked withheld');
 const beforeNonparticipant=structuredClone(await revisionRows(made.mid)),revisionUploads=stubRevisions.map(row=>{const doc=(row.kind==='source'?full.sources:full.reviews).find(r=>r.id===row.legacy_metadata.id);return {id:row.id,segments:doc.segments,metadata:doc};});
 await assert.rejects(write(m2,c=>uploadTranscript(c,b,made.mid,body())),e=>e.status===403,'an active Member who is not a meeting participant cannot upload through the service');
 await assert.rejects(write(m2,c=>c.query('SELECT zuri_go.complete_meeting_transcript_upload($1::uuid,$2::uuid,$3::text,$4::jsonb,$5::text[])',[b,heldMeeting.id,'QA upload reason',JSON.stringify(revisionUploads),batchIds])),{code:'42501'},'the database routine independently denies a nonparticipant');
 assert.equal((await meetingRow(made.mid)).transcript_custody,'local_only','invalid direct routine calls leave custody unchanged');
 assert.deepEqual(await revisionRows(made.mid),beforeNonparticipant,'nonparticipant attempts leave stored transcript stubs unchanged');
 assert.equal((await owner("SELECT count(*)::int AS n FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='meetings' AND event_type='transcript_upload' AND entity_id=$2",[b,heldMeeting.id])).rows[0].n,0,'invalid direct routine calls append no audit event');
 await assert.rejects(write('guest',c=>uploadTranscript(c,b,made.mid,body())),e=>e.status===401);
 await assert.rejects(write('operator',c=>uploadTranscript(c,b,made.mid,body())),e=>e.status===401,'operator identity is not an authenticated Member session');
 await assert.rejects(write(m0,c=>uploadTranscript(c,b,made.mid,body({reason:'  '}))),e=>e.status===422);
 await assert.rejects(write(m0,c=>uploadTranscript(c,b,made.mid,body({sources:[{...full.sources[0],contentHash:'other'}]}))),e=>e.status===422,'content that does not match the stored hash');
 await assert.rejects(write(m0,c=>uploadTranscript(c,b,made.mid,body({reviews:[{...full.reviews[0],segments:[{...full.reviews[0].segments[0],text:'แต่งขึ้น'}]}]}))),e=>e.status===422,'edited review text does not match its hash');
 await assert.rejects(write(m0,c=>uploadTranscript(c,b,made.mid,body({batches:[{...full.batches[0],items:[{...full.batches[0].items[0],evidence:[{...full.batches[0].items[0].evidence[0],quote:'แต่งขึ้น'}]}]}]}))),e=>e.status===422,'evidence that the review does not contain');
 await assert.rejects(write(m0,c=>uploadTranscript(c,b,made.mid,body({batches:[]}))),e=>e.status===422,'every stub must be matched');
 assert.equal((await meetingRow(made.mid)).transcript_custody,'local_only','nothing changed so far');
 const result=await write(m0,c=>uploadTranscript(c,b,made.mid,body()));
 assert.equal((await meetingRow(made.mid)).transcript_custody,'cloud');
 for(const r of await revisionRows(made.mid)){assert.equal(r.segments.length,1);assert.equal(r.legacy_metadata.withheld,undefined);}
 assert.equal((await batchRows(made.mid))[0].items[0].evidence[0].quote,made.quote);
 assert.doesNotThrow(()=>validateState(result.meetingTaskManager));assert.equal(result.meetingTaskManager.meetings.find(m=>m.id===made.mid).transcriptCustody,'cloud');
 const event=(await owner("SELECT event_type,before_data,after_data,actor_member_id FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='meetings' AND event_type='transcript_upload' AND entity_id=$2",[b,(await meetingRow(made.mid)).id])).rows;
 assert.equal(event.length,1);assert.equal(event[0].after_data.reason,'ต้องใช้ตรวจหลักฐานร่วมกัน');assert.equal(event[0].actor_member_id,m0.id);assert.equal(event[0].before_data.transcript_custody,'local_only');
 const seen=(who)=>as(who,async c=>(await c.query("SELECT 1 FROM change_events WHERE business_id=$1 AND entity_type='meetings' AND event_type='transcript_upload'",[b])).rowCount);
 assert.ok(await seen(m2)>0);assert.ok(await seen(m1)>0);assert.ok(await seen('guest')>0,'Guests read the audit event');
 const audience=await as(m1,c=>readLegacy(c,b));assert.equal(audience.meetingTaskManager.sources.find(s=>s.meetingId===made.mid).segments[0].text,made.quote,'the audience reads the uploaded transcript');
 const outside=await as('guest',c=>readLegacy(c,b));assert.equal(everywhere(outside,made.quote),true);assert.equal(outside.meetingTaskManager.sources.some(s=>s.meetingId===made.mid),true);
 await write(m1,c=>saveLegacy(c,b,{version:audience.version,meetingTaskManager:audience.meetingTaskManager}));// full content saves back unchanged
 await assert.rejects(write(m0,c=>uploadTranscript(c,b,made.mid,body())),e=>e.status===409,'a second upload is refused');
});
test('a meeting that is not restricted keeps today\'s behaviour; one that becomes restricted stubs what is saved later (AC-011-010-04)',async()=>{
 let read=await as(m0,c=>readLegacy(c,b));const d=read.meetingTaskManager,open=await addMeeting(d,'FR010-open',{visibility:'business'});
 read=await write(m0,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 assert.equal((await meetingRow(open.mid)).transcript_custody,'cloud');
 for(const r of await revisionRows(open.mid)){assert.equal(r.segments.length,1);assert.equal(r.legacy_metadata.withheld,undefined);}
 assert.equal((await batchRows(open.mid))[0].items[0].evidence[0].quote,open.quote);
 assert.equal((await as(m1,c=>readLegacy(c,b))).meetingTaskManager.sources.find(s=>s.meetingId===open.mid).segments.length,1);
 // The meeting becomes restricted: custody is now local_only. Content stored earlier is not deleted; a review saved afterwards is a stub.
 const next=structuredClone(read.meetingTaskManager),meeting=next.meetings.find(m=>m.id===open.mid),segs=next.sources.find(s=>s.meetingId===open.mid).segments,later=randomUUID();
 Object.assign(meeting,restricted(m0,m1));saveReview(next,{id:later,sourceId:meeting.sourceId,segments:segs,reviewHash:await reviewHash(later,segs)});
 await write(m0,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:next}));
 assert.equal((await meetingRow(open.mid)).transcript_custody,'local_only');
 const rows=await revisionRows(open.mid);assert.equal(rows.filter(r=>r.legacy_metadata.withheld).length,1);assert.equal(rows.filter(r=>!r.legacy_metadata.withheld).length,2,'the source and first review stay as stored');
});
test('Guest projection exposes non-secret Member contact fields without credential material',async()=>{
 await owner("UPDATE zuri_go.members SET email='d16@example.test',phone='0899999999',notes='หมายเหตุลับ D16',nickname='ชื่อเล่น D16',team='ทีม D16',position='ตำแหน่ง D16',full_name='ชื่อเต็ม D16' WHERE business_id=$1 AND id=$2",[b,m0.id]);
 const secrets=['d16@example.test','0899999999','หมายเหตุลับ D16','ชื่อเล่น D16','ทีม D16','ตำแหน่ง D16','ชื่อเต็ม D16'],total=(await owner('SELECT count(*)::int n FROM zuri_go.members WHERE business_id=$1',[b])).rows[0].n;
 const guest=await as('guest',c=>readLegacy(c,b)),state=await as('guest',c=>snapshot(c,b));
 for(const s of secrets){assert.equal(everywhere(guest,s),true,'Guest workspace '+s);assert.equal(everywhere(state,s),true,'Guest state '+s);}
 assert.equal(guest.meetingTaskManager.members.length,total);assert.equal(state.members.length,total);
 for(const m of guest.meetingTaskManager.members)assert.ok(['email','phone','notes','nickname','team','position','fullName'].some(k=>Object.hasOwn(m,k)));
 for(const m of state.members)assert.ok(Object.hasOwn(m,'email'));
 assert.doesNotThrow(()=>validateState(guest.meetingTaskManager));
 assert.equal(guest.meetingTaskManager.members.find(m=>m.id===m0.legacy).displayName,state.members.find(m=>m.id===m0.id).display_name,'the name a Guest needs to read the work is kept');
 for(const [name,viewer] of [['member',m1],['admin',m3],['operator','operator']]){
  const read=await as(viewer,c=>readLegacy(c,b)),rows=await as(viewer,c=>snapshot(c,b));
  for(const s of secrets){assert.equal(everywhere(read,s),true,name+' workspace '+s);assert.equal(everywhere(rows,s),true,name+' state '+s);}
 }
 const hashes=(await owner('SELECT password_hash FROM zuri_go.member_credentials WHERE business_id=$1',[b])).rows.map(r=>r.password_hash);
 for(const output of [guest,state]){
  for(const secret of ['password_hash','credential_version','session_token','provider_api_key','admin_secret'])assert.equal(everywhere(output,secret),false,'secret field '+secret);
  for(const hash of hashes)assert.equal(everywhere(output,hash),false,'credential hash is absent from response');
 }
});
test('every active Member can manage Member profiles/status; credential custody and audit identity stay protected',async()=>{
 const stored=id=>owner('SELECT id,display_name,nickname,phone,status,row_version::int v FROM zuri_go.members WHERE business_id=$1 AND id=$2',[b,id]).then(r=>r.rows[0]);
 const patch=(viewer,id,input)=>write(viewer,async c=>save(c,b,'members',{row_version:(await stored(id)).v,...input},id));
 const second=await patch(m1,m2.id,{nickname:'แก้โดย Member ต่างทีม',phone:'0812345678'});
 assert.equal(second.nickname,'แก้โดย Member ต่างทีม');assert.equal(second.phone,'0812345678');
 const adminFlagMember=await patch(m3,m1.id,{nickname:'แก้โดย Member ที่มี admin flag'});assert.equal(adminFlagMember.nickname,'แก้โดย Member ที่มี admin flag');
 const created=await write(m1,c=>save(c,b,'members',{display_name:'สมาชิกสร้างโดย Member',status:'active'}));assert.ok(created.id);assert.equal(created.status,'active');
 assert.equal((await owner('SELECT count(*)::int n FROM zuri_go.member_credentials WHERE business_id=$1 AND member_id=$2',[b,created.id])).rows[0].n,0,'profile creation does not provision credentials');
 const credBefore=(await owner('SELECT enabled FROM zuri_go.member_credentials WHERE business_id=$1 AND member_id=$2',[b,m1.id])).rows[0].enabled;
 await assert.rejects(as(m1,c=>c.query('UPDATE member_credentials SET enabled=false WHERE business_id=$1 AND member_id=$2 RETURNING enabled',[b,m1.id])),e=>e.code==='42501','ordinary Member cannot reset credentials');
 assert.equal((await owner('SELECT enabled FROM zuri_go.member_credentials WHERE business_id=$1 AND member_id=$2',[b,m1.id])).rows[0].enabled,credBefore);
 assert.equal((await patch(m1,m2.id,{status:'inactive'})).status,'inactive');
 await assert.rejects(write(m2,c=>c.query('UPDATE teams SET name=name WHERE business_id=$1',[b])),e=>e.status===401,'inactive session cannot write');
 assert.equal((await patch(m1,m2.id,{status:'active'})).status,'active');
 const retired=await patch(m1,m1.id,{status:'inactive'});assert.equal(retired.status,'inactive');
 const event=(await owner("SELECT actor_kind,actor_member_id,actor_pid,actor_subject,after_data FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='members' AND entity_id=$2 AND event_type='update' ORDER BY occurred_at DESC LIMIT 1",[b,m1.id])).rows[0];
 assert.equal(event.actor_kind,'authenticated');assert.equal(event.actor_member_id,m1.id);assert.equal(event.actor_pid,event.actor_subject);assert.equal(event.after_data.status,'inactive');
 await assert.rejects(write(m1,c=>save(c,b,'members',{display_name:'cannot continue',row_version:retired.row_version},m1.id)),e=>e.status===401,'fresh request rechecks inactive session');
 const visible=await as('guest',c=>readLegacy(c,b));assert.ok(visible.meetingTaskManager.members.some(x=>x.id===created.id),'Guest sees the created Member profile');
 assert.equal((await as(m3,c=>snapshot(c,b))).members.length,(await as(m1,c=>snapshot(c,b))).members.length,'admin flag and ordinary Member read the same registry');
});
