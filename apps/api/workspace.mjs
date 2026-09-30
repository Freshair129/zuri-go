import {createHash,randomUUID} from 'node:crypto';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
import {hash,fail,audit,allocate} from './service.mjs';
import {createCampaign,restoreWorkspace,measure,evaluate} from '../web/src/content/shared/model.mjs';
import {empty,validateState,validateEvidence,isBatchStale} from '../web/src/content/meeting/model.mjs';
const APP_ID='dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1';
const safeId=(b,kind,id)=>{const s=createHash('sha256').update([b,kind,id].join(':')).digest('hex');return s.slice(0,8)+'-'+s.slice(8,12)+'-4'+s.slice(13,16)+'-a'+s.slice(17,20)+'-'+s.slice(20,32);};
const iso=v=>v?new Date(v).toISOString():null;
const M_FIELDS={displayName:'display_name',fullName:'full_name',nickname:'nickname',team:'team',position:'position',email:'email',phone:'phone',notes:'notes',status:'status'};
const T_FIELDS={title:'title',description:'description',deliverable:'deliverable',status:'status',statusConfirmed:'status_confirmed',dueDate:'due_date',acceptance:'acceptance',acceptanceProposed:'acceptance_proposed',evidence:'evidence',blocker:'blocker',project:'project_label',dependency:'dependency_note',kpi:'kpi_note',recheckDate:'recheck_date',sourceUrl:'source_url'};
async function all(c,b,table){return (await c.query(`SELECT * FROM ${table} WHERE business_id=$1`,[b])).rows;}
async function upsert(c,b,table,id,values){
 const keys=Object.keys(values);return(await c.query(`INSERT INTO ${table}(business_id,id,${keys.join(',')}) VALUES($1,$2,${keys.map((_,i)=>'$'+(i+3)).join(',')}) ON CONFLICT(id) DO UPDATE SET ${keys.map(k=>`${k}=EXCLUDED.${k}`).join(',')} WHERE ${table}.business_id=EXCLUDED.business_id RETURNING *`,[b,id,...Object.values(values)])).rows[0];
}
function translated(object,fields){return Object.fromEntries(Object.entries(fields).filter(([old])=>object[old]!==undefined).map(([old,key])=>[key,object[old]||object[old]===false?object[old]:null]));}
export async function readLegacy(c,b){
 const business=(await c.query('SELECT * FROM businesses WHERE id=$1',[b])).rows[0],campaignRows=await all(c,b,'campaigns'),states=await all(c,b,'campaign_states'),tasks=await all(c,b,'tasks'),members=await all(c,b,'members'),roles=await all(c,b,'task_roles'),weeks=await all(c,b,'weekly_plans'),entries=await all(c,b,'weekly_plan_tasks');
 const legacyId=row=>row.legacy_metadata?.id||row.id;
 const memberMap=new Map(members.map(m=>[m.id,legacyId(m)])),campaignMap=new Map(campaignRows.map(r=>[r.id,r.id]));
 const campaigns=campaignRows.filter(x=>!x.archived_at).map(r=>{const payload=states.find(s=>s.campaign_id===r.id)?.state_json||createCampaign(r.name,r.objective,false);return {...payload,id:r.id,name:r.name,objective:r.objective,owner:members.find(m=>m.id===r.owner_member_id)?.display_name||payload.legacyOwnerLabel||'',start:r.planned_start||'',end:r.planned_end||'',createdAt:iso(r.created_at),tasks:tasks.filter(t=>t.campaign_id===r.id&&t.source_kind==='campaign-legacy').map(t=>t.legacy_metadata)};});
 const domain=empty();domain.revision=Number(business.domain_revision);domain.seedKeys=business.legacy_metadata.seedKeys||[];
 domain.members=members.map(r=>{const m={...r.legacy_metadata,id:legacyId(r),pid:r.pid,version:Number(r.row_version),createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)};for(const [k,v] of Object.entries(M_FIELDS))m[k]=r[v];return m;});
 domain.tasks=tasks.filter(t=>t.source_kind!=='campaign-legacy'&&!t.archived_at).map(r=>{const result={...r.legacy_metadata,id:legacyId(r),version:Number(r.row_version),campaignId:r.campaign_id||null,createdAt:iso(r.created_at),updatedAt:iso(r.updated_at),sourceKind:r.source_kind,sourceRefs:r.legacy_metadata.sourceRefs||[],consultedIds:[],informedIds:[]};for(const [k,v] of Object.entries(T_FIELDS))result[k]=r[v];for(const role of ['R','A','C','I']){const matches=roles.filter(x=>x.task_id===r.id&&x.role===role);if(role==='R'||role==='A')result[role==='R'?'responsibleId':'accountableId']=matches[0]?memberMap.get(matches[0].member_id):null;else result[role==='C'?'consultedIds':'informedIds']=matches.map(x=>memberMap.get(x.member_id));if(role==='A')result.accountableConfirmed=matches[0]?.confirmation==='confirmed';}return result;});
 const taskMap=new Map(tasks.map(t=>[t.id,legacyId(t)]));domain.weeks=weeks.map(w=>({weekStart:w.week_start,timezone:w.timezone,entries:entries.filter(e=>e.weekly_plan_id===w.id).map(e=>({taskId:taskMap.get(e.task_id),priority:e.priority,priorityNote:e.priority_note}))}));
 domain.meetings=(await all(c,b,'meetings')).map(r=>({...r.legacy_metadata,campaignId:r.campaign_id||null}));
 for(const r of await all(c,b,'meeting_revisions'))domain[r.kind==='source'?'sources':'reviews'].push(r.legacy_metadata);
 for(const r of await all(c,b,'meeting_draft_batches')){domain.batches.push(r.legacy_metadata.batch);if(r.legacy_metadata.receipt)domain.receipts.push(r.legacy_metadata.receipt);}
 const events=await c.query("SELECT after_data FROM change_events WHERE business_id=$1 AND entity_type='legacy_task_event' ORDER BY occurred_at,id",[b]);domain.events=events.rows.map(r=>r.after_data);
 const selected=campaigns[0]?.id||null;
 return {schemaVersion:2,appId:APP_ID,version:Number(business.domain_revision),campaignWorkspace:{schemaVersion:1,selected,campaigns},meetingTaskManager:domain};
}
function validateCampaignWorkspace(ws){if(ws?.schemaVersion===1&&Array.isArray(ws.campaigns)&&!ws.campaigns.length)return ws;return restoreWorkspace(ws);}
async function writeCampaigns(c,b,ws,initial=false){
 validateCampaignWorkspace(ws);
 const map=new Map(),existing=await all(c,b,'campaigns'),members=await all(c,b,'members');
 for(const campaign of ws.campaigns){
   const known=existing.find(r=>r.id===campaign.id),id=known?.id||safeId(b,'campaign',campaign.id);map.set(campaign.id,id);
   const row=known||(await c.query('SELECT * FROM campaigns WHERE business_id=$1 AND id=$2',[b,id])).rows[0];
   const ownerMatches=members.filter(m=>m.display_name===campaign.owner),ownerId=ownerMatches.length===1?ownerMatches[0].id:null;
   const payload=structuredClone(campaign);for(const k of ['id','name','objective','owner','start','end','createdAt','tasks'])delete payload[k];if(campaign.owner)payload.legacyOwnerLabel=campaign.owner;
   await upsert(c,b,'campaigns',id,{code:row?.code||await allocate(c,b,'campaigns'),name:campaign.name,objective:campaign.objective,owner_member_id:ownerId,lifecycle:row?.lifecycle||'unconfirmed',planned_start:campaign.start||null,planned_end:campaign.end||null,currency:campaign.currency||'THB'});
   await c.query('INSERT INTO campaign_states(business_id,campaign_id,state_json,payload_hash) VALUES($1,$2,$3,$4) ON CONFLICT(business_id,campaign_id) DO UPDATE SET state_json=EXCLUDED.state_json,payload_hash=EXCLUDED.payload_hash',[b,id,payload,hash(payload)]);
   for(const task of campaign.tasks){const tid=safeId(b,'campaign-task',id+':'+task.id),old=(await c.query('SELECT * FROM tasks WHERE business_id=$1 AND id=$2',[b,tid])).rows[0];const status=({Done:'done',Doing:'doing',Blocked:'blocked',Review:'review',Todo:'planned'})[task.status]||'planned';await upsert(c,b,'tasks',tid,{code:old?.code||await allocate(c,b,'tasks'),title:task.title,description:task.description||null,status,status_confirmed:true,campaign_id:id,source_kind:'campaign-legacy',due_date:task.due||null,legacy_metadata:task});}
 }
 return map;
}
async function writeDomain(c,b,state,campaignMap=new Map()){
 validateState(state);const existingTasks=await all(c,b,'tasks'),existingMembers=await all(c,b,'members'),id=(kind,value)=>value?safeId(b,kind,value):null;
 const oldBatches=await all(c,b,'meeting_draft_batches');
 for(const batch of state.batches){
   const prior=oldBatches.find(r=>r.id===id('batch',batch.id)),review=state.reviews.find(r=>r.id===batch.reviewRevisionId),source=state.sources.find(r=>r.id===batch.sourceId),receipt=state.receipts.find(r=>r.batchId===batch.id);
   if(batch.reviewHash!==review.reviewHash||batch.sourceHash!==source.contentHash)fail('Batch hash ไม่ตรงหลักฐาน');
   for(const item of batch.items)validateEvidence(review,item.evidence);
   if(prior&&hash(prior.legacy_metadata.batch)!==hash(batch))fail('ห้ามเขียนทับร่างงานเดิม');
   if(prior?.legacy_metadata.receipt&&hash(prior.legacy_metadata.receipt)!==hash(receipt))fail('ห้ามเปลี่ยน receipt ที่ยืนยันแล้ว');
   if(prior&&receipt&&!prior.legacy_metadata.receipt&&isBatchStale(state,batch))fail('ร่างเก่าใช้สร้างงานไม่ได้');
   if(receipt&&(!receipt.mappings?.length||receipt.mappings.some(m=>!receipt.taskIds.includes(m.taskId)||!batch.items.some(i=>i.proposalId===m.proposalId))))fail('Receipt ขาด mapping ของงานและหลักฐาน');
 }
 const memberId=value=>existingMembers.find(m=>m.id===value||m.legacy_metadata?.id===value)?.id||id('member',value);
 const taskId=value=>existingTasks.find(t=>t.id===value||t.legacy_metadata?.id===value)?.id||id('task',value);
 // Never silently drop records omitted by an old or partial client.
 for(const old of existingMembers)if(!state.members.some(m=>m.id===(old.legacy_metadata.id||old.id)))fail('Workspace ขาดสมาชิกเดิม กรุณาโหลดข้อมูลล่าสุด',409);
 for(const old of existingTasks.filter(t=>t.source_kind!=='campaign-legacy'&&!t.archived_at))if(!state.tasks.some(t=>t.id===(old.legacy_metadata.id||old.id)))fail('Workspace ขาดงานเดิม กรุณาโหลดข้อมูลล่าสุด',409);
 for(const m of state.members){const metadata={...m};for(const key of ['pid','password','password_hash','passwordHash','credentials','credential_version'])delete metadata[key];await upsert(c,b,'members',memberId(m.id),{...translated(m,M_FIELDS),legacy_metadata:metadata});}
 const campaignId=value=>campaignMap.get(value)||value||null;
 for(const t of state.tasks){const old=existingTasks.find(row=>row.id===taskId(t.id));await upsert(c,b,'tasks',taskId(t.id),{...translated(t,T_FIELDS),code:old?.code||await allocate(c,b,'tasks'),source_kind:t.sourceKind||'manual',campaign_id:campaignId(t.campaignId),legacy_metadata:t});
   await c.query('DELETE FROM task_roles WHERE business_id=$1 AND task_id=$2',[b,taskId(t.id)]);
   for(const [role,people] of [['R',[t.responsibleId]],['A',[t.accountableId]],['C',t.consultedIds],['I',t.informedIds]])for(const person of people.filter(Boolean))await c.query('INSERT INTO task_roles(business_id,task_id,member_id,role,confirmation) VALUES($1,$2,$3,$4,$5)',[b,taskId(t.id),memberId(person),role,role==='A'?(t.accountableConfirmed?'confirmed':'proposed'):(t.raciProposed?'proposed':'confirmed')]);
 }
 for(const w of state.weeks){const wid=id('week',w.weekStart);await upsert(c,b,'weekly_plans',wid,{week_start:w.weekStart,timezone:w.timezone||'Asia/Bangkok',legacy_metadata:w});await c.query('DELETE FROM weekly_plan_tasks WHERE business_id=$1 AND weekly_plan_id=$2',[b,wid]);for(const e of w.entries)await c.query('INSERT INTO weekly_plan_tasks(business_id,weekly_plan_id,task_id,priority,priority_note) VALUES($1,$2,$3,$4,$5)',[b,wid,taskId(e.taskId),e.priority,e.priorityNote||null]);}
 for(const m of state.meetings)await upsert(c,b,'meetings',id('meeting',m.id),{title:m.title,campaign_id:campaignId(m.campaignId),started_at:m.startedAt||m.meetingStartedAt||null,source_instance_id:m.sourceInstanceId,source_project_id:m.projectId,source_recording_id:m.recordingId,legacy_metadata:m});
 const putRevision=async(r,kind)=>{const rid=id(kind,r.id),prior=(await c.query('SELECT * FROM meeting_revisions WHERE business_id=$1 AND id=$2',[b,rid])).rows[0];if(prior){if(hash(prior.legacy_metadata)!==hash(r))fail('ห้ามเขียนทับ transcript revision เดิม');return;}
 await upsert(c,b,'meeting_revisions',rid,{meeting_id:id('meeting',r.meetingId),kind,parent_revision_id:kind==='review'?id(r.parentRevisionId?'review':'source',r.parentRevisionId||r.sourceId):null,content_hash:r.contentHash||r.reviewHash,source_revision:r.sourceRevision||null,source_cursor:r.sourceCursor||null,source_mode:r.sourceMode||null,segments:JSON.stringify(r.segments),coverage:r.coverage||null,captured_at:r.capturedAt||r.reviewedAt||new Date().toISOString(),legacy_metadata:r});};
 for(const src of state.sources)await putRevision(src,'source');
 const pending=[...state.reviews];const done=new Set();while(pending.length){const ix=pending.findIndex(r=>!r.parentRevisionId||done.has(r.parentRevisionId));if(ix<0)fail('Review lineage มีวงวน');const [r]=pending.splice(ix,1);await putRevision(r,'review');done.add(r.id);}
 for(const batch of state.batches){const receipt=state.receipts.find(r=>r.batchId===batch.id);await upsert(c,b,'meeting_draft_batches',id('batch',batch.id),{meeting_id:id('meeting',batch.meetingId),review_revision_id:id('review',batch.reviewRevisionId),request_id:batch.requestId||batch.id,source_hash:batch.sourceHash,review_hash:batch.reviewHash,mode:batch.modelName?'local_ai':'manual',model_ref:batch.modelName||null,items:JSON.stringify(batch.items),generated_at:batch.generatedAt||new Date().toISOString(),committed_at:receipt?.committedAt||null,commit_key:receipt?.idempotencyKey||null,commit_payload_hash:receipt?receipt.payloadHash||hash(receipt.payload):null,legacy_metadata:{batch,receipt}});
   for(const mapping of receipt?.mappings||[]){const evidence=batch.items.find(i=>i.proposalId===mapping.proposalId)?.evidence;if(!evidence)fail('Receipt ขาด proposal evidence');await c.query('INSERT INTO meeting_task_links(business_id,batch_id,proposal_id,task_id,review_revision_id,evidence,committed_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(business_id,batch_id,proposal_id) DO NOTHING',[b,id('batch',batch.id),mapping.proposalId,taskId(mapping.taskId),id('review',batch.reviewRevisionId),JSON.stringify(evidence),receipt.committedAt]);}
 }
 for(const event of state.events){const stamped=c.zuriActor?{...event,actor:c.zuriActor.displayName+' · '+c.zuriActor.pid,actorMemberId:c.zuriActor.memberId,actorPid:c.zuriActor.pid,at:new Date().toISOString()}:event;await c.query("INSERT INTO change_events(id,business_id,entity_type,entity_id,event_type,after_data,actor_kind,request_id,occurred_at,actor_member_id,actor_pid,actor_subject) VALUES($1,$2,'legacy_task_event',$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(id) DO NOTHING",[id('event',event.id),b,event.taskId?taskId(event.taskId):b,event.type||'legacy',stamped,c.zuriActor?'authenticated':'local_operator',event.id,stamped.at||new Date().toISOString(),c.zuriActor?.memberId||null,c.zuriActor?.pid||null,c.zuriActor?.pid||null]);}
 await c.query('UPDATE businesses SET legacy_metadata=jsonb_set(legacy_metadata,\'{seedKeys}\',$2::jsonb) WHERE id=$1',[b,JSON.stringify(state.seedKeys)]);
}
export async function saveLegacy(c,b,input){
 const current=(await c.query('SELECT * FROM businesses WHERE id=$1 FOR UPDATE',[b])).rows[0];if(Number(input.version)!==Number(current.domain_revision))fail('ข้อมูลถูกแก้แล้ว กรุณาโหลด workspace ใหม่',409);
 let map=new Map();if(input.campaignWorkspace)map=await writeCampaigns(c,b,input.campaignWorkspace);
 if(input.meetingTaskManager)await writeDomain(c,b,input.meetingTaskManager,map);
 await audit(c,b,'workspace',b,null,{domains:[...(input.campaignWorkspace?['campaigns']:[]),...(input.meetingTaskManager?['meetings_tasks_members']:[])]},'save');
 await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);const result=await readLegacy(c,b);if(input.campaignWorkspace?.selected)result.campaignWorkspace.selected=map.get(input.campaignWorkspace.selected)||result.campaignWorkspace.selected;return result;
}
function decodeBackup(value){if(value.schemaVersion===2){if(value.appId!==APP_ID)fail('Backup เป็นของแอปอื่น');validateCampaignWorkspace(value.campaignWorkspace);if(value.meetingTaskManager?.restoreJournal)fail('Backup มี restore ที่ยังไม่เสร็จ');validateState(value.meetingTaskManager);return value;}return {schemaVersion:2,appId:APP_ID,campaignWorkspace:restoreWorkspace(value),meetingTaskManager:empty()};}
export async function importPreview(c,b,input){
 const backup=decodeBackup(input.backup),containsTranscript=backup.meetingTaskManager.sources.length>0;
 if(containsTranscript&&!input.includeTranscript)fail('Backup มี transcript เลือกรวมข้อมูลประชุมก่อนนำเข้า');
 const id=randomUUID(),namespace=input.source_namespace||randomUUID(),sha=hash(backup),prior=(await c.query('SELECT * FROM migration_batches WHERE business_id=$1 AND source_namespace=$2 AND backup_sha256=$3',[b,namespace,sha])).rows[0];if(prior?.status==='committed')return {...prior.report,id:prior.id,alreadyCommitted:true};
 const existing=(await c.query('SELECT count(*)::integer AS n FROM campaigns WHERE business_id=$1',[b])).rows[0].n;
 const report={id,source_namespace:namespace,backup_sha256:sha,campaigns:backup.campaignWorkspace.campaigns.length,members:backup.meetingTaskManager.members.length,tasks:backup.meetingTaskManager.tasks.length+backup.campaignWorkspace.campaigns.reduce((n,x)=>n+x.tasks.length,0),meetings:backup.meetingTaskManager.meetings.length,containsTranscript,canCommit:existing===0,warnings:['แคมเปญเดิมจะเป็นสถานะรอยืนยัน','ไม่เดา lifecycle หรือเป้าผู้ติดตามจากวันที่',...(existing?['ธุรกิจมีแคมเปญแล้ว ยังไม่ merge อัตโนมัติ ให้ตรวจและเลือกปลายทางว่าง']:[])]};
 await mkdir(new URL('../../.local/imports/',import.meta.url),{recursive:true});await writeFile(new URL(`../../.local/imports/${id}.json`,import.meta.url),JSON.stringify({businessId:b,backup,report}));
 return report;
}
export async function importCommit(c,b,id,input){
 const stage=JSON.parse(await readFile(new URL(`../../.local/imports/${id}.json`,import.meta.url),'utf8'));if(stage.businessId!==b||input.backup_sha256!==stage.report.backup_sha256)fail('Import preview ไม่ตรงกับคำยืนยัน',409);
 const {backup,report}=stage;await c.query('SELECT id FROM businesses WHERE id=$1 FOR UPDATE',[b]);
 const prior=(await c.query("SELECT * FROM migration_batches WHERE business_id=$1 AND source_namespace=$2 AND backup_sha256=$3 AND status='committed'",[b,report.source_namespace,report.backup_sha256])).rows[0];if(prior)return {id:prior.id,alreadyCommitted:true,workspace:await readLegacy(c,b)};
 if((await c.query('SELECT 1 FROM campaigns WHERE business_id=$1 LIMIT 1',[b])).rowCount)fail('ธุรกิจไม่ว่าง ไม่แทนที่ข้อมูลที่มีอยู่',409);
 await c.query("INSERT INTO migration_batches(id,business_id,source_namespace,backup_sha256,backup_schema_version,status,report) VALUES($1,$2,$3,$4,2,'validated',$5)",[id,b,report.source_namespace,report.backup_sha256,report]);
 const cmap=await writeCampaigns(c,b,backup.campaignWorkspace,true);await writeDomain(c,b,backup.meetingTaskManager,cmap);
 for(const [kind,items] of [['campaign',backup.campaignWorkspace.campaigns],['member',backup.meetingTaskManager.members],['task',backup.meetingTaskManager.tasks],['meeting',backup.meetingTaskManager.meetings],['source',backup.meetingTaskManager.sources],['review',backup.meetingTaskManager.reviews],['batch',backup.meetingTaskManager.batches]])for(const row of items)await c.query('INSERT INTO migration_keys(business_id,source_namespace,entity_type,legacy_id,batch_id,new_id,source_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[b,report.source_namespace,kind,row.id,id,safeId(b,kind,row.id),hash(row)]);
 await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);
 const after=await readLegacy(c,b);for(let i=0;i<backup.campaignWorkspace.campaigns.length;i++){const before=backup.campaignWorkspace.campaigns[i],next=after.campaignWorkspace.campaigns.find(x=>x.id===cmap.get(before.id));const beforeMetrics=measure(before),afterMetrics=measure(next);for(const key of ['revenue','units','spend','sql'])if(beforeMetrics[key]!==afterMetrics[key])fail('Import reconciliation failed: '+key);}
 validateState(after.meetingTaskManager);await c.query("UPDATE migration_batches SET status='committed',committed_at=now() WHERE business_id=$1 AND id=$2",[b,id]);return {id,report,workspace:after};
}
