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
import {snapshot} from '../service.mjs';
import {readLegacy,saveLegacy,uploadTranscript} from '../workspace.mjs';
import {attachmentAction} from '../attachments.mjs';
import {listTeams,saveTeam} from '../teams.mjs';
import {empty,seedWorkspace,saveTask,addSource,saveReview,addBatch,commitBatch,validateState,reviewHash} from '../../web/src/content/meeting/model.mjs';
const seed=JSON.parse(await readFile(new URL('../../web/src/content/meeting/seed.json',import.meta.url),'utf8'));
const admin=new pg.Client({connectionString:config().adminUrl});await admin.connect();
after(async()=>{await admin.end();await pool.end();});
const b=randomUUID();
await transaction(b,c=>c.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[b,'QA ONLY · visibility verification',b]));
async function owner(sql,params){await admin.query('BEGIN');try{await admin.query("SELECT set_config('zuri_go.business_id',$1,true)",[b]);const r=await admin.query(sql,params);await admin.query('COMMIT');return r;}catch(e){await admin.query('ROLLBACK');throw e;}}
const principal=who=>who==='guest'?null:who==='operator'?OPERATOR:session({m:who.id,cv:1});
const as=(who,fn)=>transaction(b,principal(who),fn);
// Writes by a Member go through authorizeWrite, as the API does.
const write=(who,fn)=>transaction(b,principal(who),async c=>{if(who!=='operator')await authorizeWrite(c,b);return fn(c);});
const titles=ws=>ws.meetingTaskManager.tasks.map(t=>t.title).sort();

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
ws=await as('operator',c=>readLegacy(c,b));
// t0 public, t1 business, t2 team บัญชี, t3 restricted (R/A m0, viewer m2), t4 business by default.
domain=ws.meetingTaskManager;const [t0,t1,t2,t3,t4]=domain.tasks.map(t=>t.id);
const set=(id,patch,raci)=>{const t=domain.tasks.find(x=>x.id===id);if(raci)saveTask(domain,{id,version:t.version,...raci});Object.assign(domain.tasks.find(x=>x.id===id),patch);};
set(t0,{visibility:'public',visibilityReason:'QA public item'});
set(t2,{visibility:'team',teamId:team.id},{responsibleId:m0.legacy,accountableId:m0.legacy,consultedIds:[],informedIds:[]});
set(t3,{visibility:'restricted',viewerIds:[m2.legacy]},{responsibleId:m0.legacy,accountableId:m0.legacy,consultedIds:[],informedIds:[]});
ws=await write('operator',c=>saveLegacy(c,b,{version:ws.version,meetingTaskManager:domain}));
const title=id=>ws.meetingTaskManager.tasks.find(t=>t.id===id).title;
const expected={guest:[t0],m1:[t0,t1,t4],m0:[t0,t1,t2,t3,t4],m2:[t0,t1,t3,t4],m3:[t0,t1,t4],operator:[t0,t1,t2,t3,t4]};
const who={guest:'guest',m0,m1,m2,m3,operator:'operator'};

