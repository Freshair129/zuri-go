// FEAT-010 against real PostgreSQL: the task contract, projects, boards, completion, campaign details, the Workboard as a view,
// PUT /workspace compatibility and row-level security on the new tables.
// @trace verifies FR-010-001, FR-010-002, FR-010-003, FR-010-004, FR-010-005, FR-010-006, FR-010-007, FR-010-008, FR-010-009, FR-010-010, FR-010-011, FR-010-012, FR-010-013, FR-010-014, FR-010-015, NFR-010-001
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
import {snapshot,save} from '../service.mjs';
import {readLegacy,saveLegacy,importPreview,importCommit} from '../workspace.mjs';
import {listTasks,readTask,createTask,updateTask} from '../tasks.mjs';
import {listProjects,readProject,createProject,updateProject} from '../projects.mjs';
import {saveCampaignTask} from '../campaign-tasks.mjs';
import {saveTeam} from '../teams.mjs';
import {empty,seedWorkspace,saveTask} from '../../web/src/content/meeting/model.mjs';
import {createWorkspace} from '../../web/src/content/shared/model.mjs';
const seed=JSON.parse(await readFile(new URL('../../web/src/content/meeting/seed.json',import.meta.url),'utf8'));
const admin=new pg.Client({connectionString:config().adminUrl});await admin.connect();
after(async()=>{await admin.end();await pool.end();});
const newBusiness=async name=>{const id=randomUUID();await transaction(id,OPERATOR,c=>c.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[id,'QA ONLY · '+name,id]));return id;};
const b=await newBusiness('task manager verification'),other=await newBusiness('task manager other business');
async function owner(sql,params,business=b){await admin.query('BEGIN');try{await admin.query("SELECT set_config('zuri_go.business_id',$1,true)",[business]);const r=await admin.query(sql,params);await admin.query('COMMIT');return r;}catch(e){await admin.query('ROLLBACK');throw e;}}
const principal=who=>who==='guest'?null:who==='operator'?OPERATOR:session({m:who.id,cv:1});
const as=(who,fn,business=b)=>transaction(business,principal(who),fn);
const write=(who,fn,business=b)=>transaction(business,principal(who),async c=>{if(who!=='operator'&&who!=='guest')await authorizeWrite(c,business);return fn(c,c.zuriViewer);});
const key=()=>randomUUID();

// Members m0..m3 from the seed, a Workboard campaign with two tasks (one Done before the change), and a team.
const ws0=await as('operator',c=>readLegacy(c,b));const domain=empty();seedWorkspace(domain,seed);
const campaignWs=createWorkspace();const cw=campaignWs.campaigns[0];
cw.tasks.push({id:'wb-ready',title:'ตั้งค่า pixel',status:'Ready',owner:'Chef',due:'2026-10-09',priority:'High',offer:'normal',gate:'cvr',hypothesis:'CVR ต่ำ',action:'แก้หน้า',dependencies:'',estimate:1200,acceptance:'',evidence:'',recheck:'',outcome:''});
cw.tasks.push({id:'wb-done',title:'ยิงโฆษณารอบแรก',status:'Review',owner:'Boss',due:'2026-09-20',priority:'Medium',offer:'normal',gate:'',hypothesis:'',action:'',dependencies:'',estimate:null,acceptance:'ยอดคลิก',evidence:'https://ads',recheck:'2026-10-01',outcome:'ok'});
let ws=await transaction(b,OPERATOR,c=>saveLegacy(c,b,{version:ws0.version,campaignWorkspace:campaignWs,meetingTaskManager:domain}));
const rows=(await owner('SELECT id,display_name,legacy_metadata FROM zuri_go.members WHERE business_id=$1',[b])).rows;
const people=ws.meetingTaskManager.members.map(m=>({legacy:m.id,name:m.displayName,id:rows.find(r=>(r.legacy_metadata?.id||r.id)===m.id).id}));
const [m0,m1,m2,m3]=people;
for(const p of people)await owner('INSERT INTO zuri_go.member_credentials(business_id,member_id,password_hash) VALUES($1,$2,$3)',[b,p.id,await passwordHash('qa-'+randomUUID())]);
const campaignId=ws.campaignWorkspace.campaigns[0].id;
const team=await transaction(b,OPERATOR,c=>saveTeam(c,b,{kind:'operator'},{name:'ขาย QA',memberIds:[m1.legacy]}));
const workboardRow=async id=>(await owner("SELECT * FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'id'=$2",[b,id])).rows[0];
// wb-done stands for a Workboard task completed before the change: Done, no details row, the default marker.
{const done=await workboardRow('wb-done');await owner("UPDATE zuri_go.tasks SET status='done',legacy_metadata=jsonb_set(legacy_metadata,'{status}','\"Done\"') WHERE id=$1",[done.id]);await owner('DELETE FROM zuri_go.campaign_task_details WHERE task_id=$1',[done.id]);}

