// FEAT-011 against real PostgreSQL: every viewer kind on every read path, row-level security with the
// application filter bypassed, the viewer-scoped save, widening, teams, the admin guard and restricted meetings.
// @trace verifies FR-011-001, FR-011-002, FR-011-003, FR-011-004, FR-011-005, FR-011-006, FR-011-007, FR-011-008, FR-011-011, FR-011-012, NFR-011-001
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
import {readLegacy,saveLegacy} from '../workspace.mjs';
import {attachmentAction} from '../attachments.mjs';
import {listTeams,saveTeam} from '../teams.mjs';
import {empty,seedWorkspace,saveTask,addSource,saveReview,addBatch,commitBatch} from '../../web/src/content/meeting/model.mjs';
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
 // A Member cannot store transcript content of a restricted meeting before FR-011-010.
 const memberView=structuredClone(d);memberView.tasks.find(t=>t.title==='ปรับเงินเดือน').viewerIds=[m2.legacy,m0.legacy];
 await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:memberView})),/ประชุมลับ/);
 read=await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
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
