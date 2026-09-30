// Rehearsal of the Workboard backfill on a QA Business (SDD-010 Tests, item 5).
// @trace verifies FR-010-016
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {pool,transaction} from '../db.mjs';
import {OPERATOR} from '../viewer.mjs';
import {save} from '../service.mjs';
import {backfillWorkboard,counts} from '../backfill-workboard.mjs';
import {readTask} from '../tasks.mjs';
after(()=>pool.end());
const run=(b,fn)=>transaction(b,OPERATOR,fn);

test('dry run writes nothing; a run matches it, keeps every row and snapshot, and replays as a no-op (FR-010-016)',async()=>{
 const b=randomUUID();await transaction(b,c=>c.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[b,'QA ONLY · workboard backfill rehearsal',b]));
 await run(b,c=>save(c,b,'members',{display_name:'Chef'}));
 const campaign=await run(b,c=>save(c,b,'campaigns',{name:'แคมเปญ backfill'}));
 // Pre-P2 Workboard rows: campaign-legacy, no details, default marker, Workboard JSON in legacy_metadata.
 const entries=[
  {id:'w-ready',title:'ตั้งค่า pixel',status:'Ready',owner:'Chef',due:'2026-10-09',priority:'High',offer:'normal',gate:'cvr',hypothesis:'CVR ต่ำ',action:'แก้หน้า',dependencies:'รอ dev',estimate:1200,acceptance:'',evidence:'',recheck:'',outcome:''},
  {id:'w-done',title:'ยิงโฆษณา',status:'Done',owner:'Boss',due:'2026-09-20',priority:'Medium',offer:'normal',gate:'',hypothesis:'',action:'',dependencies:'',estimate:null,acceptance:'ยอดคลิก',evidence:'https://ads',recheck:'2026-10-01',outcome:'ok'},
  {id:'w-blocked',title:'รอภาพ',status:'Blocked',owner:'',due:'',priority:'Low',offer:'',gate:'',hypothesis:'',action:'',dependencies:'',estimate:null,acceptance:'',evidence:'',recheck:'',outcome:''}];
 const status={Ready:'planned',Done:'done',Blocked:'blocked'};
 for(const [i,w] of entries.entries())await run(b,c=>c.query("INSERT INTO tasks(business_id,code,title,status,status_confirmed,campaign_id,source_kind,due_date,legacy_metadata) VALUES($1,$2,$3,$4,true,$5,'campaign-legacy',$6,$7)",[b,'TSK-90'+i,w.title,status[w.status],campaign.id,w.due||null,w]));
 const legacyBefore=(await run(b,c=>c.query("SELECT id,code,legacy_metadata FROM tasks WHERE business_id=$1 ORDER BY code",[b]))).rows;
 const statesBefore=(await run(b,c=>c.query('SELECT payload_hash FROM campaign_states WHERE business_id=$1',[b]))).rows;

 const dry=await run(b,async c=>({report:await backfillWorkboard(c,b,{dryRun:true,schema:7}),after:await counts(c,b),details:(await c.query('SELECT count(*)::int n FROM campaign_task_details WHERE business_id=$1',[b])).rows[0].n}));
 assert.equal(dry.report.workboardTasks,3);assert.equal(dry.report.toWrite,3);assert.equal(dry.details,0,'the dry run writes nothing');
 assert.deepEqual(Object.values(dry.report.perCampaignAndStatus)[0],{Ready:1,Done:1,Blocked:1});
 assert.equal(dry.report.fieldMapping.gate.present,1);assert.ok(dry.report.anomalies.some(a=>/owner text equals a Member/.test(a.issue)));

 const before=await run(b,c=>counts(c,b));
 const done=await run(b,c=>backfillWorkboard(c,b,{dryRun:false,schema:7}));
 assert.deepEqual(done.perCampaignAndStatus,dry.report.perCampaignAndStatus);assert.deepEqual(await run(b,c=>counts(c,b)),before,'no task, role, entry, attachment or event lost or added');
 const legacyAfter=(await run(b,c=>c.query("SELECT id,code,legacy_metadata FROM tasks WHERE business_id=$1 ORDER BY code",[b]))).rows;
 assert.deepEqual(legacyAfter,legacyBefore,'IDs, codes and legacy_metadata unchanged');
 assert.deepEqual((await run(b,c=>c.query('SELECT payload_hash FROM campaign_states WHERE business_id=$1',[b]))).rows,statesBefore);
 const row=id=>legacyBefore.find(r=>r.legacy_metadata.id===id).id;
 const ready=await run(b,c=>readTask(c,b,row('w-ready'),c.zuriViewer));
 assert.equal(ready.owner_label,'Chef');assert.equal(ready.roles.R,null,'owner text is never bound (AC-010-016-05)');
 assert.equal(ready.details.original_status,'Ready');assert.equal(ready.details.priority,'High');assert.equal(ready.details.estimate,1200);assert.equal(ready.dependency_note,'รอ dev');
 const closed=await run(b,c=>readTask(c,b,row('w-done'),c.zuriViewer));assert.equal(closed.completion_rule,'workboard');assert.equal(closed.evidence,'https://ads');assert.equal(closed.recheck_date,'2026-10-01');
 const blocked=await run(b,c=>readTask(c,b,row('w-blocked'),c.zuriViewer));assert.equal(blocked.status,'blocked');assert.equal(blocked.blocker,null);assert.equal(blocked.owner_label,null);

 const snapshot=async()=>(await run(b,c=>c.query('SELECT t.*,d.* FROM tasks t LEFT JOIN campaign_task_details d ON d.task_id=t.id WHERE t.business_id=$1 ORDER BY t.code',[b]))).rows;
 const once=await snapshot(),again=await run(b,c=>backfillWorkboard(c,b,{dryRun:false,schema:7}));
 assert.equal(again.toWrite,0);assert.equal(again.alreadyDetailed,3);assert.deepEqual(await snapshot(),once,'a replay changes nothing (AC-010-016-02)');
});
