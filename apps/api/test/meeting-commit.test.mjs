// PLAN-002 WI-09 against real PostgreSQL: the server-side meeting commit (SDD-004 amendment "Server-side meeting commit").
// @trace verifies FR-011-009, FR-011-010, NFR-011-001
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
import {hash} from '../service.mjs';
import {readLegacy,saveLegacy,importPreview,importCommit} from '../workspace.mjs';
import {commitMeeting} from '../meeting-commit.mjs';
import {handleApi,sendError} from '../api.mjs';
import {saveTeam} from '../teams.mjs';
import {empty,seedWorkspace,saveTask,addSource,saveReview,addBatch,commitBatch,canonicalChoices,reviewHash} from '../../web/src/content/meeting/model.mjs';
import {createWorkspace} from '../../web/src/content/shared/model.mjs';
const seed=JSON.parse(await readFile(new URL('../../web/src/content/meeting/seed.json',import.meta.url),'utf8'));
const admin=new pg.Client({connectionString:config().adminUrl});await admin.connect();
after(async()=>{await admin.end();await pool.end();});
const newBusiness=async()=>{const id=randomUUID();await transaction(id,OPERATOR,c=>c.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[id,'QA ONLY · meeting commit verification',id]));return id;};
const b=await newBusiness();
async function owner(sql,params=[b],business=b){await admin.query('BEGIN');try{await admin.query("SELECT set_config('zuri_go.business_id',$1,true)",[business]);const r=await admin.query(sql,params);await admin.query('COMMIT');return r;}catch(e){await admin.query('ROLLBACK');throw e;}}
const principal=who=>who==='guest'?null:who==='operator'?OPERATOR:session({m:who.id,cv:1});
const as=(who,fn,business=b)=>transaction(business,principal(who),fn);
const write=(who,fn,business=b)=>transaction(business,principal(who),async c=>{if(who!=='operator')await authorizeWrite(c,business);return fn(c);});
const everywhere=(value,text)=>JSON.stringify(value).includes(text);

// Four seeded Members with credentials: m0 (A), m1 and m2 (participants), m3 (named R, not a participant).
let domain=empty();seedWorkspace(domain,seed);
let ws=await as('operator',c=>readLegacy(c,b));
ws=await write('operator',c=>saveLegacy(c,b,{version:ws.version,meetingTaskManager:domain}));
const rows=(await owner('SELECT id,legacy_metadata FROM zuri_go.members WHERE business_id=$1')).rows;
const people=ws.meetingTaskManager.members.map(m=>({legacy:m.id,id:rows.find(r=>(r.legacy_metadata?.id||r.id)===m.id).id}));
const [m0,m1,m2,m3]=people;
for(const p of people)await owner('INSERT INTO zuri_go.member_credentials(business_id,member_id,password_hash) VALUES($1,$2,$3)',[b,p.id,await passwordHash('qa-'+randomUUID())]);

