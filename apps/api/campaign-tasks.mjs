// The campaign half of FEAT-010 (part P02, DOM-CAM): campaign task details, the Workboard as a view of the task records,
// and campaign.tasks as their projection (SDD-010 "Workboard field mapping").
// @trace implements FR-010-011, FR-010-012, FR-010-013, FR-010-014, FR-010-015
import {fail,audit,allocate} from './service.mjs';
import {viewerOf} from './audience.mjs';
import {createTask,updateTask,readTask,ruleTask,ruleFail} from './tasks.mjs';
import {FROM_WORKBOARD,WORKBOARD_STATUSES,toWorkboardStatus,saveError} from '../web/src/content/shared/task-rules.mjs';

const nil=v=>v===''||v==null?null:v;
const DETAIL_KEYS=['gate','offer','hypothesis','action','estimate','priority','original_status','outcome'];

// Workboard task → task columns and campaign details (pure).
export function workboardFields(w){
  return {
    task:{title:w.title,description:nil(w.description),status:FROM_WORKBOARD[w.status]||'planned',due_date:nil(w.due),owner_label:nil(w.owner?.trim()),dependency_note:nil(w.dependencies),acceptance:nil(w.acceptance),evidence:nil(w.evidence),recheck_date:nil(w.recheck),completion_rule:w.status==='Done'?'workboard':'standard'},
    details:{gate:nil(w.gate),offer:nil(w.offer),hypothesis:nil(w.hypothesis),action:nil(w.action),estimate:w.estimate==null||w.estimate===''?null:Number(w.estimate),priority:['Low','Medium','High'].includes(w.priority)?w.priority:null,original_status:WORKBOARD_STATUSES.includes(w.status)?w.status:null,outcome:nil(w.outcome)},
  };
}
// Task row (+ details) → the Workboard entry of today (pure). Before the backfill (P4) a Workboard task has no details row:
// its legacy entry is kept and only the fields the task record owns are laid over it (SDD-010 Decisions).
export function projectCampaignTask(row,detail=null,rName=''){
  const legacy=row.source_kind==='campaign-legacy'?row.legacy_metadata||{}:{};
  const text=v=>v??'';
  if(!detail&&row.source_kind==='campaign-legacy'){
    const status=FROM_WORKBOARD[legacy.status]===row.status?legacy.status:toWorkboardStatus(row.status,legacy.status);
    return {...legacy,title:row.title,...(row.description!=null||'description' in legacy?{description:text(row.description)}:{}),due:text(row.due_date),status};
  }
  const d=detail||{},entry={...legacy,id:legacy.id||row.id,title:row.title,status:toWorkboardStatus(row.status,d.original_status),owner:row.owner_label??rName??'',due:text(row.due_date),priority:d.priority||'Medium',offer:text(d.offer),gate:text(d.gate),hypothesis:text(d.hypothesis),action:text(d.action),dependencies:text(row.dependency_note),estimate:d.estimate==null?null:Number(d.estimate),acceptance:text(row.acceptance),evidence:text(row.evidence),recheck:text(row.recheck_date),outcome:text(d.outcome)};
  if(row.description!=null||'description' in legacy)entry.description=text(row.description);
  return entry;
}
export const projectCampaignTasks=(rows,details=new Map(),names=new Map())=>rows.map(r=>projectCampaignTask(r,details.get(r.id)||null,names.get(r.id)||''));

function cleanDetails(d){
  if(d==null)return null;
  if(typeof d!=='object'||Array.isArray(d))ruleFail('FIELD_INVALID',422,'รายละเอียดแคมเปญไม่ถูกต้อง');
  const unknown=Object.keys(d).filter(k=>!DETAIL_KEYS.includes(k));if(unknown.length)ruleFail('FIELD_UNKNOWN',422,'ข้อมูลไม่รองรับ: '+unknown.join(', '));
  const out={};for(const k of DETAIL_KEYS)out[k]=k==='estimate'?(d[k]==null||d[k]===''?null:Number(d[k])):nil(typeof d[k]==='string'?d[k].trim():d[k]);
  if(out.estimate!=null&&!Number.isFinite(out.estimate))ruleFail('FIELD_INVALID',422,'ประมาณการต้องเป็นตัวเลข');
  if(out.priority!=null&&!['Low','Medium','High'].includes(out.priority))ruleFail('FIELD_INVALID',422,'priority ต้องเป็น Low, Medium หรือ High');
  if(out.original_status!=null&&!WORKBOARD_STATUSES.includes(out.original_status))ruleFail('FIELD_INVALID',422,'สถานะ Workboard ไม่ถูกต้อง');
  return out;
}
async function writeDetails(c,b,taskId,details,before){
  const keys=DETAIL_KEYS;
  await c.query(`INSERT INTO campaign_task_details(business_id,task_id,${keys.join(',')}) VALUES($1,$2,${keys.map((_,i)=>'$'+(i+3)).join(',')}) ON CONFLICT(business_id,task_id) DO UPDATE SET ${keys.map(k=>`${k}=EXCLUDED.${k}`).join(',')}`,[b,taskId,...keys.map(k=>details[k])]);
  await audit(c,b,'campaign_task_details',taskId,before,details,before?'update':'create');
}