test('every viewer reads exactly its audience through workspace, state and overview (FR-011-004, -007)',async()=>{
 for(const [name,ids] of Object.entries(expected)){
  const read=await as(who[name],c=>readLegacy(c,b));assert.deepEqual(titles(read),ids.map(title).sort(),name+' workspace');
  const state=await as(who[name],c=>snapshot(c,b));assert.equal(state.tasks.filter(t=>t.source_kind!=='campaign-legacy').length,ids.length,name+' state');
  assert.ok(state.task_roles.every(r=>state.tasks.some(t=>t.id===r.task_id)),name+' roles follow tasks');
 }
 const guest=await as('guest',c=>readLegacy(c,b));assert.equal(guest.meetingTaskManager.events.length,0,'no task history for a Guest');
 assert.equal((await as(m3,c=>readLegacy(c,b))).meetingTaskManager.tasks.some(t=>t.id===t3),false,'admin reads nothing extra (FR-011-002)');
});
test('row-level security alone returns only the audience (NFR-011-001)',async()=>{
 const count=(who,sql)=>as(who,async c=>(await c.query(sql,[b])).rowCount);
 for(const [name,ids] of Object.entries(expected))assert.equal(await count(who[name],"SELECT id FROM tasks WHERE business_id=$1 AND source_kind<>'campaign-legacy'"),ids.length,name);
 for(const table of ['task_roles','task_viewers','team_members','teams','meeting_participants','ai_briefs','change_events'])assert.equal(await count('guest',`SELECT 1 FROM ${table} WHERE business_id=$1`),0,'guest '+table);
 assert.equal(await count(m1,"SELECT 1 FROM weekly_plan_tasks w JOIN tasks t ON t.id=w.task_id WHERE w.business_id=$1 AND t.visibility IN('team','restricted')"),0);
 const role=(await admin.query("SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname='zuri_go_app'")).rows[0];assert.deepEqual(role,{rolsuper:false,rolbypassrls:false});
});
test('attachments and their history follow the task (FR-011-008)',async()=>{
 const tid=(await owner("SELECT id FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'id'=$2",[b,t3])).rows[0].id;
 const file=await write(m0,c=>attachmentAction(c,b,t3,null,'POST',{filename:'สลิป.txt',base64:'YQ=='}));
 await assert.rejects(as(m1,c=>attachmentAction(c,b,t3,null,'GET')),e=>e.status===404);
 await assert.rejects(as(m1,c=>attachmentAction(c,b,t3,file.id,'GET')),e=>e.status===404);
 await assert.rejects(as('guest',c=>attachmentAction(c,b,t3,file.id,'GET')),e=>e.status===404);
 assert.equal((await as(m2,c=>attachmentAction(c,b,t3,null,'GET'))).length,1);
 const seen=(who)=>as(who,async c=>(await c.query("SELECT 1 FROM change_events WHERE business_id=$1 AND entity_type IN('task_attachments','task_viewers','task_visibility') AND entity_id IN($2,$3)",[b,file.id,tid])).rowCount);
 assert.equal(await seen(m1),0);assert.ok(await seen(m2)>0);
 assert.equal(await as(m1,async c=>(await c.query('SELECT 1 FROM task_attachments WHERE business_id=$1',[b])).rowCount),0);
});
test('a viewer-scoped save never touches hidden tasks; a hidden ID answers 409 (SDD-011 Write paths)',async()=>{
 const before=(await owner("SELECT row_version,legacy_metadata FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'id'=$2",[b,t3])).rows[0];
 const roles=(await owner("SELECT count(*)::int n FROM zuri_go.task_roles r JOIN zuri_go.tasks t ON t.id=r.task_id WHERE t.business_id=$1 AND t.legacy_metadata->>'id'=$2",[b,t3])).rows[0].n;
 let mine=await as(m1,c=>readLegacy(c,b));const d=mine.meetingTaskManager,t=d.tasks.find(x=>x.id===t1);
 saveTask(d,{id:t1,version:t.version,description:'แก้โดยฝ่ายขาย'});
 mine=await write(m1,c=>saveLegacy(c,b,{version:mine.version,meetingTaskManager:d}));
 assert.equal(mine.meetingTaskManager.tasks.find(x=>x.id===t1).description,'แก้โดยฝ่ายขาย');
 const after=(await owner("SELECT row_version,legacy_metadata FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'id'=$2",[b,t3])).rows[0];
 assert.equal(after.row_version,before.row_version);assert.deepEqual(after.legacy_metadata,before.legacy_metadata);
 assert.equal((await owner("SELECT count(*)::int n FROM zuri_go.task_roles r JOIN zuri_go.tasks t ON t.id=r.task_id WHERE t.business_id=$1 AND t.legacy_metadata->>'id'=$2",[b,t3])).rows[0].n,roles);
 assert.equal((await as(m0,c=>readLegacy(c,b))).meetingTaskManager.weeks[0].entries.some(e=>e.taskId===t3),true,'hidden weekly entry kept');
 const clash=structuredClone(mine.meetingTaskManager);saveTask(clash,{id:t3,title:'ชนกับงานลับ'});
 await assert.rejects(write(m1,c=>saveLegacy(c,b,{version:mine.version,meetingTaskManager:clash})),e=>e.status===409);
});
test('only the A widens, with a reason and an audit event; anyone narrows (FR-011-011, -005)',async()=>{
 let read=await as(m2,c=>readLegacy(c,b));const d=read.meetingTaskManager;Object.assign(d.tasks.find(t=>t.id===t3),{visibility:'business',visibilityReason:'ทุกคนต้องเห็น'});
 await assert.rejects(write(m2,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d})),e=>e.status===403);
 read=await as(m0,c=>readLegacy(c,b));let own=read.meetingTaskManager;Object.assign(own.tasks.find(t=>t.id===t3),{visibility:'business'});
 await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:own})),/เหตุผล/);
 own.tasks.find(t=>t.id===t3).visibilityReason='ทุกคนต้องเห็น';
 read=await write(m0,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:own}));
 assert.ok((await as(m1,c=>readLegacy(c,b))).meetingTaskManager.tasks.some(t=>t.id===t3),'widened task now visible to sales');
 const event=(await owner("SELECT before_data,after_data,actor_member_id FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='task_visibility' ORDER BY occurred_at DESC LIMIT 1",[b])).rows[0];
 assert.equal(event.before_data.visibility,'restricted');assert.equal(event.after_data.visibility,'business');assert.equal(event.after_data.reason,'ทุกคนต้องเห็น');assert.equal(event.actor_member_id,m0.id);
 assert.ok(!('visibilityReason' in read.meetingTaskManager.tasks.find(t=>t.id===t3)),'a reason is never reused');
 // m1 narrows back to restricted: allowed without a reason, but m1 must name themselves first.
 read=await as(m1,c=>readLegacy(c,b));own=read.meetingTaskManager;Object.assign(own.tasks.find(t=>t.id===t3),{visibility:'restricted'});
 await assert.rejects(write(m1,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:own})),/เพิ่มตัวเอง/);
 Object.assign(own.tasks.find(t=>t.id===t3),{viewerIds:[m2.legacy,m1.legacy]});
 await write(m1,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:own}));
 assert.ok((await as(m1,c=>readLegacy(c,b))).meetingTaskManager.tasks.some(t=>t.id===t3));
 assert.equal((await as(m3,c=>readLegacy(c,b))).meetingTaskManager.tasks.some(t=>t.id===t3),false);
});
test('teams: only an admin manages them; archived teams cannot be chosen (FR-011-001, -002)',async()=>{
 await assert.rejects(write(m1,c=>saveTeam(c,b,{kind:'member',memberId:m1.id,admin:false},{name:'ขาย'})),e=>e.status===403);
 await assert.rejects(as('guest',c=>listTeams(c,b,{kind:'guest'})),e=>e.status===401);
 const sales=await write(m3,c=>saveTeam(c,b,c.zuriViewer,{name:'ขาย QA',memberIds:[m1.legacy,m3.legacy]}));
 assert.deepEqual([...sales.memberIds].sort(),[m1.legacy,m3.legacy].sort());
 assert.equal((await as(m3,c=>listTeams(c,b,c.zuriViewer))).length,2);
 await write(m3,c=>saveTeam(c,b,c.zuriViewer,{archived:true,row_version:sales.row_version},sales.id));
 const read=await as(m1,c=>readLegacy(c,b)),d=read.meetingTaskManager;Object.assign(d.tasks.find(t=>t.id===t4),{visibility:'team',teamId:sales.id});
 await assert.rejects(write(m1,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d})),/ฝ่ายที่ยังใช้งานอยู่/);
 await assert.rejects(write(m1,c=>c.query('UPDATE members SET is_business_admin=true WHERE business_id=$1 AND id=$2',[b,m1.id])),/operator only/);
 const audit=(await owner("SELECT count(*)::int n FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='teams'",[b])).rows[0].n;assert.ok(audit>=3);
});
test('restricted meetings: participants only, hidden references and receipts are withheld and kept (FR-011-006, SDD-011 P1)',async()=>{
 let read=await as('operator',c=>readLegacy(c,b));const d=read.meetingTaskManager;
 const src={sourceInstanceId:'qa-visibility',projectId:'p',recordingId:randomUUID(),contentHash:'h-'+randomUUID(),sourceMode:'native',segments:[{segmentId:'s1',startMs:0,endMs:500,text:'งบเงินเดือน'}]};
 const mid=addSource(d,src,{title:'ประชุมลับ HR'}),sourceId=d.meetings.find(m=>m.id===mid).sourceId,rid=saveReview(d,{sourceId,segments:src.segments,reviewHash:'rh-'+mid});
 addBatch(d,mid,{draftBatchId:'batch-'+mid,reviewRevisionId:rid,reviewHash:'rh-'+mid,sourceHash:src.contentHash,items:[{proposalId:'p1',kind:'task',title:'ปรับเงินเดือน',evidence:[{segmentId:'s1',startMs:0,endMs:500,quote:'งบเงินเดือน',reviewRevisionId:rid}]}]});
 commitBatch(d,'batch-'+mid,[{proposalId:'p1',mode:'create',title:'ปรับเงินเดือน',responsibleId:m2.legacy,week:seed.weekStart}]);
 Object.assign(d.meetings.find(m=>m.id===mid),{visibility:'restricted',participantIds:[m0.legacy],organizerId:m0.legacy});
 const task=d.tasks.find(t=>t.title==='ปรับเงินเดือน');Object.assign(task,{visibility:'restricted',viewerIds:[m2.legacy]});
 read=await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 // FR-011-009 (P3): the task the commit created is restricted with the meeting's participant m0 as a viewer. Removing m0 from an
 // existing task is an ordinary edit, which restores the P1 scenario below (a receipt that names a task m0 cannot read).
 const created=await as('operator',c=>readLegacy(c,b)),made=created.meetingTaskManager.tasks.find(t=>t.title==='ปรับเงินเดือน');
 assert.deepEqual([...made.viewerIds].sort(),[m0.legacy,m2.legacy].sort());
 made.viewerIds=[m2.legacy];read=await write('operator',c=>saveLegacy(c,b,{version:created.version,meetingTaskManager:created.meetingTaskManager}));
 const m0view=await as(m0,c=>readLegacy(c,b)),m1view=await as(m1,c=>readLegacy(c,b)),m2view=await as(m2,c=>readLegacy(c,b));
 assert.ok(m0view.meetingTaskManager.meetings.some(m=>m.id===mid));assert.equal(m1view.meetingTaskManager.meetings.some(m=>m.id===mid),false);
 assert.equal(m1view.meetingTaskManager.sources.some(s=>s.meetingId===mid),false,'no transcript for a non-participant');
 assert.equal(m0view.meetingTaskManager.receipts.some(r=>r.batchId==='batch-'+mid),false,'receipt naming a hidden task is withheld');
 const withheld=m2view.meetingTaskManager.tasks.find(t=>t.title==='ปรับเงินเดือน');assert.equal(withheld.sourceRefsWithheld,true);assert.equal(withheld.sourceRefs.length,0);
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
const revisionRows=mid=>meetingRow(mid).then(m=>owner('SELECT kind,content_hash,segments,legacy_metadata FROM zuri_go.meeting_revisions WHERE business_id=$1 AND meeting_id=$2 ORDER BY kind',[b,m.id])).then(r=>r.rows);
const batchRows=mid=>meetingRow(mid).then(m=>owner('SELECT items,legacy_metadata FROM zuri_go.meeting_draft_batches WHERE business_id=$1 AND meeting_id=$2',[b,m.id])).then(r=>r.rows);
const taskOf=title=>owner("SELECT id,visibility FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'title'=$2",[b,title]).then(r=>r.rows[0]);
// What the recording machine keeps after a Member saves the meeting to the hosted API: a participant saves a new restricted meeting.
async function savedByMember(label,people=[m0,m1],{commit=false}={}){
 let read=await as(people[0],c=>readLegacy(c,b));const d=read.meetingTaskManager,made=await addMeeting(d,label,restricted(...people));
 const full=made.pick();if(commit)commitBatch(d,'batch-'+made.mid,[{proposalId:'p1',mode:'create',title:'งานจากประชุม '+label,responsibleId:people[0].legacy,accountableId:people[0].legacy,week:seed.weekStart}]);
 read=await write(people[0],c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 return {...made,full,read};
}
const everywhere=(value,text)=>JSON.stringify(value).includes(text);

test('a task created from a restricted meeting is restricted with its participants as viewers, whatever the client sent (FR-011-009)',async()=>{
 let read=await as('operator',c=>readLegacy(c,b));const d=read.meetingTaskManager;
 const made=await addMeeting(d,'FR009',restricted(m0,m1,m2));
 commitBatch(d,'batch-'+made.mid,[{proposalId:'p1',mode:'create',title:'งานจากประชุมลับ FR009',responsibleId:m3.legacy,accountableId:m0.legacy,week:seed.weekStart}]);
 Object.assign(d.tasks.find(t=>t.title==='งานจากประชุมลับ FR009'),{visibility:'business',viewerIds:[]});// the client asks for a wider audience
 read=await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 const row=await taskOf('งานจากประชุมลับ FR009'),id=read.meetingTaskManager.tasks.find(t=>t.title==='งานจากประชุมลับ FR009').id;
 assert.equal(row.visibility,'restricted');
 const viewers=(await owner('SELECT member_id FROM zuri_go.task_viewers WHERE business_id=$1 AND task_id=$2',[b,row.id])).rows.map(r=>r.member_id).sort();
 assert.deepEqual(viewers,[m0.id,m1.id,m2.id].sort(),'AC-011-009-01: the three participants are its viewers');
 const asTask=v=>v.meetingTaskManager.tasks.find(t=>t.id===id);
 // AC-011-009-02: R (m3) is not a participant; the task shows, the quotes and the meeting do not.
 const r=await as(m3,c=>readLegacy(c,b));assert.ok(asTask(r));assert.equal(asTask(r).sourceRefsWithheld,true);assert.equal(asTask(r).sourceRefs.length,0);
 assert.equal(everywhere(r,made.quote),false);assert.equal(r.meetingTaskManager.meetings.some(m=>m.id===made.mid),false);assert.equal(r.meetingTaskManager.batches.some(x=>x.meetingId===made.mid),false);
 assert.equal(everywhere(await as(m0,c=>readLegacy(c,b)),made.quote),true,'a participant reads the quote');
 assert.equal(await as('guest',c=>readLegacy(c,b)).then(v=>!!asTask(v)),false);
 // AC-011-009-03: widening the task (by its A, with a reason) never moves the quotes.
 let own=await as(m0,c=>readLegacy(c,b));Object.assign(asTask(own),{visibility:'public',visibilityReason:'เผยแพร่ผลงาน'});
 await write(m0,c=>saveLegacy(c,b,{version:own.version,meetingTaskManager:own.meetingTaskManager}));
 const guest=await as('guest',c=>readLegacy(c,b));assert.ok(asTask(guest),'the widened task is public');assert.equal(asTask(guest).sourceRefsWithheld,true);
 for(const who of [guest,await as(m3,c=>readLegacy(c,b))]){assert.equal(everywhere(who,made.quote),false);assert.equal(who.meetingTaskManager.meetings.some(m=>m.id===made.mid),false);}
 assert.equal(everywhere(await as(m1,c=>readLegacy(c,b)),made.quote),true,'the meeting audience still reads the quote');
 // /state returns task rows with their metadata: the quotes copied there follow the meeting too (RCA zuri-go-meeting-quotes-outside-meeting-audience).
 for(const who of ['guest',m3])assert.equal(everywhere(await as(who,c=>snapshot(c,b)),made.quote),false);
 assert.equal(everywhere(await as(m1,c=>snapshot(c,b)),made.quote),true);
});
test('a task from a business meeting keeps the level the client chose (FR-011-009, holdout)',async()=>{
 let read=await as('operator',c=>readLegacy(c,b));const d=read.meetingTaskManager;
 const made=await addMeeting(d,'FR009-open',{visibility:'business'});
 commitBatch(d,'batch-'+made.mid,[{proposalId:'p1',mode:'create',title:'งานจากประชุมทั่วไป',responsibleId:m3.legacy,week:seed.weekStart}]);
 await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
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
 assert.equal((await as(m2,c=>readLegacy(c,b))).meetingTaskManager.meetings.some(m=>m.id===made.mid),false,'a non-participant still sees nothing');
 // The local operator keeps full content and is not bound by custody.
 let read=await as('operator',c=>readLegacy(c,b));const d=read.meetingTaskManager,local=await addMeeting(d,'FR010-operator',restricted(m0));
 await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 const kept=await revisionRows(local.mid);assert.equal(kept.length,2);for(const r of kept){assert.equal(r.segments.length,1);assert.equal(r.legacy_metadata.withheld,undefined);}
 assert.equal((await batchRows(local.mid))[0].items[0].evidence[0].quote,local.quote);assert.equal((await meetingRow(local.mid)).transcript_custody,'local_only');
});
test('a stub cannot be overwritten, and only custody can mark a revision withheld (FR-011-010)',async()=>{
 const made=await savedByMember('FR010-b');
 const view=await as(m0,c=>readLegacy(c,b)),d=view.meetingTaskManager;d.sources.find(s=>s.meetingId===made.mid).segments=made.full.sources[0].segments;
 await write(m0,c=>saveLegacy(c,b,{version:view.version,meetingTaskManager:d}));// accepted, but only the upload can store full content
 for(const r of await revisionRows(made.mid)){assert.deepEqual(r.segments,[],'full content sent in a save is not stored');assert.equal(r.legacy_metadata.withheld,true);}
 const changed=await as(m0,c=>readLegacy(c,b)),c2=changed.meetingTaskManager;c2.sources.find(s=>s.meetingId===made.mid).coverage={status:'complete'};
 await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:changed.version,meetingTaskManager:c2})),/ห้ามเขียนทับ/,'a stub cannot be rewritten with other metadata');
 const open=await as(m0,c=>readLegacy(c,b)),o=open.meetingTaskManager,plain=await addMeeting(o,'FR010-forged',{visibility:'business'});
 o.sources.find(s=>s.meetingId===plain.mid).withheld=true;o.sources.find(s=>s.meetingId===plain.mid).segments=[];
 await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:open.version,meetingTaskManager:o})),e=>e.status===422,'a revision of a meeting that is not local_only cannot claim to be withheld');
});
test('a participant uploads the transcript with a reason; it is audited and follows the meeting audience (AC-011-010-02)',async()=>{
 const made=await savedByMember('FR010-c',[m0,m1],{commit:true}),full=made.full,body=(patch={})=>({reason:'ต้องใช้ตรวจหลักฐานร่วมกัน',...full,...patch});
 await assert.rejects(write(m2,c=>uploadTranscript(c,b,made.mid,body())),e=>e.status===404,'a non-participant cannot even see the meeting');
 await assert.rejects(write('guest',c=>uploadTranscript(c,b,made.mid,body())),e=>e.status===401);
 await assert.rejects(write('operator',c=>uploadTranscript(c,b,made.mid,body())),e=>e.status===403,'only a participant uploads');
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
 assert.equal(await seen(m2),0,'the audit event follows the meeting audience');assert.ok(await seen(m1)>0);
 const audience=await as(m1,c=>readLegacy(c,b));assert.equal(audience.meetingTaskManager.sources.find(s=>s.meetingId===made.mid).segments[0].text,made.quote,'the audience reads the uploaded transcript');
 const outside=await as(m2,c=>readLegacy(c,b));assert.equal(everywhere(outside,made.quote),false);assert.equal(outside.meetingTaskManager.sources.some(s=>s.meetingId===made.mid),false);
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