test('create from a title, fill in later, Guest refused (FR-010-001, -009, -010)',async()=>{
 const k=key(),t=await write(m0,(c,v)=>createTask(c,b,{idempotency_key:k,title:'  ตรวจสต็อกเดือนนี้ '},v));
 assert.equal(t.status,'planned');assert.match(t.code,/^TSK-\d{4}$/);assert.equal(t.visibility,'business');assert.equal(t.title,'ตรวจสต็อกเดือนนี้');
 assert.equal([t.campaign_id,t.project_id,t.team_id,t.content_item_id,t.goal_id].filter(Boolean).length,0);
 const replay=await write(m0,(c,v)=>createTask(c,b,{idempotency_key:k,title:'  ตรวจสต็อกเดือนนี้ '},v));assert.equal(replay.id,t.id);
 await assert.rejects(write(m0,(c,v)=>createTask(c,b,{idempotency_key:k,title:'อย่างอื่น'},v)),e=>e.status===409&&e.code==='IDEMPOTENCY_CONFLICT');
 assert.equal((await owner('SELECT count(*)::int n FROM zuri_go.tasks WHERE business_id=$1 AND idempotency_key=$2',[b,k])).rows[0].n,1);
 const filled=await write(m1,(c,v)=>updateTask(c,b,t.id,{row_version:t.row_version,description:'นับจริงทุกคลัง',roles:{R:m1.id}},v));
 assert.equal(filled.id,t.id);assert.equal(filled.code,t.code);assert.equal(filled.row_version,t.row_version+1);assert.equal(filled.roles.R,m1.id);assert.equal(filled.deliverable,null);
 await assert.rejects(write(m1,(c,v)=>updateTask(c,b,t.id,{row_version:t.row_version,title:'เก่า'},v)),e=>e.status===409);
 await assert.rejects(write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'   '},v)),e=>e.code==='TITLE_REQUIRED');
 await assert.rejects(as('guest',(c)=>createTask(c,b,{idempotency_key:key(),title:'x'},c.zuriViewer)),e=>e.status===401);
 await assert.rejects(write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'x',colour:'red'},v)),e=>e.code==='FIELD_UNKNOWN');
 await assert.rejects(write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'x',gate:'cvr'},v)),e=>e.code==='CAMPAIGN_FIELD');
 // Identity fields are ignored; the audit names the session Member (FR-010-010 AC-02, AC-05).
 const spoof=await write(m2,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'spoof',actor:'someone',memberId:m3.id,pid:'ZGO-P9999'},v));
 const audit=(await owner("SELECT actor_member_id FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='tasks' AND entity_id=$2",[b,spoof.id])).rows;
 assert.equal(audit.length,1);assert.equal(audit[0].actor_member_id,m2.id);
});
test('a failed create leaves no part of the task (FR-010-009 AC-07)',async()=>{
 const before=(await owner('SELECT count(*)::int n FROM zuri_go.tasks WHERE business_id=$1',[b])).rows[0].n;
 await assert.rejects(write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'x',roles:{R:randomUUID()}},v)),e=>e.code==='MEMBER_NOT_FOUND');
 assert.equal((await owner('SELECT count(*)::int n FROM zuri_go.tasks WHERE business_id=$1',[b])).rows[0].n,before);
});
test('projects: codes, statuses, dates, owner, archive, page counts, Guest refused (FR-010-003, -004)',async()=>{
 const p=await write(m0,(c,v)=>createProject(c,b,{name:'ย้ายคลังสินค้า'},v));
 assert.match(p.code,/^PRJ-\d{4}$/);assert.equal(p.status,'active');assert.equal(p.visibility,'business');assert.equal(p.owner_member_id,m0.id);
 await assert.rejects(write(m0,(c,v)=>createProject(c,b,{name:'x',status:'paused'},v)),e=>e.code==='STATUS_INVALID');
 await assert.rejects(write(m0,(c,v)=>createProject(c,b,{name:'x',planned_start:'2026-10-10',planned_end:'2026-10-01'},v)),e=>e.code==='DATES_INVALID');
 await assert.rejects(transaction(b,OPERATOR,c=>createProject(c,b,{name:'ไม่มีเจ้าของ'},c.zuriViewer)),e=>e.code==='OWNER_REQUIRED');
 await assert.rejects(as('guest',c=>createProject(c,b,{name:'x'},c.zuriViewer)),e=>e.status===401);
 // A label is never turned into a link (AC-010-004-03), and linking keeps the label (AC-010-004-02).
 const labelled=await write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'เช็คชั้นวาง'},v));
 await owner("UPDATE zuri_go.tasks SET project_label='ย้ายคลังสินค้า' WHERE id=$1",[labelled.id]);
 assert.equal((await as(m0,c=>readTask(c,b,labelled.id,c.zuriViewer))).project_id,null);
 const cur=await as(m0,c=>readTask(c,b,labelled.id,c.zuriViewer));
 const linked=await write(m0,(c,v)=>updateTask(c,b,labelled.id,{row_version:cur.row_version,project_id:p.id,status:'doing'},v));
 assert.equal(linked.project.code,p.code);assert.equal(linked.project_label,'ย้ายคลังสินค้า');
 const page=await as(m1,c=>readProject(c,b,p.id,c.zuriViewer));assert.equal(page.tasks.length,1);assert.equal(page.counts.doing,1);assert.equal(page.counts.planned,0);
 const archived=await write(m0,(c,v)=>updateProject(c,b,p.id,{row_version:p.row_version,status:'archived'},v));assert.equal(archived.status,'archived');
 assert.equal((await as(m0,c=>readTask(c,b,labelled.id,c.zuriViewer))).project_id,p.id,'tasks keep their link');
 const again=await write(m0,(c,v)=>createProject(c,b,{name:'อีกโปรเจกต์'},v));assert.notEqual(again.code,p.code);
});
test('contexts: campaign and project together; conflicts and other Businesses refused; former audience metadata does not hide projects (FR-010-002, ADR-008)',async()=>{
 const p=await write(m0,(c,v)=>createProject(c,b,{name:'เปิดตัวสินค้า'},v));
 const t=await write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'ถ่ายรูปสินค้า',campaign_id:campaignId,project_id:p.id},v));
 const onCampaign=(await as(m1,c=>listTasks(c,b,{board:'campaign',campaign_id:campaignId},c.zuriViewer))).tasks,onProject=(await as(m1,c=>listTasks(c,b,{board:'project',project_id:p.id},c.zuriViewer))).tasks;
 assert.ok(onCampaign.some(x=>x.id===t.id));assert.ok(onProject.some(x=>x.id===t.id));
 const unlinked=(await as(m1,c=>listTasks(c,b,{board:'unlinked'},c.zuriViewer))).tasks;assert.ok(unlinked.every(x=>!x.campaign_id&&!x.project_id&&!x.team_id));
 const otherCampaign=await transaction(b,OPERATOR,c=>save(c,b,'campaigns',{name:'แคมเปญ B'}));
 const item=await transaction(b,OPERATOR,c=>save(c,b,'content',{title:'โพสต์ของ A',format:'image',planning_month:'2026-10-01',campaign_id:campaignId}));
 await assert.rejects(write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'x',campaign_id:otherCampaign.id,content_item_id:item.id},v)),e=>e.code==='CONTEXT_CONFLICT');
 const foreign=await transaction(other,OPERATOR,async c=>(await c.query("INSERT INTO campaigns(business_id,code,name,objective,lifecycle) VALUES($1,'CAM-9001','ต่างธุรกิจ','awareness','draft') RETURNING id",[other])).rows[0].id);
 await assert.rejects(write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'x',campaign_id:foreign},v)),e=>e.code==='CONTEXT_NOT_FOUND');
 // Former project audience metadata does not hide a same-Business project from another Member.
 const cur=await as(m0,c=>readProject(c,b,p.id,c.zuriViewer));
 await write(m0,(c,v)=>updateProject(c,b,p.id,{row_version:cur.project.row_version,visibility:'restricted'},v));
 const seen=await as(m1,c=>readTask(c,b,t.id,c.zuriViewer));assert.deepEqual(seen.project,{id:p.id,code:p.code,name:p.name});
 assert.equal((await as(m1,c=>listProjects(c,b,c.zuriViewer))).projects.some(x=>x.id===p.id),true);
 // Any active Member may change Team metadata regardless of RACI assignment.
 const tt=await write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'งานฝ่าย',visibility:'team',team_id:team.id,roles:{R:m0.id,A:m1.id}},v));
 const team2=await transaction(b,OPERATOR,c=>saveTeam(c,b,{kind:'operator'},{name:'ผลิต QA',memberIds:[m0.legacy,m1.legacy]}));
 const moved=await write(m2,(c,v)=>updateTask(c,b,tt.id,{row_version:tt.row_version,team_id:team2.id,visibility_reason:'ย้ายฝ่าย'},v));assert.equal(moved.team_id,team2.id);
 const movedBack=await write(m0,(c,v)=>updateTask(c,b,tt.id,{row_version:moved.row_version,team_id:team.id,visibility_reason:'ย้ายกลับ'},v));assert.equal(movedBack.team_id,team.id);
});
test('boards: mine stays a personalized R or A view; Guest all-board matches every active Member (ADR-008)',async()=>{
 const x=await write(m2,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'ของ m2',roles:{R:m2.id}},v));
 const y=await write(m2,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'m2 เป็น A',roles:{R:m3.id,A:m2.id}},v));
 const z=await write(m2,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'m2 แค่รับทราบ',roles:{R:m3.id,I:[m2.id]}},v));
 const mine=(await as(m2,c=>listTasks(c,b,{board:'mine'},c.zuriViewer))).tasks.map(t=>t.id);
 assert.ok(mine.includes(x.id));assert.ok(mine.includes(y.id));assert.ok(!mine.includes(z.id));
 await assert.rejects(as('guest',c=>listTasks(c,b,{board:'mine'},c.zuriViewer)),e=>e.status===401);
 const pub=await write(m2,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'ประกาศสาธารณะ',visibility:'public'},v));
 const restricted=await write(m2,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'รายการที่เคยจำกัด',visibility:'restricted',viewer_ids:[m2.id],roles:{R:m2.id}},v));
 const guestAll=(await as('guest',c=>listTasks(c,b,{board:'all'},c.zuriViewer))).tasks;
 const memberAll=(await as(m1,c=>listTasks(c,b,{board:'all'},c.zuriViewer))).tasks;const state=await as(m1,c=>snapshot(c,b));
 assert.deepEqual(guestAll.map(t=>t.id).sort(),memberAll.map(t=>t.id).sort(),'Guest and Member share the Business read set');
 assert.ok(guestAll.some(t=>t.id===restricted.id&&t.visibility==='restricted'),'Guest reads a formerly restricted task');assert.ok(guestAll.some(t=>t.id===pub.id));
 assert.deepEqual(memberAll.map(t=>t.id).sort(),state.tasks.filter(t=>!t.archived_at).map(t=>t.id).sort(),'boards and the snapshot come from the same readable set');
});
test('moves and completion are checked on the server (FR-010-006, -007)',async()=>{
 const t=await write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'ส่งรายงาน',roles:{R:m0.id,A:m1.id}},v));
 await assert.rejects(write(m0,(c,v)=>updateTask(c,b,t.id,{row_version:t.row_version,status:'blocked'},v)),e=>e.code==='BLOCKER_REQUIRED');
 await assert.rejects(write(m0,(c,v)=>updateTask(c,b,t.id,{row_version:t.row_version,status:'done'},v)),e=>e.code==='A_UNCONFIRMED');
 const ready=await write(m0,(c,v)=>updateTask(c,b,t.id,{row_version:t.row_version,roles:{R:m0.id,A:m1.id,A_confirmed:true},acceptance:'ครบทุกสาขา',evidence:'https://report',kpi_note:'ยอดขาย'},v));
 await assert.rejects(write(m0,(c,v)=>updateTask(c,b,t.id,{row_version:ready.row_version,status:'done'},v)),e=>e.code==='RECHECK_REQUIRED');
 const closed=await write(m0,(c,v)=>updateTask(c,b,t.id,{row_version:ready.row_version,status:'done',recheck_date:'2026-11-01'},v));assert.equal(closed.completion_rule,'standard');
 // A Workboard task Done before the change stays Done under the Workboard marker and is not re-checked (AC-010-007-03).
 const wb=await workboardRow('wb-done'),legacy=await as(m0,c=>readTask(c,b,wb.id,c.zuriViewer));
 assert.equal(legacy.status,'done');assert.equal(legacy.completion_rule,'workboard');
 const edited=await write(m0,(c,v)=>updateTask(c,b,wb.id,{row_version:legacy.row_version,description:'บันทึกเพิ่ม'},v));assert.equal(edited.status,'done');
 // Leaving Done and coming back needs the standard rule; the marker becomes standard (AC-010-007-04).
 const reopened=await write(m0,(c,v)=>updateTask(c,b,wb.id,{row_version:edited.row_version,status:'review'},v));
 await assert.rejects(write(m0,(c,v)=>updateTask(c,b,wb.id,{row_version:reopened.row_version,status:'done'},v)),e=>e.code==='R_REQUIRED');
 // A campaign task needs a due date before Done (AC-010-007-05).
 const ct=await write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'งานแคมเปญ',campaign_id:campaignId,roles:{R:m0.id,A:m0.id,A_confirmed:true},acceptance:'ผ่าน',evidence:'e'},v));
 await assert.rejects(write(m0,(c,v)=>updateTask(c,b,ct.id,{row_version:ct.row_version,status:'done'},v)),e=>e.code==='DUE_REQUIRED');
});
test('campaign details: one transaction, never MoSCoW, follow the task, task from a finding (FR-010-012, -014)',async()=>{
 const k=key(),finding={idempotency_key:k,title:'ทดสอบหน้าใหม่ลด CVR drop',details:{gate:'cvr',offer:'normal',hypothesis:'หน้ารายละเอียดยาวเกิน'}};
 const t=await write(m0,(c,v)=>saveCampaignTask(c,b,campaignId,finding,v));
 assert.equal(t.campaign_id,campaignId);assert.equal(t.details.gate,'cvr');assert.equal(t.details.hypothesis,'หน้ารายละเอียดยาวเกิน');
 const again=await write(m0,(c,v)=>saveCampaignTask(c,b,campaignId,finding,v));assert.equal(again.id,t.id);
 assert.equal((await owner('SELECT count(*)::int n FROM zuri_go.tasks WHERE business_id=$1 AND idempotency_key=$2',[b,k])).rows[0].n,1);
 const before=(await owner('SELECT count(*)::int n FROM zuri_go.tasks WHERE business_id=$1',[b])).rows[0].n;
 await assert.rejects(write(m0,(c,v)=>saveCampaignTask(c,b,campaignId,{idempotency_key:key(),title:'x',details:{priority:'Urgent'}},v)),e=>e.status===422);
 assert.equal((await owner('SELECT count(*)::int n FROM zuri_go.tasks WHERE business_id=$1',[b])).rows[0].n,before,'no task without its details');
 const high=await write(m0,(c,v)=>saveCampaignTask(c,b,campaignId,{idempotency_key:key(),title:'งานด่วน',details:{priority:'High'}},v));
 assert.equal(high.details.priority,'High');assert.equal((await owner('SELECT count(*)::int n FROM zuri_go.weekly_plan_tasks WHERE task_id=$1',[high.id])).rows[0].n,0);
 const plain=await write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'ไม่มีแคมเปญ'},v));assert.equal(plain.details,null);
 // Campaign task details follow Business scope, not the task's former audience metadata (ADR-008).
 const hidden=await write(m0,(c,v)=>saveCampaignTask(c,b,campaignId,{idempotency_key:key(),title:'ลับของแคมเปญ',visibility:'restricted',roles:{R:m0.id},details:{gate:'aov'}},v));
 const direct=(who)=>as(who,async c=>(await c.query('SELECT task_id FROM campaign_task_details WHERE business_id=$1',[b])).rows.map(r=>r.task_id));
 for(const viewer of [m0,m1,m2,m3,'guest'])assert.ok((await direct(viewer)).includes(hidden.id),String(viewer)+' reads the same-Business detail');
 assert.ok((await as('guest',c=>snapshot(c,b))).campaign_task_details.some(d=>d.task_id===hidden.id));
});
test('the Workboard is a view of the task records; PUT /workspace keeps the new fields (FR-010-011, -013, -015)',async()=>{
 let read=await as(m1,c=>readLegacy(c,b));const board=read.campaignWorkspace.campaigns.find(x=>x.id===campaignId).tasks;
 const ready=board.find(t=>t.id==='wb-ready');assert.equal(ready.status,'Ready');assert.equal(ready.owner,'Chef');assert.equal(ready.priority,'High');
 const fromApi=(await as(m1,c=>listTasks(c,b,{board:'campaign',campaign_id:campaignId},c.zuriViewer))).tasks;
 assert.equal(board.length,fromApi.length,'one entry per readable task linked to the campaign');
 assert.ok(board.some(t=>t.title==='ลับของแคมเปญ'),'a formerly restricted task remains in the Business Workboard');
 // No R is bound from the owner text, even when a Member has that name (FR-010-008).
 const wb=await workboardRow('wb-ready');assert.equal(wb.owner_label,'Chef');assert.equal((await owner("SELECT count(*)::int n FROM zuri_go.task_roles WHERE task_id=$1 AND role='R'",[wb.id])).rows[0].n,0);
 // An old client saves the campaign: the move lands on the same record, the details and marker stay (AC-010-011-01, -02, AC-010-013-03).
 const p=await write(m0,(c,v)=>createProject(c,b,{name:'ผูกกับงาน Workboard'},v));const cur=await as(m0,c=>readTask(c,b,wb.id,c.zuriViewer));
 await write(m0,(c,v)=>updateTask(c,b,wb.id,{row_version:cur.row_version,project_id:p.id},v));
 read=await as(m0,c=>readLegacy(c,b));const cws=structuredClone(read.campaignWorkspace);cws.campaigns.find(x=>x.id===campaignId).tasks.find(t=>t.id==='wb-ready').status='Doing';
 const saved=await write(m0,c=>saveLegacy(c,b,{version:read.version,campaignWorkspace:cws}));
 const after=await as(m0,c=>readTask(c,b,wb.id,c.zuriViewer));
 assert.equal(after.status,'doing');assert.equal(after.project_id,p.id);assert.equal(after.owner_label,'Chef');assert.equal(after.details.priority,'High');assert.equal(after.details.gate,'cvr');
 assert.equal(saved.campaignWorkspace.campaigns.find(x=>x.id===campaignId).tasks.find(t=>t.id==='wb-ready').status,'Doing');
 assert.equal((await owner("SELECT count(*)::int n FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'id'='wb-ready'",[b])).rows[0].n,1,'no duplicate');
 // A task created in the Task Manager for the campaign shows on the Workboard and is saved back onto itself.
 const tm=(await as(m0,c=>readLegacy(c,b))).campaignWorkspace;const own=tm.campaigns.find(x=>x.id===campaignId).tasks.find(t=>t.title==='งานด่วน');assert.equal(own.priority,'High');
 own.outcome='ปิดแล้วดี';const r2=await as(m0,c=>readLegacy(c,b));
 await write(m0,c=>saveLegacy(c,b,{version:r2.version,campaignWorkspace:tm}));
 const back=(await owner("SELECT source_kind,legacy_metadata FROM zuri_go.tasks WHERE business_id=$1 AND title='งานด่วน'",[b])).rows;
 assert.equal(back.length,1);assert.equal(back[0].source_kind,'manual');
 assert.equal((await owner("SELECT outcome FROM zuri_go.campaign_task_details d JOIN zuri_go.tasks t ON t.id=d.task_id WHERE t.business_id=$1 AND t.title='งานด่วน'",[b])).rows[0].outcome,'ปิดแล้วดี');
 // A new Workboard completion follows the standard rule (FR-010-007): no R yet, so it is refused.
 const r3=await as(m0,c=>readLegacy(c,b));const c3=structuredClone(r3.campaignWorkspace);Object.assign(c3.campaigns.find(x=>x.id===campaignId).tasks.find(t=>t.id==='wb-ready'),{status:'Done',acceptance:'ok',evidence:'e',recheck:'2026-11-01'});
 await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:r3.version,campaignWorkspace:c3})),e=>e.code==='R_REQUIRED');
});
test('a backup restored into an empty Business becomes task records with details (FR-010-015 AC-04)',async()=>{
 const fresh=await newBusiness('task manager import'),w=createWorkspace(),d=empty();seedWorkspace(d,seed);
 w.campaigns[0].tasks.push({id:'imp-1',title:'นำเข้า',status:'Done',owner:'Chef',due:'2026-09-01',priority:'Low',offer:'normal',gate:'',hypothesis:'',action:'',dependencies:'',estimate:null,acceptance:'a',evidence:'e',recheck:'2026-09-30',outcome:''});
 const backup={schemaVersion:2,appId:'dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1',campaignWorkspace:w,meetingTaskManager:d};
 const report=await transaction(fresh,OPERATOR,c=>importPreview(c,fresh,{backup,source_namespace:randomUUID()}));
 await transaction(fresh,OPERATOR,c=>importCommit(c,fresh,report.id,{backup_sha256:report.backup_sha256}));
 const r=(await owner("SELECT t.completion_rule,t.owner_label,d.priority,d.original_status FROM zuri_go.tasks t JOIN zuri_go.campaign_task_details d ON d.task_id=t.id WHERE t.business_id=$1 AND t.legacy_metadata->>'id'='imp-1'",[fresh],fresh)).rows;
 assert.equal(r.length,1);assert.deepEqual(r[0],{completion_rule:'workboard',owner_label:'Chef',priority:'Low',original_status:'Done'});
});
test('row-level security preserves tenant scope and gives Guest/Member the same Business read scope (ADR-008)',async()=>{
 const p=await write(m0,(c,v)=>createProject(c,b,{name:'ลับเฉพาะ',visibility:'restricted',viewer_ids:[m2.id]},v));
 const see=who=>as(who,async c=>(await c.query('SELECT id FROM projects WHERE business_id=$1',[b])).rows.map(r=>r.id));
 for(const viewer of [m0,m1,m2,m3,'guest','operator'])assert.ok((await see(viewer)).includes(p.id),String(viewer)+' reads the same-Business project');
 const links=async who=>as(who,async c=>(await c.query('SELECT member_id FROM project_viewers WHERE business_id=$1 AND project_id=$2',[b,p.id])).rows.map(r=>r.member_id).sort());
 assert.deepEqual(await links('guest'),await links(m1),'Guest can read preserved audience metadata');
 const role=(await admin.query("SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname='zuri_go_app'")).rows[0];assert.deepEqual(role,{rolsuper:false,rolbypassrls:false});
});
test('an Inactive Member takes no new R, A, C or I through the API or the workspace save; a role already held is kept; viewers may be Inactive (WI-12 D2)',async()=>{
 const refused=e=>e.status===422&&e.code==='MEMBER_INACTIVE'&&e.message==='สมาชิกนี้ปิดใช้งานอยู่ กรุณาเลือกคนที่ Active';
 const setStatus=(m,status)=>owner('UPDATE zuri_go.members SET status=$3 WHERE business_id=$1 AND id=$2',[b,m.id,status]);
 // Before m3 becomes Inactive: one task where m3 is R and m2 is C.
 const kept=await write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'งาน D2 ที่ m3 ถืออยู่',roles:{R:m3.id,C:[m2.id]}},v));
 await setStatus(m3,'inactive');
 try{
  for(const roles of [{R:m3.id},{R:m0.id,A:m3.id},{R:m0.id,C:[m3.id]},{R:m0.id,I:[m3.id]}])await assert.rejects(write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'งาน D2 ใหม่',roles},v)),refused,JSON.stringify(roles));
  assert.equal((await owner("SELECT count(*)::int n FROM zuri_go.tasks WHERE business_id=$1 AND title='งาน D2 ใหม่'",[b])).rows[0].n,0,'nothing is stored by a refusal');
  // A named viewer is access, not work.
  const seen=await write(m0,(c,v)=>createTask(c,b,{idempotency_key:key(),title:'งาน D2 ผู้มองเห็น',visibility:'restricted',roles:{R:m0.id},viewer_ids:[m3.id]},v));
  assert.deepEqual(seen.viewer_ids,[m3.id]);assert.equal(seen.visibility,'restricted');
  // Update: the same R (and the same C) are kept, a new one is refused, and the role is what counts (m3 was R, not C).
  const titled=await write(m0,(c,v)=>updateTask(c,b,kept.id,{row_version:kept.row_version,title:'งาน D2 แก้ชื่อ',roles:{R:m3.id,C:[m2.id,m1.id]}},v));
  assert.equal(titled.roles.R,m3.id);assert.deepEqual(titled.roles.C.sort(),[m1.id,m2.id].sort());
  await assert.rejects(write(m0,(c,v)=>updateTask(c,b,kept.id,{row_version:titled.row_version,roles:{R:m3.id,C:[m3.id]}},v)),refused,'m3 is R, not C');
  const moved=await write(m0,(c,v)=>updateTask(c,b,kept.id,{row_version:titled.row_version,roles:{R:m0.id,C:[m2.id,m1.id]}},v));
  await assert.rejects(write(m0,(c,v)=>updateTask(c,b,kept.id,{row_version:moved.row_version,roles:{R:m3.id,C:[m2.id,m1.id]}},v)),refused,'once replaced, m3 cannot be put back');
  assert.ok((await write(m0,(c,v)=>updateTask(c,b,seen.id,{row_version:seen.row_version,viewer_ids:[m3.id,m1.id]},v))).viewer_ids.includes(m3.id),'an Inactive viewer stays a viewer');
  // The workspace save applies the same rule: m3 as R of a new task is refused; saving the state that still has m3 as R of a stored task is not.
  const read=await as(m0,c=>readLegacy(c,b)),d=structuredClone(read.meetingTaskManager),id=saveTask(d,{title:'งาน D2 จาก PUT',responsibleId:m0.legacy});
  assert.equal(d.members.find(m=>m.id===m3.legacy).status,'inactive');
  d.tasks.find(t=>t.id===id).responsibleId=m3.legacy;
  await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d})),refused,'a client that skipped its own check is refused by the server');
  d.tasks.find(t=>t.id===id).responsibleId=m0.legacy;d.tasks.find(t=>t.id===id).consultedIds=[m3.legacy];
  await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d})),refused,'C too');
  d.tasks.find(t=>t.id===id).consultedIds=[];d.tasks.find(t=>t.id===id).viewerIds=[m3.legacy];
  const saved=await write(m0,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));assert.deepEqual(saved.meetingTaskManager.tasks.find(t=>t.id===id).viewerIds,[m3.legacy],'a viewer may be Inactive');
  const again=await write(m0,c=>saveLegacy(c,b,{version:saved.version,meetingTaskManager:saved.meetingTaskManager}));assert.ok(again.meetingTaskManager.tasks.length>0,'unchanged roles of an Inactive Member pass');
  assert.equal((await as(m0,c=>readTask(c,b,kept.id))).roles.R,m0.id);
  // A restore by the operator keeps the people as they were, Inactive ones included.
  const fresh=await newBusiness('task manager D2 restore'),backupState=empty();seedWorkspace(backupState,seed);backupState.members[0].status='inactive';
  const backup={schemaVersion:2,appId:'dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1',campaignWorkspace:createWorkspace(),meetingTaskManager:backupState};
  const report=await transaction(fresh,OPERATOR,c=>importPreview(c,fresh,{backup,source_namespace:randomUUID()}));
  await transaction(fresh,OPERATOR,c=>importCommit(c,fresh,report.id,{backup_sha256:report.backup_sha256}));
  assert.ok((await owner("SELECT count(*)::int n FROM zuri_go.task_roles r JOIN zuri_go.members m ON (m.business_id,m.id)=(r.business_id,r.member_id) WHERE r.business_id=$1 AND m.status='inactive'",[fresh],fresh)).rows[0].n>0,'the restored tasks keep an Inactive R');
 }finally{await setStatus(m3,'active');}
});