// POST /campaigns/:campaignId/tasks and PATCH …/:taskId: the task through the task contract and its details in the same
// transaction; either failing rolls back both (AC-010-012-01, AC-010-014-03).
export async function saveCampaignTask(c,b,campaignId,input,viewer=viewerOf(c),taskId=null){
  if(viewer.kind==='guest')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
  if(!(await c.query('SELECT 1 FROM campaigns WHERE business_id=$1 AND id=$2',[b,campaignId])).rowCount)fail('ไม่พบแคมเปญ',404);
  if(!input||typeof input!=='object'||Array.isArray(input))ruleFail('BODY_INVALID',422,'ข้อมูลไม่ถูกต้อง');
  const {details:raw,...rest}=input,details=cleanDetails(raw);
  if('campaign_id' in rest&&rest.campaign_id!==campaignId)ruleFail('CONTEXT_CONFLICT');
  if(!taskId){
    if(rest.status==='done'&&details?.gate&&!rest.recheck_date)ruleFail('RECHECK_REQUIRED');
    const task=await createTask(c,b,{...rest,campaign_id:campaignId},viewer);
    if(details){const stored=(await c.query('SELECT * FROM campaign_task_details WHERE business_id=$1 AND task_id=$2',[b,task.id])).rows[0];if(!stored)await writeDetails(c,b,task.id,details,null);}
    return readTask(c,b,task.id,viewer);
  }
  const before=await readTask(c,b,taskId,viewer);if(before.campaign_id!==campaignId)fail('ไม่พบงาน',404);
  // Details first, so the completion rule sees the gate being saved (FR-010-007 AC-02).
  if(details)await writeDetails(c,b,taskId,details,before.details);
  return updateTask(c,b,taskId,{...rest},viewer,{campaign:true});
}

// PUT /workspace, campaign half: an old or current client saves a Workboard entry. The record is found, never duplicated;
// a task the Task Manager owns keeps its identity, and a Workboard task gets its details (FR-010-011, FR-010-013 AC-05).
export async function writeWorkboardEntry(c,b,campaignRowId,entry,{initial=false,safeId}){
  const legacyId=safeId(b,'campaign-task',campaignRowId+':'+entry.id);
  let row=(await c.query('SELECT * FROM tasks WHERE business_id=$1 AND id=$2',[b,legacyId])).rows[0];
  if(!row&&/^[0-9a-f-]{36}$/i.test(entry.id))row=(await c.query("SELECT * FROM tasks WHERE business_id=$1 AND id=$2 AND campaign_id=$3 AND source_kind<>'campaign-legacy'",[b,entry.id,campaignRowId])).rows[0];
  const {task:fields,details}=workboardFields(entry),id=row?.id||legacyId;
  const detailRow=row&&(await c.query('SELECT * FROM campaign_task_details WHERE business_id=$1 AND task_id=$2',[b,id])).rows[0];
  // A Workboard entry that leaves Backlog/Ready order unchanged keeps its lane; a new completion follows FR-010-007.
  const status=row&&FROM_WORKBOARD[entry.status]===row.status?row.status:fields.status;
  // A Workboard task Done before the change was completed under the Workboard rule (AC-010-007-03); the backfill (P4) records it.
  const completion=initial?fields.completion_rule:row?.status==='done'&&status==='done'?(row.source_kind==='campaign-legacy'&&!detailRow?'workboard':row.completion_rule):'standard';
  if(!initial&&status==='done'&&row?.status!=='done'){
    const roles=(await c.query('SELECT member_id,role,confirmation FROM task_roles WHERE business_id=$1 AND task_id=$2',[b,id])).rows;
    const t={title:fields.title,status,blocker:row?.blocker,roles:{R:roles.find(r=>r.role==='R')?.member_id||null,A:roles.find(r=>r.role==='A')?.member_id||null,A_confirmed:roles.some(r=>r.role==='A'&&r.confirmation==='confirmed'),C:[],I:[]},acceptance:fields.acceptance,acceptance_proposed:row?.acceptance_proposed||false,evidence:fields.evidence,kpi_note:row?.kpi_note,recheck_date:fields.recheck_date,campaign_id:campaignRowId,due_date:fields.due_date,details,completion_rule:'standard'};
    const e=saveError({status:row?.status||'planned'},ruleTask(t));if(e)ruleFail(e);
  }
  const values={title:fields.title,description:fields.description,status,status_confirmed:true,due_date:fields.due_date,dependency_note:fields.dependency_note,acceptance:fields.acceptance,evidence:fields.evidence,recheck_date:fields.recheck_date,completion_rule:completion};
  if(!row||row.source_kind==='campaign-legacy')Object.assign(values,{campaign_id:campaignRowId,source_kind:'campaign-legacy',owner_label:fields.owner_label,legacy_metadata:entry});
  else if(!(await c.query("SELECT 1 FROM task_roles WHERE business_id=$1 AND task_id=$2 AND role='R'",[b,id])).rowCount)values.owner_label=fields.owner_label;
  const keys=Object.keys(values);
  if(row)await c.query(`UPDATE tasks SET ${keys.map((k,i)=>`${k}=$${i+3}`).join(',')} WHERE business_id=$1 AND id=$2`,[b,id,...Object.values(values)]);
  else{values.code=await allocate(c,b,'tasks');const k2=Object.keys(values);await c.query(`INSERT INTO tasks(business_id,id,${k2.join(',')}) VALUES($1,$2,${k2.map((_,i)=>'$'+(i+3)).join(',')})`,[b,id,...Object.values(values)]);}
  const same=detailRow&&DETAIL_KEYS.every(k=>String(detailRow[k]??'')===String(details[k]??''));
  if(!same)await writeDetails(c,b,id,details,detailRow||null);
  return id;
}
