// Server-side meeting commit (PLAN-002 WI-09, SDD-004 amendment "Server-side meeting commit"): the server, not the client, turns the
// choices on a stored draft batch into tasks, a receipt, evidence links and history, in one transaction.
// @trace implements FR-011-009, FR-011-010
import {hash,fail,audit} from './service.mjs';
import {viewerOf} from './audience.mjs';
import {readLegacy,writeDomain,safeId} from './workspace.mjs';
import {commitBatch,canonicalChoices,isBatchStale} from '../web/src/content/meeting/model.mjs';
import {meetingAudience} from '../web/src/content/shared/visibility.mjs';

const refuse=(message,status,code)=>{throw Object.assign(Error(message),{status,code});};
// The receipt as this viewer may see it: task IDs and mappings the viewer cannot read are left out (as readLegacy withholds receipts).
const visible=(receipt,domain)=>{const shown=new Set(domain.tasks.map(t=>t.id));return {...receipt,taskIds:receipt.taskIds.filter(id=>shown.has(id)),mappings:receipt.mappings.filter(m=>shown.has(m.taskId))};};

// input: {meetingId,batchId,reviewRevisionId,reviewHash,sourceHash,choices}. The request carries no key, task IDs, audience, receipt or payload hash.
// Caller: api.mjs, inside a transaction that already resolved the viewer (and, hosted, required a Member).
export async function commitMeeting(c,b,input,viewer=viewerOf(c)){
 if(viewer.kind==='guest')refuse('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401,'AUTH_REQUIRED');
 if(!input||typeof input!=='object'||Array.isArray(input)||typeof input.meetingId!=='string'||typeof input.batchId!=='string'||!Array.isArray(input.choices)||input.choices.some(x=>!x||typeof x!=='object'||Array.isArray(x)))fail('ข้อมูลการสร้างงานจากประชุมไม่ถูกต้อง');
 // The local operator does not go through authorizeWrite, so the lock is taken here; a second request waits for the first.
 await c.query('SELECT id FROM businesses WHERE id=$1 FOR UPDATE',[b]);
 const workspace=await readLegacy(c,b,viewer),domain=workspace.meetingTaskManager;
 // What this viewer cannot read does not exist for them: a hidden meeting or batch answers like a missing one.
 const meeting=domain.meetings.find(m=>m.id===input.meetingId);if(!meeting)fail('ไม่พบประชุม',404);
 const batch=domain.batches.find(x=>x.id===input.batchId&&x.meetingId===meeting.id);if(!batch)fail('ไม่พบร่างงาน',404);
 const payloadHash=hash(JSON.parse(canonicalChoices(input.choices))),stored=(await c.query('SELECT legacy_metadata FROM meeting_draft_batches WHERE business_id=$1 AND id=$2',[b,safeId(b,'batch',batch.id)])).rows[0]?.legacy_metadata.receipt;
 if(stored){
  // A receipt from the server compares the canonical hash; one from the old client compares its plain payload (WI-09).
  const same=stored.origin==='server'?stored.payloadHash===payloadHash:stored.payload===JSON.stringify(input.choices);
  if(!same)refuse('ร่างนี้เคยบันทึกแล้วด้วยรายละเอียดต่างกัน',409,'COMMIT_CONFLICT');
  return {receipt:visible(stored,domain),replayed:true,workspace};
 }
 if(input.reviewRevisionId!==batch.reviewRevisionId||input.reviewHash!==batch.reviewHash||input.sourceHash!==batch.sourceHash||isBatchStale(domain,batch))refuse('ร่างเก่าใช้สร้างงานไม่ได้ กรุณาตรวจฉบับใหม่',409,'STALE_BATCH');
 for(const choice of input.choices)if(['link','update'].includes(choice.mode)&&choice.taskId){
  const task=domain.tasks.find(t=>t.id===choice.taskId);if(!task)fail('ไม่พบงาน',404);
  if(choice.taskVersion!=null&&task.version!==choice.taskVersion)refuse('ข้อมูลถูกแก้แล้ว กรุณาโหลดใหม่',409,'VERSION_CONFLICT');
 }
 // The pure rules of the client run on this scratch copy of the viewer's readable state; the audience comes from the stored meeting, never from the request.
 try{commitBatch(domain,batch.id,input.choices,payloadHash,{audience:meetingAudience(meeting,meeting.participantIds||[]),allowStub:true});}
 catch(e){if(e.status||e instanceof TypeError||e instanceof RangeError)throw e;throw Object.assign(e,{status:422});}
 const receipt=domain.receipts.find(r=>r.batchId===batch.id);Object.assign(receipt,{origin:'server',payload:canonicalChoices(input.choices)});
 // The existing write path stores the tasks (TSK code, roles, viewers, week entry, events), the receipt, the batch's commit key and the links.
 await writeDomain(c,b,domain,new Map(),viewer);
 await audit(c,b,'meetings',safeId(b,'meeting',meeting.id),null,{batchId:batch.id,receiptId:receipt.id,taskIds:receipt.taskIds,mappings:receipt.mappings},'commit');
 await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);
 const saved=await readLegacy(c,b,viewer);
 return {receipt:visible(receipt,saved.meetingTaskManager),replayed:false,workspace:saved};
}