// A meeting with one source, one review and a draft batch of two proposals; saved by the operator, who keeps full content.
async function addMeeting(d,label,access){
 const quote='ข้อความลับ '+label,src={sourceInstanceId:'qa-wi09',projectId:'p',recordingId:randomUUID(),contentHash:'h-'+randomUUID(),sourceMode:'native',segments:[{segmentId:'s1',startMs:0,endMs:500,text:quote},{segmentId:'s2',startMs:500,endMs:900,text:'ประโยคที่สอง '+label}]};
 const mid=addSource(d,src,{title:'ประชุม '+label}),sourceId=d.meetings.find(m=>m.id===mid).sourceId,review=randomUUID();
 const rid=saveReview(d,{id:review,sourceId,segments:src.segments,reviewHash:await reviewHash(review,src.segments)});
 const evidence=(segmentId,startMs,endMs,text)=>[{segmentId,startMs,endMs,quote:text,reviewRevisionId:rid}];
 addBatch(d,mid,{draftBatchId:'batch-'+mid,reviewRevisionId:rid,reviewHash:d.reviews.find(r=>r.id===rid).reviewHash,sourceHash:src.contentHash,items:[
  {proposalId:'p1',kind:'task',title:'งาน '+label,evidence:evidence('s1',0,500,quote)},{proposalId:'p2',kind:'task',title:'งานสอง '+label,evidence:evidence('s2',500,900,'ประโยคที่สอง '+label)}]});
 Object.assign(d.meetings.find(m=>m.id===mid),access);
 return {mid,quote,src,rid,label};
}
const restricted=(...who)=>({visibility:'restricted',participantIds:who.map(p=>p.legacy),organizerId:who[0].legacy});
async function prepare(label,access,by='operator'){
 const read=await as(by,c=>readLegacy(c,b)),d=read.meetingTaskManager,made=await addMeeting(d,label,access);
 await write(by,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 return {...made,d};
}
const create=(label,over={})=>({proposalId:'p1',mode:'create',title:'งาน '+label,description:null,responsibleId:m3.legacy,accountableId:m0.legacy,dueDate:null,week:seed.weekStart,priority:'must',priorityNote:null,...over});
const requestOf=(made,choices,patch={})=>{const batch=made.d.batches.find(x=>x.meetingId===made.mid);return {meetingId:made.mid,batchId:batch.id,reviewRevisionId:batch.reviewRevisionId,reviewHash:batch.reviewHash,sourceHash:batch.sourceHash,choices,...patch};};
const commit=(who,made,choices,patch)=>write(who,c=>commitMeeting(c,b,requestOf(made,choices,patch),c.zuriViewer));
const taskRow=title=>owner("SELECT * FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'title'=$2",[b,title]).then(r=>r.rows[0]);
const tasksTitled=title=>owner("SELECT id FROM zuri_go.tasks WHERE business_id=$1 AND legacy_metadata->>'title'=$2",[b,title]).then(r=>r.rowCount);
const batchRow=made=>owner("SELECT * FROM zuri_go.meeting_draft_batches WHERE business_id=$1 AND legacy_metadata->'batch'->>'id'=$2",[b,'batch-'+made.mid]).then(r=>r.rows[0]);
const counts=async()=>(await owner(`SELECT (SELECT count(*)::int FROM zuri_go.tasks WHERE business_id=$1) tasks,(SELECT count(*)::int FROM zuri_go.meeting_task_links WHERE business_id=$1) links,(SELECT count(*)::int FROM zuri_go.change_events WHERE business_id=$1) events,(SELECT count(*)::int FROM zuri_go.weekly_plan_tasks WHERE business_id=$1) entries,(SELECT domain_revision::int FROM zuri_go.businesses WHERE id=$1) revision,(SELECT next_task_no::int FROM zuri_go.businesses WHERE id=$1) next_task`)).rows[0];
const viewersOf=id=>owner('SELECT member_id FROM zuri_go.task_viewers WHERE business_id=$1 AND task_id=$2',[b,id]).then(r=>r.rows.map(x=>x.member_id).sort());

test('Guest cannot commit; any active same-Business Member commits and reads uploaded meeting evidence (ADR-008)',async()=>{
 const made=await prepare('FIVE',restricted(m0,m1,m2)),choices=[create('FIVE'),{proposalId:'p2',mode:'skip'}],before=await counts();
 await assert.rejects(commit('guest',made,choices),e=>e.status===401&&e.code==='AUTH_REQUIRED','a Guest cannot commit');
 assert.deepEqual(await counts(),before,'the Guest attempt changed nothing');
 const done=await commit(m3,made,choices);
 assert.equal(done.replayed,false);assert.equal(done.receipt.taskIds.length,1);assert.equal(done.receipt.mappings[0].proposalId,'p1');
 const row=await taskRow('งาน FIVE');
 assert.match(row.code,/^TSK-\d{4}$/);assert.equal(row.visibility,'restricted');assert.equal(row.source_kind,'meeting');
 assert.deepEqual(await viewersOf(row.id),[m0.id,m1.id,m2.id].sort(),'AC-011-009-01: the three participants are its viewers');
 const roles=(await owner('SELECT member_id,role FROM zuri_go.task_roles WHERE business_id=$1 AND task_id=$2',[b,row.id])).rows;
 assert.deepEqual(roles.map(r=>r.role+':'+r.member_id).sort(),['A:'+m0.id,'R:'+m3.id]);
 assert.equal((await owner('SELECT priority FROM zuri_go.weekly_plan_tasks WHERE business_id=$1 AND task_id=$2',[b,row.id])).rows[0].priority,'must','the week entry');
 assert.ok((await owner("SELECT 1 FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='legacy_task_event' AND entity_id=$2",[b,row.id])).rowCount>0,'the task history');
 // The stored batch carries the key and the canonical payload hash, derived by the server.
 const review=made.d.reviews.find(r=>r.id===made.rid),batch=await batchRow(made);
 assert.equal(batch.commit_key,['qa-wi09','p',made.src.recordingId,review.id,review.reviewHash,'batch-'+made.mid].join(':'));
 assert.equal(batch.commit_payload_hash,hash(JSON.parse(canonicalChoices(choices))));assert.equal(batch.legacy_metadata.receipt.origin,'server');
 assert.equal((await owner("SELECT evidence FROM zuri_go.meeting_task_links WHERE business_id=$1 AND task_id=$2",[b,row.id])).rows[0].evidence[0].quote,made.quote,'the quote is in the link');
 // One audit event on the meeting, with IDs only.
 const meetingId=(await owner("SELECT id FROM zuri_go.meetings WHERE business_id=$1 AND legacy_metadata->>'id'=$2",[b,made.mid])).rows[0].id;
 const audit=(await owner("SELECT after_data,actor_member_id FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='meetings' AND event_type='commit' AND entity_id=$2",[b,meetingId])).rows;
 assert.equal(audit.length,1);assert.equal(audit[0].actor_member_id,m3.id);assert.equal(everywhere(audit[0].after_data,made.quote),false);assert.deepEqual(audit[0].after_data.taskIds,done.receipt.taskIds);
 // m3 is not a participant; audience metadata remains on the task but does not filter same-Business reads.
 const r=await as(m3,c=>readLegacy(c,b)),seen=r.meetingTaskManager.tasks.find(t=>t.title==='งาน FIVE');
 assert.ok(seen);assert.equal(everywhere(r,made.quote),true);assert.ok(seen.sourceRefs.length>0);
 assert.equal((await commit(m3,made,choices)).replayed,true,'a same-Business Member can replay the stored internal receipt');
 const p=await as(m1,c=>readLegacy(c,b));assert.equal(everywhere(p.meetingTaskManager.tasks.find(t=>t.title==='งาน FIVE').sourceRefs,made.quote),true,'a participant reads the evidence, re-attached from the link');
 // Changing metadata remains internal; existing links and history are preserved.
 const links=await owner('SELECT batch_id,proposal_id,task_id,evidence FROM zuri_go.meeting_task_links WHERE business_id=$1 ORDER BY batch_id,proposal_id'),own=await as(m0,c=>readLegacy(c,b));
 Object.assign(own.meetingTaskManager.tasks.find(t=>t.title==='งาน FIVE'),{visibility:'business',visibilityReason:'เผยแพร่ทั้งบริษัท'});
 await write(m0,c=>saveLegacy(c,b,{version:own.version,meetingTaskManager:own.meetingTaskManager}));
 assert.equal((await taskRow('งาน FIVE')).visibility,'business');
 assert.deepEqual((await owner('SELECT batch_id,proposal_id,task_id,evidence FROM zuri_go.meeting_task_links WHERE business_id=$1 ORDER BY batch_id,proposal_id')).rows,links.rows);
 // The local operator commits too: no authenticated actor; legacy audience metadata remains stored.
 const local=await prepare('LOCAL',restricted(m0,m2)),viaOperator=await commit('operator',local,[create('LOCAL')]);
 assert.equal(viaOperator.replayed,false);assert.equal((await taskRow('งาน LOCAL')).visibility,'restricted');assert.deepEqual(await viewersOf((await taskRow('งาน LOCAL')).id),[m0.id,m2.id].sort());
 const operatorAudit=(await owner("SELECT actor_kind FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='meetings' AND event_type='commit' AND after_data->>'batchId'=$2",[b,'batch-'+local.mid])).rows;assert.deepEqual(operatorAudit,[{actor_kind:'local_operator'}]);
});
test('a replay returns the same task IDs to every Member; other key orders replay (idempotency)',async()=>{
 const made=await prepare('REPLAY',restricted(m0,m1)),choices=[create('REPLAY'),create('REPLAY',{proposalId:'p2',title:'งานสอง REPLAY'})];
 const first=await commit(m0,made,choices),before=await counts(),batch=await batchRow(made);
 const again=await commit(m0,made,choices);
 assert.equal(again.replayed,true);assert.deepEqual(again.receipt.taskIds,first.receipt.taskIds);assert.equal(again.receipt.id,first.receipt.id);
 assert.deepEqual(await counts(),before,'no task, link, event, week entry or domain_revision change');
 const other=await commit(m1,made,choices.map(c=>Object.fromEntries(Object.entries(c).reverse())).reverse());
 assert.equal(other.replayed,true,'the canonical payload ignores key and choice order');assert.deepEqual(other.receipt.taskIds,first.receipt.taskIds);
 assert.deepEqual(await counts(),before);assert.equal((await batchRow(made)).commit_key,batch.commit_key);
 const outsiderReplay=await commit(m3,made,choices);assert.equal(outsiderReplay.replayed,true,'a same-Business Member can read the meeting receipt');
 assert.equal(await tasksTitled('งาน REPLAY'),1);
});
test('two identical requests at once give one set of tasks; the second replays (hosted path, Member)',async()=>{
 const made=await prepare('PARALLEL',restricted(m0,m1)),choices=[create('PARALLEL')];
 const call=(who,route,body,requireMember=true)=>new Promise((resolve,reject)=>{const res={writeHead:status=>{res.status=status;},end:value=>resolve({status:res.status,body:JSON.parse(value)})};
  handleApi({method:'POST',headers:{'x-zuri-go':'1','content-type':'application/json'},body},res,new URL('http://127.0.0.1/api/zuri-go/v1/'+route),{businessId:b,storage:'test',principal:principal(who),requireMember}).catch(e=>{try{sendError(res,e);}catch(x){reject(x);}});});
 const route='businesses/'+b+'/meeting-commits',body=requestOf(made,choices);
 const [x,y]=await Promise.all([call(m1,route,body),call(m0,route,{...body,choices:choices.map(c=>Object.fromEntries(Object.entries(c).reverse()))})]);
 assert.deepEqual([x.status,y.status],[200,200],JSON.stringify([x.body,y.body]));
 assert.deepEqual([x.body.replayed,y.body.replayed].sort(),[false,true]);assert.deepEqual(x.body.receipt.taskIds,y.body.receipt.taskIds);
 assert.equal(await tasksTitled('งาน PARALLEL'),1);assert.equal((await owner("SELECT count(*)::int n FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='meetings' AND event_type='commit' AND after_data->>'batchId'=$2",[b,'batch-'+made.mid])).rows[0].n,1);
 assert.equal((await call('guest',route,body)).status,401,'a Guest is refused on the hosted path');
 assert.equal((await call('operator',route,body,false)).body.replayed,true,'the local operator path reaches the same handler');
 assert.equal((await call(m1,'businesses/'+b+'/meeting-commits/'+randomUUID(),body)).status,404,'only the collection route exists');
});
test('the same batch with other choices conflicts (409) and changes nothing',async()=>{
 const made=await prepare('CONFLICT',restricted(m0,m1)),choices=[create('CONFLICT')];await commit(m0,made,choices);const before=await counts();
 await assert.rejects(commit(m0,made,[create('CONFLICT',{title:'เปลี่ยนชื่อ'})]),e=>e.status===409&&e.code==='COMMIT_CONFLICT');
 await assert.rejects(commit(m0,made,[create('CONFLICT'),{proposalId:'p2',mode:'skip'}]),e=>e.status===409&&e.code==='COMMIT_CONFLICT','an extra choice is another payload');
 assert.deepEqual(await counts(),before);assert.equal(await tasksTitled('เปลี่ยนชื่อ'),0);
});
test('a stale batch or stale hashes give 409 STALE_BATCH and create nothing',async()=>{
 const made=await prepare('STALE',restricted(m0,m1)),choices=[create('STALE')],before=await counts();
 for(const patch of [{reviewHash:'other'},{sourceHash:'other'},{reviewRevisionId:'other'}])await assert.rejects(commit(m0,made,choices,patch),e=>e.status===409&&e.code==='STALE_BATCH');
 // A newer review of the meeting makes the stored batch stale.
 const read=await as('operator',c=>readLegacy(c,b)),d=read.meetingTaskManager,meeting=d.meetings.find(m=>m.id===made.mid),next=randomUUID(),segments=d.sources.find(s=>s.id===meeting.sourceId).segments;
 saveReview(d,{id:next,sourceId:meeting.sourceId,segments,reviewHash:await reviewHash(next,segments)});
 await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 await assert.rejects(commit(m0,made,choices),e=>e.status===409&&e.code==='STALE_BATCH');
 const counted=await counts();assert.equal(counted.tasks,before.tasks);assert.equal(counted.links,before.links);assert.equal(await tasksTitled('งาน STALE'),0);
});
test('a bad choice, an unknown target, and an error in the middle leave nothing behind (atomicity)',async()=>{
 const made=await prepare('ATOMIC',restricted(m0,m1)),choices=[create('ATOMIC')],before=await counts();
 // Validation errors keep their status; a missing same-Business target remains 404.
 await assert.rejects(commit(m0,made,[create('ATOMIC',{responsibleId:''})]),e=>e.status===422&&/R/.test(e.message));
 await assert.rejects(commit(m0,made,[{proposalId:'p1',mode:'skip'}]),e=>e.status===422);
 await assert.rejects(commit(m0,made,[create('ATOMIC'),create('ATOMIC')]),e=>e.status===422,'a proposal chosen twice');
 await assert.rejects(commit(m0,made,[create('ATOMIC',{proposalId:'nope'})]),e=>e.status===422);
 await assert.rejects(commit(m0,made,[create('ATOMIC',{mode:'fly'})]),e=>e.status===422);
 await assert.rejects(commit(m0,made,[create('ATOMIC',{week:'2026-09-30'})]),e=>e.status===422,'a week must start on Monday');
 await assert.rejects(commit(m0,made,'not an array'),e=>e.status===422);
 await assert.rejects(commit(m0,made,[create('ATOMIC'),{proposalId:'p2',mode:'link',taskId:randomUUID(),taskVersion:1}]),e=>e.status===404,'an unknown link target, after a valid create');
 const hidden=await as('operator',c=>readLegacy(c,b)),secret=hidden.meetingTaskManager;
 saveTask(secret,{title:'งานลับเฉพาะ m3',responsibleId:m3.legacy,visibility:'restricted',viewerIds:[m3.legacy]});await write('operator',c=>saveLegacy(c,b,{version:hidden.version,meetingTaskManager:secret}));
 const target=(await as('operator',c=>readLegacy(c,b))).meetingTaskManager.tasks.find(t=>t.title==='งานลับเฉพาะ m3');
 const memberView=(await as(m0,c=>readLegacy(c,b))).meetingTaskManager;
 assert.ok(memberView.tasks.some(t=>t.id===target.id),'a Member reads a task with formerly restricted metadata');
 await assert.rejects(commit(m0,made,[create('ATOMIC'),{proposalId:'p2',mode:'link',taskId:target.id,taskVersion:target.version+5}]),e=>e.status===409,'the formerly restricted target is addressable; a stale version still conflicts');
 const now=await counts();assert.equal(now.tasks,before.tasks+1);assert.equal(now.links,before.links);assert.equal((await batchRow(made)).commit_key,null);
 // A failure after the tasks are written (the links) rolls everything back, including the TSK counter; the same request then succeeds.
 const beforeFailure=await counts();
 await admin.query("CREATE OR REPLACE FUNCTION zuri_go.qa_fail_link() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'QA forced failure'; END $$");
 await admin.query(`CREATE TRIGGER qa_fail_link BEFORE INSERT ON zuri_go.meeting_task_links FOR EACH ROW WHEN (NEW.business_id='${b}') EXECUTE FUNCTION zuri_go.qa_fail_link()`);
 try{await assert.rejects(commit(m0,made,choices),/QA forced failure/);}
 finally{await admin.query('DROP TRIGGER IF EXISTS qa_fail_link ON zuri_go.meeting_task_links');await admin.query('DROP FUNCTION IF EXISTS zuri_go.qa_fail_link()');}
 assert.deepEqual(await counts(),beforeFailure,'no task, link, week entry, event, revision bump or TSK number');assert.equal(await tasksTitled('งาน ATOMIC'),0);
 const batch=await batchRow(made);assert.equal(batch.commit_key,null);assert.equal(batch.commit_payload_hash,null);assert.equal(batch.legacy_metadata.receipt,undefined);
 const retry=await commit(m0,made,choices);assert.equal(retry.replayed,false);assert.equal(await tasksTitled('งาน ATOMIC'),1);
});
test('an active Member may internally update or link Business tasks regardless of meeting/task audience metadata (ADR-008)',async()=>{
 const made=await prepare('WIDER',restricted(m0,m1)),read=await as('operator',c=>readLegacy(c,b)),d=read.meetingTaskManager;
 saveTask(d,{title:'งานเปิดกว้าง WIDER',responsibleId:m2.legacy});
 saveTask(d,{title:'งานลับมี R นอกวง WIDER',responsibleId:m3.legacy,visibility:'restricted',viewerIds:[m0.legacy]});
 await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 const tasks=(await as('operator',c=>readLegacy(c,b))).meetingTaskManager.tasks,pick=t=>tasks.find(x=>x.title===t);
 const open=pick('งานเปิดกว้าง WIDER'),outside=pick('งานลับมี R นอกวง WIDER');
 const choices=[
  create('WIDER',{mode:'update',taskId:open.id,taskVersion:open.version,title:'อัปเดตงานเปิดกว้าง WIDER'}),
  create('WIDER',{proposalId:'p2',mode:'link',taskId:outside.id,taskVersion:outside.version,priority:null,week:null})
 ];
 const done=await commit(m3,made,choices);
 assert.deepEqual(done.receipt.taskIds,[open.id,outside.id]);
 const updated=await taskRow('อัปเดตงานเปิดกว้าง WIDER'),linked=await taskRow('งานลับมี R นอกวง WIDER');
 assert.equal(updated.legacy_metadata.id,done.receipt.taskIds[0]);assert.equal(updated.legacy_metadata.id,open.id);assert.equal(updated.visibility,'business');
 assert.equal(linked.legacy_metadata.id,done.receipt.taskIds[1]);assert.equal(linked.legacy_metadata.id,outside.id);assert.equal(linked.visibility,'restricted');assert.deepEqual(await viewersOf(linked.id),[m0.id],'linking preserves metadata');
 const sameBusiness=(await as(m2,c=>readLegacy(c,b))).meetingTaskManager;
 assert.ok(sameBusiness.tasks.some(t=>t.id===open.id&&t.title==='อัปเดตงานเปิดกว้าง WIDER'));
 assert.ok(everywhere(sameBusiness.tasks.find(t=>t.id===outside.id).sourceRefs,made.src.segments[1].text),'the non-participant can read linked evidence');
});
test('tasks from a team or business meeting stay business; only a restricted meeting gives an audience (holdout)',async()=>{
 const team=await write('operator',c=>saveTeam(c,b,{kind:'operator'},{name:'ทีม WI09',memberIds:[m0.legacy]}));
 const teamMeeting=await prepare('TEAM',{visibility:'team',teamId:team.id,participantIds:[m0.legacy],organizerId:m0.legacy}),open=await prepare('OPEN',{visibility:'business'});
 await commit(m0,teamMeeting,[create('TEAM')]);await commit(m1,open,[create('OPEN')]);
 assert.equal((await taskRow('งาน TEAM')).visibility,'business');assert.equal((await taskRow('งาน OPEN')).visibility,'business');
 assert.deepEqual(await viewersOf((await taskRow('งาน TEAM')).id),[]);
});
test('a meeting whose transcript stays on the recording machine stores no segment and no quote; a cloud meeting is unchanged (AC-011-010-01, -04)',async()=>{
 // m0 saves a new restricted meeting as a Member: the hosted database holds stubs.
 const read=await as(m0,c=>readLegacy(c,b)),d=read.meetingTaskManager,made=await addMeeting(d,'STUB',restricted(m0,m1));
 const saved=await write(m0,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 assert.ok(saved.meetingTaskManager.sources.find(s=>s.meetingId===made.mid).withheld);
 const done=await commit(m1,{...made,d},[create('STUB',{proposalId:'p2',title:'งานสอง STUB'})]);
 assert.equal(done.replayed,false);assert.equal((await taskRow('งานสอง STUB')).visibility,'restricted');
 const tables={revisions:await owner('SELECT * FROM zuri_go.meeting_revisions WHERE business_id=$1'),batches:await owner('SELECT * FROM zuri_go.meeting_draft_batches WHERE business_id=$1'),links:await owner('SELECT * FROM zuri_go.meeting_task_links WHERE business_id=$1'),tasks:await owner('SELECT * FROM zuri_go.tasks WHERE business_id=$1'),events:await owner('SELECT * FROM zuri_go.change_events WHERE business_id=$1')};
 const stubMeeting=(await owner("SELECT id FROM zuri_go.meetings WHERE business_id=$1 AND legacy_metadata->>'id'=$2",[b,made.mid])).rows[0].id;
 for(const r of tables.revisions.rows.filter(r=>r.meeting_id===stubMeeting))assert.deepEqual(r.segments,[],'no segments');
 for(const [name,value] of Object.entries(tables))assert.equal(everywhere(value.rows,made.quote),false,'no quote text in '+name);
 assert.equal(everywhere(tables.revisions.rows.filter(r=>r.meeting_id===stubMeeting),'ประโยคที่สอง STUB'),false,'no segment text at all');
 const stubBatch=await batchRow(made),link=tables.links.rows.find(r=>r.batch_id===stubBatch.id&&r.proposal_id==='p2');assert.deepEqual(Object.keys(link.evidence[0]).sort(),['endMs','reviewRevisionId','segmentId','startMs'],'the link holds the span only');
 assert.equal((await tasksTitled('งานสอง STUB')),1);
 // The participant still reads the task with its span evidence, and the whole state validates on the client.
 const view=await as(m1,c=>readLegacy(c,b)),task=view.meetingTaskManager.tasks.find(t=>t.title==='งานสอง STUB');assert.equal(task.sourceRefs[0].evidence[0].segmentId,'s2');assert.equal(task.sourceRefs[0].evidence[0].quote,undefined);
 // A cloud meeting (business) keeps full content and quotes in its links.
 const open=await prepare('CLOUD',{visibility:'business'});await commit(m0,open,[create('CLOUD')]);
 assert.equal((await owner('SELECT evidence FROM zuri_go.meeting_task_links WHERE business_id=$1 AND batch_id=(SELECT id FROM zuri_go.meeting_draft_batches WHERE business_id=$1 AND legacy_metadata->\'batch\'->>\'id\'=$2)',[b,'batch-'+open.mid])).rows[0].evidence[0].quote,open.quote);
});
test('PUT /workspace refuses a receipt the server did not write; a stored receipt still saves (RECEIPT_SERVER_OWNED)',async()=>{
 const made=await prepare('PUT',restricted(m0,m1)),read=await as(m0,c=>readLegacy(c,b)),forged=structuredClone(read.meetingTaskManager);
 commitBatch(forged,'batch-'+made.mid,[create('PUT')]);
 const before=await counts();
 await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:forged})),e=>e.status===422&&e.code==='RECEIPT_SERVER_OWNED');
 assert.deepEqual(await counts(),before);assert.equal((await batchRow(made)).commit_key,null);
 await commit(m0,made,[create('PUT')]);
 const stored=await as(m0,c=>readLegacy(c,b));assert.ok(stored.meetingTaskManager.receipts.some(r=>r.batchId==='batch-'+made.mid));
 await write(m0,c=>saveLegacy(c,b,{version:stored.version,meetingTaskManager:stored.meetingTaskManager}));// the stored receipt is carried back unchanged
 const changed=structuredClone(stored.meetingTaskManager);changed.receipts.find(r=>r.batchId==='batch-'+made.mid).taskIds=[];
 const again=await as(m0,c=>readLegacy(c,b));await assert.rejects(write(m0,c=>saveLegacy(c,b,{version:again.version,meetingTaskManager:changed})),e=>e.status>=400,'a stored receipt stays immutable');
});
test('a receipt made by the old client replays through the endpoint by the old payload comparison (legacy)',async()=>{
 const lb=await newBusiness(),ws0=createWorkspace(),d=empty();seedWorkspace(d,seed);
 const src={sourceInstanceId:'qa-legacy',projectId:'p',recordingId:'r',contentHash:'source-hash',sourceMode:'native',segments:[{segmentId:'seg',startMs:0,endMs:500,text:'Chef ตรวจหน้าเว็บ'}]};
 const mid=addSource(d,src,{title:'QA legacy meeting'}),sourceId=d.meetings[0].sourceId,rid=saveReview(d,{sourceId,segments:src.segments,reviewHash:'review-hash'});
 addBatch(d,mid,{draftBatchId:'batch-legacy',reviewRevisionId:rid,reviewHash:'review-hash',sourceHash:'source-hash',items:[{proposalId:'p1',kind:'task',title:'ตรวจหน้าเว็บ',evidence:[{segmentId:'seg',startMs:0,endMs:500,quote:'ตรวจหน้าเว็บ',reviewRevisionId:rid}]}]});
 const choices=[{proposalId:'p1',mode:'create',title:'ตรวจหน้าเว็บ',responsibleId:d.members[0].id,week:'2026-09-28',priority:'must'}];
 const ids=commitBatch(d,'batch-legacy',choices);
 const backup={schemaVersion:2,appId:'dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1',campaignWorkspace:ws0,meetingTaskManager:d},run=fn=>transaction(lb,OPERATOR,fn);
 const report=await run(c=>importPreview(c,lb,{backup,includeTranscript:true,source_namespace:randomUUID()}));await run(c=>importCommit(c,lb,report.id,{backup_sha256:report.backup_sha256}));
 const request={meetingId:mid,batchId:'batch-legacy',reviewRevisionId:rid,reviewHash:'review-hash',sourceHash:'source-hash',choices};
 const before=(await owner('SELECT count(*)::int n,(SELECT domain_revision::int FROM zuri_go.businesses WHERE id=$1) r FROM zuri_go.tasks WHERE business_id=$1',[lb],lb)).rows[0];
 const replay=await run(c=>commitMeeting(c,lb,request,c.zuriViewer));
 assert.equal(replay.replayed,true);assert.deepEqual(replay.receipt.taskIds,ids);assert.equal(replay.receipt.origin,undefined,'the old receipt is returned as stored');
 assert.deepEqual((await owner('SELECT count(*)::int n,(SELECT domain_revision::int FROM zuri_go.businesses WHERE id=$1) r FROM zuri_go.tasks WHERE business_id=$1',[lb],lb)).rows[0],before);
 await assert.rejects(run(c=>commitMeeting(c,lb,{...request,choices:[{...choices[0],title:'เปลี่ยน'}]},c.zuriViewer)),e=>e.status===409&&e.code==='COMMIT_CONFLICT');
 // Tasks written by the old flow keep their references; the quote is in the link, and the old receipt replays after a re-save too.
 const after=await run(c=>readLegacy(c,lb));assert.equal(after.meetingTaskManager.tasks.find(t=>t.id===ids[0]).sourceRefs[0].evidence[0].quote,'ตรวจหน้าเว็บ');
});
test('a restricted meeting with an Inactive participant commits and keeps them in the audience; an Inactive R is refused (WI-12 D2)',async()=>{
 const setStatus=(m,status)=>owner('UPDATE zuri_go.members SET status=$3 WHERE business_id=$1 AND id=$2',[b,m.id,status]);
 await setStatus(m2,'inactive');
 try{
  const made=await prepare('INACTIVE-P',restricted(m0,m1,m2)),done=await commit(m0,made,[create('INACTIVE-P')]);
  assert.equal(done.replayed,false);assert.equal(done.receipt.taskIds.length,1);
  const row=await taskRow('งาน INACTIVE-P');assert.equal(row.visibility,'restricted');assert.deepEqual(await viewersOf(row.id),[m0.id,m1.id,m2.id].sort(),'the Inactive participant is a viewer');
  const other=await prepare('INACTIVE-R',restricted(m0,m1)),before=await counts();
  await assert.rejects(commit(m0,other,[create('INACTIVE-R',{responsibleId:m2.legacy})]),e=>e.status===422&&/Active/.test(e.message),'an Inactive R is work, not access');
  await assert.rejects(commit(m0,other,[create('INACTIVE-R',{accountableId:m2.legacy})]),e=>e.status===422&&/Active/.test(e.message));
  assert.deepEqual(await counts(),before);assert.equal(await tasksTitled('งาน INACTIVE-R'),0);
 }finally{await setStatus(m2,'active');}
});
test('history events keep no quote text, after a commit or a later edit; no priority event when the priority does not change (WI-12 D14, D12)',async()=>{
 // A business task for p2 to link to, then a meeting whose p1 creates a task (no priority) and whose p2 links with a priority.
 const read=await as('operator',c=>readLegacy(c,b)),d=read.meetingTaskManager,target=saveTask(d,{title:'งานผูก HISTORY',responsibleId:m2.legacy});
 await write('operator',c=>saveLegacy(c,b,{version:read.version,meetingTaskManager:d}));
 const made=await prepare('HISTORY',restricted(m0,m1)),second='ประโยคที่สอง HISTORY',linkTarget=(await as('operator',c=>readLegacy(c,b))).meetingTaskManager.tasks.find(t=>t.title==='งานผูก HISTORY');
 await commit(m1,made,[create('HISTORY',{priority:null}),{proposalId:'p2',mode:'link',taskId:linkTarget.id,taskVersion:linkTarget.version,week:seed.weekStart,priority:'should'}]);
 const events=()=>owner("SELECT entity_id,event_type,after_data FROM zuri_go.change_events WHERE business_id=$1 AND entity_type='legacy_task_event'").then(r=>r.rows);
 const row=await taskRow('งาน HISTORY'),linked=await taskRow('งานผูก HISTORY');
 let rows=await events();
 for(const text of [made.quote,second])assert.equal(everywhere(rows,text),false,'no quote in any history event: '+text);
 const created=rows.find(r=>r.entity_id===row.id&&r.after_data.type==='task-created'),link=rows.find(r=>r.entity_id===linked.id&&r.after_data.type==='source-linked');
 assert.ok(created&&link,'both events are still recorded');
 assert.equal(created.after_data.detail.after.sourceRefs[0].proposalId,'p1');assert.equal(created.after_data.detail.after.sourceRefs[0].evidence,undefined);
 assert.equal(link.after_data.detail.proposalId,'p2');assert.equal(link.after_data.detail.evidence,undefined);assert.equal(link.after_data.detail.meetingId,made.mid);
 // D12: the new task joined the week without a priority, so it has no priority event; the link set 'should', so it has one.
 assert.equal(rows.filter(r=>r.entity_id===row.id&&r.after_data.type==='priority').length,0);assert.equal(rows.filter(r=>r.entity_id===linked.id&&r.after_data.type==='priority').length,1);
 assert.equal((await owner('SELECT priority FROM zuri_go.weekly_plan_tasks WHERE business_id=$1 AND task_id=$2',[b,row.id])).rows[0].priority,null,'the week entry itself is kept');
 // A later edit by a participant: the client holds the quote (re-attached from the link), its event snapshots must not store it.
 const view=await as(m1,c=>readLegacy(c,b)),mine=view.meetingTaskManager.tasks.find(t=>t.title==='งาน HISTORY');
 assert.equal(everywhere(mine.sourceRefs,made.quote),true,'the participant still reads the evidence');
 saveTask(view.meetingTaskManager,{id:mine.id,version:mine.version,description:'แก้หลังประชุม'});
 await write(m1,c=>saveLegacy(c,b,{version:view.version,meetingTaskManager:view.meetingTaskManager}));
 rows=await events();assert.ok(rows.some(r=>r.entity_id===row.id&&r.after_data.type==='task-updated'),'the edit is recorded');
 for(const text of [made.quote,second])assert.equal(everywhere(rows,text),false,'no quote after the edit: '+text);
 assert.equal(everywhere(await as(m1,c=>readLegacy(c,b)),made.quote),true,'and the participant reads it on the task');
});
