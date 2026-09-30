// @trace verifies FR-010-002, FR-010-003, FR-010-005, FR-010-006, FR-010-007, FR-010-009, FR-010-013, FR-010-015
import test from 'node:test';
import assert from 'node:assert/strict';
import {moveError,completionError,saveError,contextError,onBoard,idempotencyOutcome,projectError,toWorkboardStatus} from '../../web/src/content/shared/task-rules.mjs';
import {workboardFields,projectCampaignTask} from '../campaign-tasks.mjs';

const done={title:'x',responsibleId:'r',accountableId:'a',accountableConfirmed:true,acceptance:'ผ่าน',acceptanceProposed:false,evidence:'https://e'};
test('moveError: SDD-010 acceptance and holdout (FR-010-006)',()=>{
 assert.equal(moveError({title:'x'},'blocked'),'BLOCKER_REQUIRED');assert.equal(moveError({title:'x'},'doing'),null);
 assert.equal(moveError({title:'x',blocker:'รอไฟล์'},'blocked'),null);assert.equal(moveError({title:'x'},'archived'),'STATUS_INVALID');
 assert.equal(moveError({...done,evidence:''},'done'),'EVIDENCE_REQUIRED');
});
test('completionError: SDD-010 acceptance and holdout (FR-010-007)',()=>{
 assert.equal(completionError(done),null);assert.equal(completionError({...done,evidence:' '}),'EVIDENCE_REQUIRED');
 assert.equal(completionError({...done,kpi:'CVR'}),'RECHECK_REQUIRED');assert.equal(completionError({...done,details:{gate:'cvr'}}),'RECHECK_REQUIRED');
 assert.equal(completionError({...done,campaignId:'c1'}),'DUE_REQUIRED');assert.equal(completionError({...done,accountableConfirmed:false}),'A_UNCONFIRMED');
 assert.equal(completionError({...done,responsibleId:null}),'R_REQUIRED');assert.equal(completionError({...done,acceptanceProposed:true}),'ACCEPTANCE_UNCONFIRMED');
});
test('saveError: a Workboard completion is not re-checked until it leaves Done (AC-010-007-03, -04)',()=>{
 const legacy={title:'x',status:'done',completionRule:'workboard'};
 assert.equal(saveError({status:'done'},legacy),null);
 assert.equal(saveError({status:'review'},{...legacy,completionRule:'standard'}),'R_REQUIRED');
 assert.equal(saveError({status:'blocked'},{title:'x',status:'blocked'}),null,'a Blocked Workboard task without a blocker stays valid');
 assert.equal(saveError({status:'doing'},{title:'x',status:'blocked'}),'BLOCKER_REQUIRED');
 assert.equal(saveError(null,{title:'  ',status:'planned'}),'TITLE_REQUIRED');
});
test('contextError: SDD-010 acceptance and holdout (FR-010-002)',()=>{
 assert.equal(contextError({campaignId:'B'},{contentItem:{campaign_id:'A'}}),'CONTEXT_CONFLICT');assert.equal(contextError({}),null);
 assert.equal(contextError({campaignId:'A'},{goal:{campaign_id:'A'}}),null);assert.equal(contextError({},{contentItem:{campaign_id:'A'},goal:{campaign_id:'B'}}),'CONTEXT_CONFLICT');
});
test('onBoard: SDD-010 acceptance and holdout; mine is R or A (FR-010-005)',()=>{
 assert.equal(onBoard({campaignId:'c1'},{kind:'campaign',id:'c1'}),true);assert.equal(onBoard({},{kind:'unlinked'}),true);assert.equal(onBoard({campaignId:'c1'},{kind:'unlinked'}),false);
 const both={campaignId:'c1',projectId:'p1'};assert.equal(onBoard(both,{kind:'campaign',id:'c1'}),true);assert.equal(onBoard(both,{kind:'project',id:'p1'}),true);
 assert.equal(onBoard({responsibleId:'m'},{kind:'mine'},'m'),true);assert.equal(onBoard({accountableId:'m'},{kind:'mine'},'m'),true);
 assert.equal(onBoard({informedIds:['m']},{kind:'mine'},'m'),false);assert.equal(onBoard({responsibleId:'m'},{kind:'mine'},null),false);
});
test('idempotencyOutcome and projectError (FR-010-009, FR-010-003)',()=>{
 assert.equal(idempotencyOutcome(null,'h'),'create');assert.equal(idempotencyOutcome({idempotency_hash:'h'},'h'),'replay');assert.equal(idempotencyOutcome({idempotency_hash:'h'},'g'),'conflict');
 assert.equal(projectError({name:'CRM ใหม่'}),null);assert.equal(projectError({name:'x',status:'paused'}),'STATUS_INVALID');
 assert.equal(projectError({name:'x',planned_start:'2026-10-10',planned_end:'2026-10-01'}),'DATES_INVALID');assert.equal(projectError({name:'  '}),'NAME_REQUIRED');
});
test('workboardFields and projectCampaignTask are inverse; Backlog and Ready stay badges (FR-010-013, -015)',()=>{
 const ready={id:'w1',title:'ตั้งค่า pixel',status:'Ready',owner:'Chef',due:'2026-10-09',priority:'High',offer:'normal',gate:'cvr',hypothesis:'CVR ต่ำเพราะหน้า',action:'แก้หน้า',dependencies:'',estimate:1200,acceptance:'',evidence:'',recheck:'',outcome:''};
 const {task,details}=workboardFields(ready);
 assert.equal(task.status,'planned');assert.equal(details.original_status,'Ready');assert.equal(task.owner_label,'Chef');assert.equal(details.priority,'High');
 assert.equal(workboardFields({...ready,status:'Done'}).task.completion_rule,'workboard');
 const blocked=workboardFields({...ready,status:'Blocked'});assert.equal(blocked.task.status,'blocked');assert.equal(blocked.task.blocker,undefined);
 const row={id:'00000000-0000-4000-a000-000000000001',source_kind:'campaign-legacy',legacy_metadata:ready,...task};
 assert.deepEqual(projectCampaignTask(row,details),ready);
 assert.equal(toWorkboardStatus('planned','Backlog'),'Backlog');assert.equal(toWorkboardStatus('doing','Ready'),'Doing');
});
test('projectCampaignTask: before the backfill a Workboard task keeps its entry, with the record’s status laid over it',()=>{
 const entry={id:'w2',title:'เดิม',status:'Ready',owner:'Chef',due:'',priority:'Low'};
 const row={id:'00000000-0000-4000-a000-000000000002',source_kind:'campaign-legacy',legacy_metadata:entry,title:'เดิม',status:'planned',due_date:null,description:null};
 assert.deepEqual(projectCampaignTask(row,null),{...entry,due:''});
 assert.equal(projectCampaignTask({...row,status:'doing'},null).status,'Doing');
 const manual={id:'00000000-0000-4000-a000-000000000003',source_kind:'manual',legacy_metadata:{},title:'จาก Task Manager',status:'review',owner_label:null,due_date:'2026-10-20'};
 const p=projectCampaignTask(manual,null,'Boss');assert.equal(p.id,manual.id);assert.equal(p.status,'Review');assert.equal(p.owner,'Boss');assert.equal(p.priority,'Medium');
});
