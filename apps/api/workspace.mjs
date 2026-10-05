import {createHash,randomUUID} from 'node:crypto';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
import {hash,fail,audit,allocate,canEditMembers,memberChanged,checkMemberWrite} from './service.mjs';
import {createCampaign,restoreWorkspace,measure,evaluate} from '../web/src/content/shared/model.mjs';
import {empty,validateState,validateEvidence,isBatchStale,isWithheld,reviewHash} from '../web/src/content/meeting/model.mjs';
import {visibilityChange,meetingAudience,DEFAULT_VISIBILITY} from '../web/src/content/shared/visibility.mjs';
import {RULE_MESSAGES} from '../web/src/content/shared/task-rules.mjs';
import {viewerOf,taskNames,meetingNames,readable,withholdQuotes} from './audience.mjs';
import {projectCampaignTask,writeWorkboardEntry} from './campaign-tasks.mjs';
const APP_ID='dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1';
export const safeId=(b,kind,id)=>{const s=createHash('sha256').update([b,kind,id].join(':')).digest('hex');return s.slice(0,8)+'-'+s.slice(8,12)+'-4'+s.slice(13,16)+'-a'+s.slice(17,20)+'-'+s.slice(20,32);};
const iso=v=>v?new Date(v).toISOString():null;
const M_FIELDS={displayName:'display_name',fullName:'full_name',nickname:'nickname',team:'team',position:'position',email:'email',phone:'phone',notes:'notes',status:'status'};
const T_FIELDS={title:'title',description:'description',deliverable:'deliverable',status:'status',statusConfirmed:'status_confirmed',dueDate:'due_date',acceptance:'acceptance',acceptanceProposed:'acceptance_proposed',evidence:'evidence',blocker:'blocker',project:'project_label',dependency:'dependency_note',kpi:'kpi_note',recheckDate:'recheck_date',sourceUrl:'source_url'};
async function all(c,b,table){return (await c.query(`SELECT * FROM ${table} WHERE business_id=$1`,[b])).rows;}
// Insert or update without RETURNING or ON CONFLICT, so a restricted row can be written before
// the people named on it (SDD-011 "Write order"). An ID held by a hidden item answers 409.
// An UPDATE also checks the new row against the read policy, so an existing item keeps its old
// audience here and setAccess applies the new one after its people are written.
async function writeItem(c,b,table,id,values,exists){
 if(exists){const {visibility,team_id,...rest}=values;values=rest;}
 const keys=Object.keys(values),params=[b,id,...Object.values(values)];
 if(exists){await c.query(`UPDATE ${table} SET ${keys.map((k,i)=>`${k}=$${i+3}`).join(',')} WHERE business_id=$1 AND id=$2`,params);return;}
 try{await c.query(`INSERT INTO ${table}(business_id,id,${keys.join(',')}) VALUES($1,$2,${keys.map((_,i)=>'$'+(i+3)).join(',')})`,params);}
 catch(e){if(e.code==='23505'&&e.constraint===`${table}_pkey`)fail('ข้อมูลถูกแก้แล้ว กรุณาโหลด workspace ใหม่',409);throw e;}
}
async function setAccess(c,b,table,id,old,access){if(old&&(old.visibility!==access.visibility||old.team_id!==access.team_id))await c.query(`UPDATE ${table} SET visibility=$3,team_id=$4 WHERE business_id=$1 AND id=$2`,[b,id,access.visibility,access.team_id]);}
async function upsert(c,b,table,id,values){
 const keys=Object.keys(values);return(await c.query(`INSERT INTO ${table}(business_id,id,${keys.join(',')}) VALUES($1,$2,${keys.map((_,i)=>'$'+(i+3)).join(',')}) ON CONFLICT(id) DO UPDATE SET ${keys.map(k=>`${k}=EXCLUDED.${k}`).join(',')} WHERE ${table}.business_id=EXCLUDED.business_id RETURNING *`,[b,id,...Object.values(values)])).rows[0];
}
function translated(object,fields){return Object.fromEntries(Object.entries(fields).filter(([old])=>object[old]!==undefined).map(([old,key])=>[key,object[old]||object[old]===false?object[old]:null]));}
// Custody of confidential transcripts (FR-011-010, SDD-011 "Meetings (P3)"). Content of a meeting whose transcript is 'local_only'
// reaches the hosted API as a stub: same hashes and lineage, no segments and no evidence text, marked withheld.
export const custodyRevision=(row,custody)=>custody==='local_only'?{...row,segments:[],legacy_metadata:{...row.legacy_metadata,segments:[],withheld:true}}:row;
export const custodyBatch=(batch,custody)=>custody==='local_only'?{...batch,items:batch.items.map(item=>({...item,evidence:(item.evidence||[]).map(({quote,...place})=>place)}))}:batch;
export async function readLegacy(c,b,viewer=viewerOf(c)){
 const business=(await c.query('SELECT * FROM businesses WHERE id=$1',[b])).rows[0],campaignRows=await all(c,b,'campaigns'),states=await all(c,b,'campaign_states'),allTasks=await all(c,b,'tasks'),members=await all(c,b,'members'),allRoles=await all(c,b,'task_roles'),weeks=await all(c,b,'weekly_plans'),allEntries=await all(c,b,'weekly_plan_tasks');
 // Only what this viewer may read (FR-011-004…008); row-level security applies the same rule.
 const tasks=readable(viewer,allTasks,await taskNames(c,b)),visibleIds=new Set(tasks.map(t=>t.id)),roles=allRoles.filter(r=>visibleIds.has(r.task_id)),entries=allEntries.filter(e=>visibleIds.has(e.task_id)),viewerRows=(await all(c,b,'task_viewers')).filter(v=>visibleIds.has(v.task_id));
 const meetingRows=readable(viewer,await all(c,b,'meetings'),await meetingNames(c,b)),meetingIds=new Set(meetingRows.map(r=>r.id)),visibleMeetings=new Set(meetingRows.map(r=>r.legacy_metadata.id)),participants=(await all(c,b,'meeting_participants')).filter(p=>meetingIds.has(p.meeting_id));
 // Evidence quotes live in meeting_task_links (FR-011-009), which follow the meeting; a task row keeps only the reference.
 const links=new Map((await all(c,b,'meeting_task_links')).map(l=>[l.task_id+':'+l.proposal_id,l.evidence])),legacyId=row=>row.legacy_metadata?.id||row.id;
 const memberMap=new Map(members.map(m=>[m.id,legacyId(m)])),campaignMap=new Map(campaignRows.map(r=>[r.id,r.id]));
 // Campaign tasks are projected from the task records and their details (FR-010-015); the R's name stands in for the owner text.
 const details=new Map((await all(c,b,'campaign_task_details')).map(d=>[d.task_id,d])),rName=t=>{const r=roles.find(x=>x.task_id===t.id&&x.role==='R');return r?members.find(m=>m.id===r.member_id)?.display_name||'':'';};
 const campaigns=campaignRows.map(r=>{const payload=states.find(s=>s.campaign_id===r.id)?.state_json||createCampaign(r.name,r.objective,false);return {...payload,id:r.id,name:r.name,objective:r.objective,owner:members.find(m=>m.id===r.owner_member_id)?.display_name||payload.legacyOwnerLabel||'',start:r.planned_start||'',end:r.planned_end||'',archived_at:r.archived_at||null,createdAt:iso(r.created_at),tasks:tasks.filter(t=>t.campaign_id===r.id).map(t=>({...projectCampaignTask(t,details.get(t.id)||null,rName(t)),archived_at:t.archived_at||null}))};});
 const domain=empty();domain.revision=Number(business.domain_revision);domain.seedKeys=business.legacy_metadata.seedKeys||[];
 domain.members=members.map(r=>{const m={id:legacyId(r),pid:r.pid,version:Number(r.row_version),createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)};for(const [k,v] of Object.entries(M_FIELDS))m[k]=r[v];return m;});
 domain.tasks=tasks.filter(t=>t.source_kind!=='campaign-legacy').map(r=>{const result={...r.legacy_metadata,id:legacyId(r),version:Number(r.row_version),campaignId:r.campaign_id||null,createdAt:iso(r.created_at),updatedAt:iso(r.updated_at),archived_at:r.archived_at||null,sourceKind:r.source_kind,sourceRefs:r.legacy_metadata.sourceRefs||[],consultedIds:[],informedIds:[]};for(const [k,v] of Object.entries(T_FIELDS))result[k]=r[v];for(const role of ['R','A','C','I']){const matches=roles.filter(x=>x.task_id===r.id&&x.role===role);if(role==='R'||role==='A')result[role==='R'?'responsibleId':'accountableId']=matches[0]?memberMap.get(matches[0].member_id):null;else result[role==='C'?'consultedIds':'informedIds']=matches.map(x=>memberMap.get(x.member_id));if(role==='A')result.accountableConfirmed=matches[0]?.confirmation==='confirmed';}return result;});
 const rowOf=new Map(tasks.map(t=>[legacyId(t),t]));
 for(const t of domain.tasks){const row=rowOf.get(t.id);t.visibility=row.visibility;t.teamId=row.team_id||null;t.viewerIds=viewerRows.filter(v=>v.task_id===row.id).map(v=>memberMap.get(v.member_id));delete t.visibilityReason;delete t.sourceRefsWithheld;
  // References to meetings this viewer cannot read are withheld here and kept on save.
  const refs=t.sourceRefs.filter(ref=>visibleMeetings.has(ref.meetingId)).map(ref=>Array.isArray(ref.evidence)?ref:{...ref,evidence:links.get(row.id+':'+ref.proposalId)||{withheld:true}});if(refs.length!==t.sourceRefs.length)t.sourceRefsWithheld=true;t.sourceRefs=refs;}
 const taskMap=new Map(tasks.map(t=>[t.id,legacyId(t)]));// Entries keep the order the client saved (weekly_plans.legacy_metadata), not the physical row order.
 const saved=w=>(w.legacy_metadata?.entries||[]).map(e=>e.taskId),position=(w,id)=>{const i=saved(w).indexOf(id);return i<0?Infinity:i;};
 domain.weeks=weeks.map(w=>({id:w.id,weekStart:w.week_start,timezone:w.timezone,archived_at:w.archived_at||null,entries:entries.filter(e=>e.weekly_plan_id===w.id).map(e=>({taskId:taskMap.get(e.task_id),priority:e.priority,priorityNote:e.priority_note})).sort((x,y)=>position(w,x.taskId)-position(w,y.taskId))}));
 domain.meetings=meetingRows.map(r=>{const people=participants.filter(p=>p.meeting_id===r.id);return {...r.legacy_metadata,id:r.legacy_metadata.id||r.id,archived_at:r.archived_at||null,campaignId:r.campaign_id||null,visibility:r.visibility,teamId:r.team_id||null,transcriptCustody:r.transcript_custody,participantIds:people.map(p=>memberMap.get(p.member_id)),organizerId:memberMap.get(people.find(p=>p.role==='organizer')?.member_id)||null};});
 for(const r of (await all(c,b,'meeting_revisions')).filter(r=>meetingIds.has(r.meeting_id)))domain[r.kind==='source'?'sources':'reviews'].push(r.legacy_metadata);
 const shownTasks=new Set(domain.tasks.map(t=>t.id));
 // A receipt that names a task this viewer cannot read is withheld; the stored receipt is kept on save.
 for(const r of (await all(c,b,'meeting_draft_batches')).filter(r=>meetingIds.has(r.meeting_id))){domain.batches.push(r.legacy_metadata.batch);const receipt=r.legacy_metadata.receipt;if(receipt&&receipt.taskIds.every(id=>shownTasks.has(id)))domain.receipts.push(receipt);}
 const events=await c.query("SELECT entity_id,after_data FROM change_events WHERE business_id=$1 AND entity_type='legacy_task_event' ORDER BY occurred_at,id",[b]);domain.events=events.rows.filter(r=>r.entity_id===b||visibleIds.has(r.entity_id)).map(r=>withholdQuotes(r.after_data,visibleMeetings));
 const auditEvents=(await c.query('SELECT * FROM change_events WHERE business_id=$1 ORDER BY occurred_at,id',[b])).rows;
 const selected=campaigns[0]?.id||null;
 return {schemaVersion:2,appId:APP_ID,version:Number(business.domain_revision),campaignWorkspace:{schemaVersion:1,selected,campaigns},meetingTaskManager:domain,auditEvents};
}
export async function archiveMeeting(c,b,ref,viewer=viewerOf(c)){
 if(viewer.kind==='guest')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
 const old=(await c.query("SELECT * FROM meetings WHERE business_id=$1 AND (id::text=$2 OR legacy_metadata->>'id'=$2) ORDER BY (id::text=$2) DESC LIMIT 1 FOR UPDATE",[b,ref])).rows[0];
 if(!old)fail('ไม่พบประชุม',404);if(old.archived_at)return {id:old.legacy_metadata?.id||old.id,archived_at:old.archived_at};
 const row=(await c.query('UPDATE meetings SET archived_at=now() WHERE business_id=$1 AND id=$2 RETURNING *',[b,old.id])).rows[0];
 await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);await audit(c,b,'meetings',old.id,old,row,'archive');
 return {id:row.legacy_metadata?.id||row.id,archived_at:row.archived_at};
}
export async function archiveWeeklyPlan(c,b,id,viewer=viewerOf(c)){
 if(viewer.kind==='guest')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
 const old=(await c.query('SELECT * FROM weekly_plans WHERE business_id=$1 AND id=$2 FOR UPDATE',[b,id])).rows[0];
 if(!old)fail('ไม่พบแผนสัปดาห์',404);if(old.archived_at)return {id:old.id,archived_at:old.archived_at};
 const row=(await c.query('UPDATE weekly_plans SET archived_at=now() WHERE business_id=$1 AND id=$2 RETURNING *',[b,id])).rows[0];
 await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);await audit(c,b,'weekly_plans',id,old,row,'archive');
 return {id:row.id,archived_at:row.archived_at};
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
   // The Workboard is a view of the task records (FR-010-013); each entry finds its record, never a duplicate.
   for(const task of campaign.tasks)await writeWorkboardEntry(c,b,id,task,{initial,safeId});
 }
 return map;
}
export const CHANGE_ERRORS={WIDEN_DENIED:['เฉพาะผู้รับผิดชอบหลัก (A) หรือผู้จัดประชุมขยายการมองเห็นได้',403],REASON_REQUIRED:['ระบุเหตุผลที่ขยายการมองเห็น',422],TEAM_REQUIRED:['เลือกฝ่ายสำหรับการมองเห็นระดับฝ่าย',422],NAMED_REQUIRED:['รายการที่จำกัดการมองเห็นต้องมีผู้มองเห็นอย่างน้อยหนึ่งคน',422],SELF_EXCLUDED:['เพิ่มตัวเองเป็นผู้มองเห็นก่อนจำกัดการมองเห็น',422],LEVEL_INVALID:['ระดับการมองเห็นไม่ถูกต้อง',422]};
// Only what this viewer may read is required, compared or rewritten; hidden items are never touched (SDD-011 "Write paths").
// restore: a backup import by the local operator, which keeps the people, roles and registry as they were (WI-12 D2, D3); a Member's import obeys both rules.
export async function writeDomain(c,b,state,campaignMap=new Map(),viewer=viewerOf(c),{refuseNewReceipts=false,restore=false}={}){
 validateState(state);const existingTasks=readable(viewer,await all(c,b,'tasks'),await taskNames(c,b)),existingMembers=await all(c,b,'members'),id=(kind,value)=>value?safeId(b,kind,value):null;
 const existingRoles=await all(c,b,'task_roles'),existingViewers=await all(c,b,'task_viewers'),existingMeetings=readable(viewer,await all(c,b,'meetings'),await meetingNames(c,b)),existingParticipants=await all(c,b,'meeting_participants');
 const visibleMeetingIds=new Set(existingMeetings.map(r=>r.id)),oldBatches=(await all(c,b,'meeting_draft_batches')).filter(r=>visibleMeetingIds.has(r.meeting_id)),stateTasks=new Set(state.tasks.map(t=>t.id)),stateMeetings=new Set(state.meetings.map(m=>m.id));
 // Meetings whose transcript stays on the recording machine; the local operator always keeps full content (FR-011-010).
 const custody=new Map(existingMeetings.map(r=>[r.id,r.transcript_custody])),custodyFor=mid=>viewer.kind!=='operator'&&custody.get(mid)==='local_only'?'local_only':'cloud';
 const receiptOf=(batch,prior)=>state.receipts.find(r=>r.batchId===batch.id)||(prior?.legacy_metadata.receipt?.taskIds.some(t=>!stateTasks.has(t))?prior.legacy_metadata.receipt:undefined);
 for(const batch of state.batches){
   const prior=oldBatches.find(r=>r.id===id('batch',batch.id)),review=state.reviews.find(r=>r.id===batch.reviewRevisionId),source=state.sources.find(r=>r.id===batch.sourceId),receipt=receiptOf(batch,prior);
   // A receipt is issued only by the server's meeting commit; a client save may carry one that is already stored (WI-09).
   if(refuseNewReceipts&&receipt&&!prior?.legacy_metadata.receipt)throw Object.assign(Error('ใบยืนยันการสร้างงานจากประชุมออกโดย server เท่านั้น ใช้ปุ่มสร้างและมอบหมายงาน'),{status:422,code:'RECEIPT_SERVER_OWNED'});
   if(batch.reviewHash!==review.reviewHash||batch.sourceHash!==source.contentHash)fail('Batch hash ไม่ตรงหลักฐาน');
   for(const item of batch.items)validateEvidence(review,item.evidence);
   if(prior&&![batch,custodyBatch(batch,custodyFor(id('meeting',batch.meetingId)))].some(v=>hash(v)===hash(prior.legacy_metadata.batch)))fail('ห้ามเขียนทับร่างงานเดิม');
   if(prior?.legacy_metadata.receipt&&hash(prior.legacy_metadata.receipt)!==hash(receipt))fail('ห้ามเปลี่ยน receipt ที่ยืนยันแล้ว');
   if(prior&&receipt&&!prior.legacy_metadata.receipt&&isBatchStale(state,batch))fail('ร่างเก่าใช้สร้างงานไม่ได้');
   if(receipt&&(!receipt.mappings?.length||receipt.mappings.some(m=>!receipt.taskIds.includes(m.taskId)||!batch.items.some(i=>i.proposalId===m.proposalId))))fail('Receipt ขาด mapping ของงานและหลักฐาน');
 }
 const memberId=value=>existingMembers.find(m=>m.id===value||m.legacy_metadata?.id===value)?.id||id('member',value);
 const taskId=value=>existingTasks.find(t=>t.id===value||t.legacy_metadata?.id===value)?.id||id('task',value);
 // A task reference keeps no quote text once meeting_task_links holds it (stored or written by this save); a task written before WI-09 keeps its inline evidence.
 const linked=new Set([...(await all(c,b,'meeting_task_links')).map(l=>l.task_id+':'+l.proposal_id),...state.receipts.flatMap(r=>(r.mappings||[]).map(m=>taskId(m.taskId)+':'+m.proposalId))]);
 const bare=(tid,ref,old)=>{const stored=(old?.legacy_metadata?.sourceRefs||[]).find(r=>r.proposalId===ref.proposalId&&r.reviewRevisionId===ref.reviewRevisionId&&Array.isArray(r.evidence));if(stored)return ref.evidence?.withheld===true?stored:ref;const {evidence,...rest}=ref;return evidence?.withheld===true||linked.has(tid+':'+ref.proposalId)?rest:ref;};
 const peopleOf=(m,mid)=>{const oldPeople=existingParticipants.filter(p=>p.meeting_id===mid),oldOrganizer=oldPeople.find(p=>p.role==='organizer')?.member_id||null,organizer=m.participantIds===undefined?oldOrganizer:m.organizerId?memberId(m.organizerId):null;return {oldPeople,oldOrganizer,organizer,people:m.participantIds===undefined?oldPeople.map(p=>p.member_id).sort():[...new Set([...m.participantIds.map(memberId),...(organizer?[organizer]:[])])].sort()};};
 // FR-011-009: a new task that comes from a restricted meeting is restricted with the meeting's participants as viewers, whatever the client sent.
 const audiences=new Map(state.meetings.map(m=>{const mid=id('meeting',m.id),old=existingMeetings.find(r=>r.id===mid);return [m.id,meetingAudience({visibility:m.visibility??old?.visibility??DEFAULT_VISIBILITY},peopleOf(m,mid).people)];}));
 const taskAudience=t=>{const found=t.sourceRefs.map(ref=>audiences.get(ref.meetingId)).filter(Boolean);return found.length?{visibility:'restricted',viewerIds:[...new Set(found.flatMap(a=>a.viewerIds))]}:null;};
 async function access(kind,itemId,before,input,named,owner){
   const after={visibility:input.visibility??before?.visibility??DEFAULT_VISIBILITY,team_id:input.teamId!==undefined?input.teamId||null:before?.team_id??null};
   const changed=!before||after.visibility!==before.visibility||after.team_id!==before.team_id;
   if(changed||after.visibility==='restricted'){const r=visibilityChange(viewer,before,after,{accountableId:owner,organizerId:owner,reason:input.visibilityReason,named});if(r.error&&(changed||r.error==='NAMED_REQUIRED'))fail(...CHANGE_ERRORS[r.error]);}
   if(changed&&after.team_id&&after.team_id!==before?.team_id){const team=(await c.query('SELECT archived_at FROM teams WHERE business_id=$1 AND id=$2',[b,after.team_id])).rows[0];if(!team||team.archived_at)fail('เลือกฝ่ายที่ยังใช้งานอยู่');}
   if(changed&&before)await audit(c,b,kind,itemId,before,{...after,reason:input.visibilityReason?.trim()||null});
   return after;
 }
 const withoutAccess=(value,keys)=>{const copy={...value};for(const k of keys)delete copy[k];return copy;};
 // Never silently drop records omitted by an old or partial client.
 for(const old of existingMembers)if(!state.members.some(m=>m.id===(old.legacy_metadata.id||old.id)))fail('Workspace ขาดสมาชิกเดิม กรุณาโหลดข้อมูลล่าสุด',409);
 for(const old of existingTasks.filter(t=>t.source_kind!=='campaign-legacy'&&!t.archived_at))if(!state.tasks.some(t=>t.id===(old.legacy_metadata.id||old.id)))fail('Workspace ขาดงานเดิม กรุณาโหลดข้อมูลล่าสุด',409);
 // Registry rules (WI-12 D3): a record the viewer may not change is checked against the stored row and, when it is the same, left untouched.
 for(const m of state.members){const fields=translated(m,M_FIELDS),row=existingMembers.find(r=>r.id===memberId(m.id));if(!restore){checkMemberWrite(viewer,row,fields);if(!canEditMembers(viewer)&&!memberChanged(row,fields))continue;}const metadata={...m};for(const key of ['pid','password','password_hash','passwordHash','credentials','credential_version'])delete metadata[key];await upsert(c,b,'members',memberId(m.id),{...fields,legacy_metadata:metadata});}
 // A new R, A, C or I must be Active; a role the task already had with that Member is kept. Named viewers and meeting participants may be Inactive (WI-12 D2).
 const inactive=new Set(state.members.filter(m=>m.status==='inactive').map(m=>memberId(m.id)));
 const campaignId=value=>campaignMap.get(value)||value||null;
 for(const given of state.tasks){const old=existingTasks.find(row=>row.id===taskId(given.id)),tid=taskId(given.id),oldViewers=existingViewers.filter(v=>v.task_id===tid).map(v=>v.member_id).sort();
   if(!restore){const had=new Set(existingRoles.filter(r=>r.task_id===tid).map(r=>r.role+':'+r.member_id));for(const [role,people] of [['R',[given.responsibleId]],['A',[given.accountableId]],['C',given.consultedIds],['I',given.informedIds]])for(const person of people.filter(Boolean)){const pid=memberId(person);if(inactive.has(pid)&&!had.has(role+':'+pid))throw Object.assign(Error(RULE_MESSAGES.MEMBER_INACTIVE),{status:422,code:'MEMBER_INACTIVE'});}}
   const audience=old?null:taskAudience(given),t=audience?{...given,visibility:audience.visibility,teamId:null}:given;
   const viewers=[...new Set([...(t.viewerIds===undefined?oldViewers:t.viewerIds.map(memberId)),...(audience?.viewerIds||[])])].sort(),named=[...[t.responsibleId,t.accountableId,...t.consultedIds,...t.informedIds].filter(Boolean).map(memberId),...viewers];
   const a=await access('task_visibility',tid,old&&{visibility:old.visibility,team_id:old.team_id},t,named,existingRoles.find(r=>r.task_id===tid&&r.role==='A')?.member_id||(t.accountableId?memberId(t.accountableId):null));
   // Keep references to meetings this viewer cannot read (withheld by readLegacy).
   const hiddenRefs=(old?.legacy_metadata?.sourceRefs||[]).filter(ref=>!stateMeetings.has(ref.meetingId)),metadata=withoutAccess({...t,sourceRefs:[...hiddenRefs,...t.sourceRefs.map(ref=>bare(tid,ref,old))]},['visibility','teamId','viewerIds','visibilityReason','sourceRefsWithheld']);
   await writeItem(c,b,'tasks',tid,{...translated(t,T_FIELDS),code:old?.code||await allocate(c,b,'tasks'),source_kind:t.sourceKind||'manual',campaign_id:campaignId(t.campaignId),legacy_metadata:metadata,visibility:a.visibility,team_id:a.team_id},!!old);
   if(hash(viewers)!==hash(oldViewers)){await c.query('DELETE FROM task_viewers WHERE business_id=$1 AND task_id=$2',[b,tid]);for(const v of viewers)await c.query('INSERT INTO task_viewers(business_id,task_id,member_id,added_by_member_id) VALUES($1,$2,$3,$4)',[b,tid,v,c.zuriActor?.memberId||null]);await audit(c,b,'task_viewers',tid,old?{viewerIds:oldViewers}:null,{viewerIds:viewers});}
   await c.query('DELETE FROM task_roles WHERE business_id=$1 AND task_id=$2',[b,taskId(t.id)]);
   for(const [role,people] of [['R',[t.responsibleId]],['A',[t.accountableId]],['C',t.consultedIds],['I',t.informedIds]])for(const person of people.filter(Boolean))await c.query('INSERT INTO task_roles(business_id,task_id,member_id,role,confirmation) VALUES($1,$2,$3,$4,$5)',[b,taskId(t.id),memberId(person),role,role==='A'?(t.accountableConfirmed?'confirmed':'proposed'):(t.raciProposed?'proposed':'confirmed')]);
   await setAccess(c,b,'tasks',tid,old,a);
 }
 const writableTasks=[...new Set([...existingTasks.map(t=>t.id),...state.tasks.map(t=>taskId(t.id))])],shownTasks=new Set([...existingTasks.map(t=>t.legacy_metadata?.id||t.id),...state.tasks.map(t=>t.id)]),oldWeeks=await all(c,b,'weekly_plans');
 // Entries of tasks this viewer cannot read stay in the stored week (and in weekly_plan_tasks) untouched.
 for(const w of state.weeks){const wid=id('week',w.weekStart),hiddenEntries=(oldWeeks.find(r=>r.id===wid)?.legacy_metadata?.entries||[]).filter(e=>!shownTasks.has(e.taskId));await upsert(c,b,'weekly_plans',wid,{week_start:w.weekStart,timezone:w.timezone||'Asia/Bangkok',legacy_metadata:{...w,entries:[...w.entries,...hiddenEntries]}});await c.query('DELETE FROM weekly_plan_tasks WHERE business_id=$1 AND weekly_plan_id=$2 AND task_id=ANY($3::uuid[])',[b,wid,writableTasks]);for(const e of w.entries)await c.query('INSERT INTO weekly_plan_tasks(business_id,weekly_plan_id,task_id,priority,priority_note) VALUES($1,$2,$3,$4,$5)',[b,wid,taskId(e.taskId),e.priority,e.priorityNote||null]);}
 for(const m of state.meetings){const mid=id('meeting',m.id),old=existingMeetings.find(r=>r.id===mid),{oldPeople,oldOrganizer,organizer,people}=peopleOf(m,mid);
   const a=await access('meeting_visibility',mid,old&&{visibility:old.visibility,team_id:old.team_id},m,people,oldOrganizer||organizer);
   // A meeting that becomes restricted keeps its transcript on the recording machine until a participant uploads it (FR-011-010).
   const held=a.visibility==='restricted'&&old?.visibility!=='restricted'?'local_only':old?.transcript_custody||'cloud';custody.set(mid,held);
   await writeItem(c,b,'meetings',mid,{title:m.title,campaign_id:campaignId(m.campaignId),started_at:m.startedAt||m.meetingStartedAt||null,source_instance_id:m.sourceInstanceId,source_project_id:m.projectId,source_recording_id:m.recordingId,legacy_metadata:withoutAccess(m,['visibility','teamId','participantIds','organizerId','visibilityReason','transcriptCustody',...(held==='local_only'&&viewer.kind!=='operator'?['workingCopy']:[])]),visibility:a.visibility,team_id:a.team_id,transcript_custody:old?.transcript_custody||'cloud'},!!old);
   const before=oldPeople.map(p=>p.member_id+':'+p.role).sort(),after=people.map(p=>p+':'+(p===organizer?'organizer':'participant')).sort();
   if(m.participantIds!==undefined&&hash(before)!==hash(after)){await c.query('DELETE FROM meeting_participants WHERE business_id=$1 AND meeting_id=$2',[b,mid]);for(const p of people)await c.query('INSERT INTO meeting_participants(business_id,meeting_id,member_id,role) VALUES($1,$2,$3,$4)',[b,mid,p,p===organizer?'organizer':'participant']);await audit(c,b,'meeting_participants',mid,old?{participants:before}:null,{participants:after});}
   await setAccess(c,b,'meetings',mid,old,a);
   if(held==='local_only'&&old?.transcript_custody!=='local_only')await c.query('SELECT zuri_go.begin_meeting_transcript_custody($1::uuid,$2::uuid)',[b,mid]);
 }
 // Anyone but the local operator stores a revision or draft batch of a 'local_only' meeting as a stub (FR-011-010); what is already stored is never rewritten.
 const putRevision=async(r,kind)=>{const rid=id(kind,r.id),mid=id('meeting',r.meetingId),held=custodyFor(mid),prior=(await c.query('SELECT * FROM meeting_revisions WHERE business_id=$1 AND id=$2',[b,rid])).rows[0];
 if(prior){if(![r,custodyRevision({legacy_metadata:r},held).legacy_metadata].some(v=>hash(v)===hash(prior.legacy_metadata)))fail('ห้ามเขียนทับ transcript revision เดิม');return;}
 if(isWithheld(r)&&held!=='local_only')fail('transcript revision นี้ไม่ได้อยู่ในสถานะเก็บไว้ที่เครื่องที่บันทึกการประชุม');
 const row=custodyRevision({meeting_id:mid,kind,parent_revision_id:kind==='review'?id(r.parentRevisionId?'review':'source',r.parentRevisionId||r.sourceId):null,content_hash:r.contentHash||r.reviewHash,source_revision:r.sourceRevision||null,source_cursor:r.sourceCursor||null,source_mode:r.sourceMode||null,segments:r.segments,coverage:r.coverage||null,captured_at:r.capturedAt||r.reviewedAt||new Date().toISOString(),legacy_metadata:r},held);
 const values={...row,segments:JSON.stringify(row.segments)},keys=Object.keys(values);
 try{await c.query(`INSERT INTO meeting_revisions(business_id,id,${keys.join(',')}) VALUES($1,$2,${keys.map((_,i)=>'$'+(i+3)).join(',')})`,[b,rid,...Object.values(values)]);}
 catch(error){if(error.code==='23505')fail('ข้อมูลถูกแก้แล้ว กรุณาโหลด workspace ใหม่',409);throw error;}};
 for(const src of state.sources)await putRevision(src,'source');
 const pending=[...state.reviews];const done=new Set();while(pending.length){const ix=pending.findIndex(r=>!r.parentRevisionId||done.has(r.parentRevisionId));if(ix<0)fail('Review lineage มีวงวน');const [r]=pending.splice(ix,1);await putRevision(r,'review');done.add(r.id);}
 for(const batch of state.batches){const priorBatch=oldBatches.find(r=>r.id===id('batch',batch.id)),receipt=receiptOf(batch,priorBatch),held=custodyFor(id('meeting',batch.meetingId)),kept=priorBatch?priorBatch.legacy_metadata.batch:custodyBatch(batch,held),stub=priorBatch?priorBatch.legacy_metadata.withheld===true:held==='local_only';await upsert(c,b,'meeting_draft_batches',id('batch',batch.id),{meeting_id:id('meeting',batch.meetingId),review_revision_id:id('review',batch.reviewRevisionId),request_id:batch.requestId||batch.id,source_hash:batch.sourceHash,review_hash:batch.reviewHash,mode:batch.modelName?'local_ai':'manual',model_ref:batch.modelName||null,items:JSON.stringify(kept.items),generated_at:batch.generatedAt||new Date().toISOString(),committed_at:receipt?.committedAt||null,commit_key:receipt?.idempotencyKey||null,commit_payload_hash:receipt?receipt.payloadHash||hash(receipt.payload):null,legacy_metadata:{batch:kept,receipt,...(stub?{withheld:true}:{})}});
   for(const mapping of receipt?.mappings||[]){const evidence=kept.items.find(i=>i.proposalId===mapping.proposalId)?.evidence;if(!evidence)fail('Receipt ขาด proposal evidence');await c.query('INSERT INTO meeting_task_links(business_id,batch_id,proposal_id,task_id,review_revision_id,evidence,committed_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(business_id,batch_id,proposal_id) DO NOTHING',[b,id('batch',batch.id),mapping.proposalId,taskId(mapping.taskId),id('review',batch.reviewRevisionId),JSON.stringify(evidence),receipt.committedAt]);}
 }
 const knownTasks=new Set([...existingTasks.map(t=>t.legacy_metadata?.id||t.id),...state.tasks.map(t=>t.id)]),storedEvents=new Set((await c.query("SELECT id FROM change_events WHERE business_id=$1 AND entity_type='legacy_task_event'",[b])).rows.map(r=>r.id));
 // A history event keeps no quote a reference holds in meeting_task_links: the same rule as the task row (WI-12 D14).
 const bareTask=(tid,task,old)=>Array.isArray(task?.sourceRefs)?{...task,sourceRefs:task.sourceRefs.map(ref=>bare(tid,ref,old))}:task;
 const bareEvent=e=>{const d=e.detail;if(!e.taskId||!d||typeof d!=='object')return e;const tid=taskId(e.taskId),old=existingTasks.find(r=>r.id===tid);return {...e,detail:d.proposalId!==undefined&&d.evidence!==undefined?bare(tid,d,old):{...d,...(d.before!==undefined?{before:bareTask(tid,d.before,old)}:{}),...(d.after!==undefined?{after:bareTask(tid,d.after,old)}:{})}};};
 for(const raw of state.events){const event=bareEvent(raw);if(event.taskId&&!knownTasks.has(event.taskId)&&!storedEvents.has(id('event',event.id)))fail('ข้อมูลถูกแก้แล้ว กรุณาโหลด workspace ใหม่',409);const stamped=c.zuriActor?{...event,actor:c.zuriActor.displayName+' · '+c.zuriActor.pid,actorMemberId:c.zuriActor.memberId,actorPid:c.zuriActor.pid,at:new Date().toISOString()}:event;await c.query("INSERT INTO change_events(id,business_id,entity_type,entity_id,event_type,after_data,actor_kind,request_id,occurred_at,actor_member_id,actor_pid,actor_subject) VALUES($1,$2,'legacy_task_event',$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(id) DO NOTHING",[id('event',event.id),b,event.taskId?taskId(event.taskId):b,event.type||'legacy',stamped,c.zuriActor?'authenticated':'local_operator',event.id,stamped.at||new Date().toISOString(),c.zuriActor?.memberId||null,c.zuriActor?.pid||null,c.zuriActor?.pid||null]);}
 await c.query('UPDATE businesses SET legacy_metadata=jsonb_set(legacy_metadata,\'{seedKeys}\',$2::jsonb) WHERE id=$1',[b,JSON.stringify(state.seedKeys)]);
}
export async function saveLegacy(c,b,input){
 if(viewerOf(c).kind==='guest')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
 const current=(await c.query('SELECT * FROM businesses WHERE id=$1 FOR UPDATE',[b])).rows[0];if(Number(input.version)!==Number(current.domain_revision))fail('ข้อมูลถูกแก้แล้ว กรุณาโหลด workspace ใหม่',409);
 let map=new Map();if(input.campaignWorkspace)map=await writeCampaigns(c,b,input.campaignWorkspace);
 if(input.meetingTaskManager)await writeDomain(c,b,input.meetingTaskManager,map,viewerOf(c),{refuseNewReceipts:true});
 await audit(c,b,'workspace',b,null,{domains:[...(input.campaignWorkspace?['campaigns']:[]),...(input.meetingTaskManager?['meetings_tasks_members']:[])]},'save');
 await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);const result=await readLegacy(c,b);if(input.campaignWorkspace?.selected)result.campaignWorkspace.selected=map.get(input.campaignWorkspace.selected)||result.campaignWorkspace.selected;return result;
}
// An active Member's explicit, audited upload of a transcript kept on the recording machine. Every stub must be matched by
// the full content it came from (the stub equals that content with its text removed), so nothing else can be stored through here.
export async function uploadTranscript(c,b,ref,input){
 const viewer=viewerOf(c),names=await meetingNames(c,b),meeting=readable(viewer,await all(c,b,'meetings'),names).find(r=>r.id===ref||r.legacy_metadata?.id===ref);
 if(!meeting)fail('ไม่พบประชุม',404);
 if(viewer.kind!=='member')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
 if(!(await c.query('SELECT 1 FROM meeting_participants WHERE business_id=$1 AND meeting_id=$2 AND member_id=$3',[b,meeting.id,viewer.memberId])).rowCount)fail('เฉพาะผู้เข้าร่วมประชุมอัปโหลด transcript ได้',403);
 if(!(await c.query('SELECT 1 FROM meeting_transcript_upload_eligibility WHERE business_id=$1 AND meeting_id=$2 AND $3::uuid=ANY(eligible_member_ids)',[b,meeting.id,viewer.memberId])).rowCount)fail('เฉพาะผู้เข้าร่วมประชุมที่มีสิทธิ์อัปโหลด transcript ได้',403);
 const reason=String(input?.reason??'').trim();if(!reason)fail('ระบุเหตุผลที่อัปโหลด transcript',422);
 if(meeting.transcript_custody!=='local_only')fail('transcript ของประชุมนี้อยู่บน cloud แล้ว',409);
 const list=v=>new Map((Array.isArray(v)?v:[]).map(d=>[d?.id,d])),sent={source:list(input.sources),review:list(input.reviews)},sentBatches=list(input.batches);
 const revisions=(await c.query('SELECT * FROM meeting_revisions WHERE business_id=$1 AND meeting_id=$2',[b,meeting.id])).rows,stubs=revisions.filter(r=>isWithheld(r.legacy_metadata));
 const stubBatches=(await c.query('SELECT * FROM meeting_draft_batches WHERE business_id=$1 AND meeting_id=$2',[b,meeting.id])).rows.filter(r=>r.legacy_metadata.withheld===true);
 const mismatch=()=>fail('transcript ที่ส่งมาไม่ตรงกับฉบับที่บันทึกไว้');
 if(!stubs.length||sent.source.size+sent.review.size!==stubs.length||sentBatches.size!==stubBatches.length)mismatch();
 for(const row of stubs){const doc=sent[row.kind].get(row.legacy_metadata.id);
  if(!doc||isWithheld(doc)||!Array.isArray(doc.segments)||!doc.segments.length||doc.segments.some(s=>typeof s?.segmentId!=='string'||typeof s.text!=='string'||!Number.isFinite(s.startMs)||!Number.isFinite(s.endMs)||s.startMs<0||s.endMs<s.startMs)||hash(custodyRevision({legacy_metadata:doc},'local_only').legacy_metadata)!==hash(row.legacy_metadata)||(row.kind==='review'&&await reviewHash(doc.id,doc.segments)!==doc.reviewHash))mismatch();}
 const whole=new Map(revisions.filter(r=>!isWithheld(r.legacy_metadata)).map(r=>[r.legacy_metadata.id,r.legacy_metadata]));
 for(const row of stubBatches){const doc=sentBatches.get(row.legacy_metadata.batch.id),review=doc&&(sent.review.get(doc.reviewRevisionId)||whole.get(doc.reviewRevisionId));
  if(!doc||!review||!Array.isArray(doc.items)||hash(custodyBatch(doc,'local_only'))!==hash(row.legacy_metadata.batch))mismatch();
  try{for(const item of doc.items)validateEvidence(review,item.evidence);}catch{mismatch();}}
 const revisionUploads=stubs.map(row=>{const doc=sent[row.kind].get(row.legacy_metadata.id);return {id:row.id,segments:doc.segments,metadata:doc};});
 const batchIds=stubBatches.map(row=>row.legacy_metadata.batch.id);
 await c.query('SELECT zuri_go.complete_meeting_transcript_upload($1::uuid,$2::uuid,$3::text,$4::jsonb,$5::text[])',[b,meeting.id,reason,JSON.stringify(revisionUploads),batchIds]);
 for(const row of stubBatches){const doc=sentBatches.get(row.legacy_metadata.batch.id);await c.query('UPDATE meeting_draft_batches SET items=$3,legacy_metadata=$4 WHERE business_id=$1 AND id=$2',[b,row.id,JSON.stringify(doc.items),{batch:doc,receipt:row.legacy_metadata.receipt}]);}
 return readLegacy(c,b);
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
 const cmap=await writeCampaigns(c,b,backup.campaignWorkspace,true);await writeDomain(c,b,backup.meetingTaskManager,cmap,viewerOf(c),{restore:viewerOf(c).kind==='operator'});
 for(const [kind,items] of [['campaign',backup.campaignWorkspace.campaigns],['member',backup.meetingTaskManager.members],['task',backup.meetingTaskManager.tasks],['meeting',backup.meetingTaskManager.meetings],['source',backup.meetingTaskManager.sources],['review',backup.meetingTaskManager.reviews],['batch',backup.meetingTaskManager.batches]])for(const row of items)await c.query('INSERT INTO migration_keys(business_id,source_namespace,entity_type,legacy_id,batch_id,new_id,source_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[b,report.source_namespace,kind,row.id,id,safeId(b,kind,row.id),hash(row)]);
 await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);
 const after=await readLegacy(c,b);for(let i=0;i<backup.campaignWorkspace.campaigns.length;i++){const before=backup.campaignWorkspace.campaigns[i],next=after.campaignWorkspace.campaigns.find(x=>x.id===cmap.get(before.id));const beforeMetrics=measure(before),afterMetrics=measure(next);for(const key of ['revenue','units','spend','sql'])if(beforeMetrics[key]!==afterMetrics[key])fail('Import reconciliation failed: '+key);}
 validateState(after.meetingTaskManager);await c.query("UPDATE migration_batches SET status='committed',committed_at=now() WHERE business_id=$1 AND id=$2",[b,id]);return {id,report,workspace:after};
}
