// The task contract of FEAT-010 (SDD-010 "API contract"): per-task create, read, update and list for every department.
// @trace implements FR-010-001, FR-010-002, FR-010-004, FR-010-005, FR-010-006, FR-010-007, FR-010-008, FR-010-009, FR-010-010
import {randomUUID} from 'node:crypto';
import {fail,audit,allocate,hash} from './service.mjs';
import {viewerOf,taskNames,projectNames,readable} from './audience.mjs';
import {CHANGE_ERRORS} from './workspace.mjs';
import {canRead,visibilityChange,validLevel,DEFAULT_VISIBILITY} from '../web/src/content/shared/visibility.mjs';
import {saveError,contextError,onBoard,idempotencyOutcome,TASK_STATUSES,RULE_MESSAGES} from '../web/src/content/shared/task-rules.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,DATE=/^\d{4}-\d{2}-\d{2}$/;
const TEXT=['title','description','deliverable','acceptance','evidence','blocker','kpi_note','dependency_note'],DATES=['due_date','recheck_date'],CONTEXTS=['campaign_id','project_id','team_id','content_item_id','goal_id'];
export const TASK_FIELDS=[...TEXT,...DATES,...CONTEXTS,'status','acceptance_proposed','visibility','viewer_ids','roles'];
export const CAMPAIGN_ONLY=['details','gate','offer','hypothesis','action','estimate','priority','original_status','outcome'];
const IGNORED=['actor','memberId','pid','actor_member_id','actor_pid'];
export const ruleFail=(code,status=422,message=RULE_MESSAGES[code]||code)=>{throw Object.assign(Error(message),{status,code});};
const accessFail=error=>{const [message,status]=CHANGE_ERRORS[error];ruleFail(error,status,message);};

// Unknown fields are refused and identity fields ignored (FR-010-009 AC-06, FR-010-010 AC-02).
export function cleanInput(input,allowed,{campaign=false}={}){
  if(!input||typeof input!=='object'||Array.isArray(input))ruleFail('BODY_INVALID',422,'ข้อมูลไม่ถูกต้อง');
  const data={};
  for(const [k,v] of Object.entries(input)){
    if(IGNORED.includes(k))continue;
    if(!campaign&&CAMPAIGN_ONLY.includes(k))ruleFail('CAMPAIGN_FIELD',422,'ข้อมูลของแคมเปญบันทึกผ่านงานของแคมเปญเท่านั้น');
    if(!allowed.includes(k))ruleFail('FIELD_UNKNOWN',422,'ข้อมูลไม่รองรับ: '+k);
    data[k]=v;
  }
  for(const k of TEXT)if(k in data){if(data[k]!=null&&typeof data[k]!=='string')ruleFail('FIELD_INVALID',422,'รูปแบบ '+k+' ไม่ถูกต้อง');data[k]=data[k]?.trim()||null;}
  for(const k of DATES)if(k in data&&data[k]!=null&&data[k]!==''&&!DATE.test(data[k]))ruleFail('FIELD_INVALID',422,'วันที่ไม่ถูกต้อง: '+k);
  for(const k of DATES)if(data[k]==='')data[k]=null;
  for(const k of CONTEXTS)if(k in data){data[k]=data[k]||null;if(data[k]&&!UUID.test(data[k]))ruleFail('FIELD_INVALID',422,'รหัสอ้างอิงไม่ถูกต้อง: '+k);}
  if('status' in data&&!TASK_STATUSES.includes(data.status))ruleFail('STATUS_INVALID');
  if('acceptance_proposed' in data&&typeof data.acceptance_proposed!=='boolean')ruleFail('FIELD_INVALID',422,'รูปแบบ acceptance_proposed ไม่ถูกต้อง');
  if('visibility' in data&&!validLevel(data.visibility))ruleFail('LEVEL_INVALID',422,CHANGE_ERRORS.LEVEL_INVALID[0]);
  if('viewer_ids' in data&&(!Array.isArray(data.viewer_ids)||data.viewer_ids.some(v=>!UUID.test(v))))ruleFail('FIELD_INVALID',422,'รายชื่อผู้มองเห็นไม่ถูกต้อง');
  if('roles' in data){const r=data.roles;if(!r||typeof r!=='object'||['R','A'].some(k=>r[k]!=null&&!UUID.test(r[k]))||['C','I'].some(k=>r[k]!=null&&(!Array.isArray(r[k])||r[k].some(v=>!UUID.test(v)))))ruleFail('FIELD_INVALID',422,'RACI ไม่ถูกต้อง');}
  return data;
}

async function rolesOf(c,b){const map=new Map();for(const r of (await c.query('SELECT task_id,member_id,role,confirmation FROM task_roles WHERE business_id=$1',[b])).rows){if(!map.has(r.task_id))map.set(r.task_id,{R:null,A:null,A_confirmed:false,C:[],I:[]});const x=map.get(r.task_id);if(r.role==='R'||r.role==='A')x[r.role]=r.member_id;else x[r.role].push(r.member_id);if(r.role==='A')x.A_confirmed=r.confirmation==='confirmed';}return map;}
const noRoles=()=>({R:null,A:null,A_confirmed:false,C:[],I:[]});
// Rule view of a task for task-rules.mjs.
export const ruleTask=t=>({title:t.title,status:t.status,blocker:t.blocker,responsibleId:t.roles.R,accountableId:t.roles.A,accountableConfirmed:t.roles.A_confirmed,acceptance:t.acceptance,acceptanceProposed:t.acceptance_proposed,evidence:t.evidence,kpi:t.kpi_note,recheckDate:t.recheck_date,campaignId:t.campaign_id,dueDate:t.due_date,details:t.details||null,completionRule:t.completion_rule,projectId:t.project_id,teamId:t.team_id,contentItemId:t.content_item_id,goalId:t.goal_id});

// Everything a viewer may see of the tasks; a project the viewer cannot read is served without its code and name (AC-010-002-05).
export async function loadTasks(c,b,viewer=viewerOf(c)){
  const rows=readable(viewer,(await c.query('SELECT * FROM tasks WHERE business_id=$1',[b])).rows,await taskNames(c,b));
  const roles=await rolesOf(c,b),viewers=new Map();for(const v of (await c.query('SELECT task_id,member_id FROM task_viewers WHERE business_id=$1',[b])).rows){if(!viewers.has(v.task_id))viewers.set(v.task_id,[]);viewers.get(v.task_id).push(v.member_id);}
  const projects=new Map(readable(viewer,(await c.query('SELECT id,code,name,visibility,team_id,owner_member_id FROM projects WHERE business_id=$1',[b])).rows,await projectNames(c,b)).map(p=>[p.id,p]));
  const details=new Map((await c.query('SELECT * FROM campaign_task_details WHERE business_id=$1',[b])).rows.map(d=>[d.task_id,d]));
  return rows.map(r=>present(r,roles.get(r.id)||noRoles(),(viewers.get(r.id)||[]).sort(),projects.get(r.project_id)||null,details.get(r.id)||null));
}
function present(r,roles,viewerIds,project,details){
  const t={id:r.id,code:r.code,title:r.title,row_version:Number(r.row_version),source_kind:r.source_kind,visibility:r.visibility,archived_at:r.archived_at||null,roles,viewer_ids:viewerIds,created_at:r.created_at,updated_at:r.updated_at};
  for(const k of [...TEXT,...DATES,...CONTEXTS,'status','status_confirmed','acceptance_proposed','project_label','owner_label','completion_rule'])t[k]=r[k]??null;
  // Until the backfill (P4), a Workboard task already Done counts as completed under the Workboard rule (AC-010-007-03).
  if(r.source_kind==='campaign-legacy'&&!details&&r.status==='done'&&r.completion_rule==='standard')t.completion_rule='workboard';
  t.project=project&&{id:project.id,code:project.code,name:project.name};
  if(details){const {business_id,task_id,created_at,updated_at,row_version,...d}=details;t.details={...d,estimate:d.estimate==null?null:Number(d.estimate)};}else t.details=null;
  return t;
}
export async function readTask(c,b,id,viewer=viewerOf(c)){
  if(!UUID.test(id||''))fail('ไม่พบงาน',404);
  const task=(await loadTasks(c,b,viewer)).find(t=>t.id===id);
  if(!task)fail('ไม่พบงาน',404);return task;
}
export async function listTasks(c,b,query={},viewer=viewerOf(c)){
  const kind=query.board||'all';
  if(!['all','campaign','project','team','unlinked','mine'].includes(kind))ruleFail('BOARD_INVALID',422,'ไม่รู้จักบอร์ดนี้');
  if(kind==='mine'&&viewer.kind!=='member')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
  const id={campaign:query.campaign_id,project:query.project_id,team:query.team_id}[kind];
  let tasks=(await loadTasks(c,b,viewer)).filter(t=>onBoard(ruleTask(t),{kind,id},viewer.memberId));
  if(query.status)tasks=tasks.filter(t=>t.status===query.status);
  return {tasks};
}

// Contexts must exist in this Business, be readable (projects) and not contradict each other (FR-010-002).
async function checkContexts(c,b,before,after,viewer){
  const one=async(sql,id)=>id?(await c.query(sql,[b,id])).rows[0]||ruleFail('CONTEXT_NOT_FOUND',422,'ไม่พบบริบทที่เลือกในธุรกิจนี้'):null;
  await one('SELECT id FROM campaigns WHERE business_id=$1 AND id=$2',after.campaign_id);
  if(after.project_id&&after.project_id!==before?.project_id){const p=await one('SELECT id,visibility,team_id,owner_member_id FROM projects WHERE business_id=$1 AND id=$2',after.project_id);if(!canRead(viewer,p,(await projectNames(c,b)).get(p.id)||[]))ruleFail('CONTEXT_NOT_FOUND',422,'ไม่พบบริบทที่เลือกในธุรกิจนี้');}
  if(after.team_id&&after.team_id!==before?.team_id){const t=await one('SELECT archived_at FROM teams WHERE business_id=$1 AND id=$2',after.team_id);if(t.archived_at)ruleFail('TEAM_ARCHIVED',422,'เลือกฝ่ายที่ยังใช้งานอยู่');}
  const contentItem=await one('SELECT campaign_id FROM content_items WHERE business_id=$1 AND id=$2',after.content_item_id),goal=await one('SELECT campaign_id FROM goals WHERE business_id=$1 AND id=$2',after.goal_id);
  const e=contextError({campaignId:after.campaign_id},{contentItem,goal});if(e)ruleFail(e);
}
async function checkPeople(c,b,ids){
  const wanted=[...new Set(ids.filter(Boolean))];if(!wanted.length)return;
  const found=(await c.query('SELECT id FROM members WHERE business_id=$1 AND id=ANY($2::uuid[])',[b,wanted])).rows.length;
  if(found!==wanted.length)ruleFail('MEMBER_NOT_FOUND',422,'ไม่พบสมาชิกที่อ้างอิงในธุรกิจนี้');
}
// A new R, A, C or I must be Active; a role the task already had with that Member is kept (WI-12 D2). Viewers are access, not work.
async function checkActive(c,b,before,after){
  const roleIds=t=>[['R',[t?.roles.R]],['A',[t?.roles.A]],['C',t?.roles.C||[]],['I',t?.roles.I||[]]].flatMap(([role,ids])=>ids.filter(Boolean).map(id=>role+':'+id));
  const had=new Set(roleIds(before)),added=[...new Set(roleIds(after).filter(x=>!had.has(x)).map(x=>x.slice(2)))];
  if(added.length&&(await c.query("SELECT 1 FROM members WHERE business_id=$1 AND id=ANY($2::uuid[]) AND status='inactive'",[b,added])).rowCount)ruleFail('MEMBER_INACTIVE');
}
const named=t=>[t.roles.R,t.roles.A,...t.roles.C,...t.roles.I,...t.viewer_ids].filter(Boolean);
async function writePeople(c,b,id,before,after){
  if(!before||JSON.stringify(before.roles)!==JSON.stringify(after.roles)){
    await c.query('DELETE FROM task_roles WHERE business_id=$1 AND task_id=$2',[b,id]);
    for(const [role,people] of [['R',[after.roles.R]],['A',[after.roles.A]],['C',after.roles.C],['I',after.roles.I]])for(const m of [...new Set(people.filter(Boolean))])await c.query('INSERT INTO task_roles(business_id,task_id,member_id,role,confirmation) VALUES($1,$2,$3,$4,$5)',[b,id,m,role,role==='A'&&after.roles.A_confirmed?'confirmed':'proposed']);
  }
  if(!before||JSON.stringify(before.viewer_ids)!==JSON.stringify(after.viewer_ids)){
    await c.query('DELETE FROM task_viewers WHERE business_id=$1 AND task_id=$2',[b,id]);
    for(const m of after.viewer_ids)await c.query('INSERT INTO task_viewers(business_id,task_id,member_id,added_by_member_id) VALUES($1,$2,$3,$4)',[b,id,m,c.zuriActor?.memberId||null]);
    if(before)await audit(c,b,'task_viewers',id,{viewerIds:before.viewer_ids},{viewerIds:after.viewer_ids});
  }
}
const COLUMNS=[...TEXT,...DATES,...CONTEXTS,'status','acceptance_proposed','completion_rule'];

export async function createTask(c,b,input,viewer=viewerOf(c),{source='manual'}={}){
  if(viewer.kind==='guest')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
  const data=cleanInput(input,[...TASK_FIELDS,'idempotency_key']);
  if(!UUID.test(data.idempotency_key||''))ruleFail('IDEMPOTENCY_KEY_REQUIRED',422,'ต้องมี idempotency key');
  const key=data.idempotency_key;delete data.idempotency_key;const payloadHash=hash(data);
  const existing=(await c.query('SELECT id,idempotency_hash FROM tasks WHERE business_id=$1 AND idempotency_key=$2',[b,key])).rows[0];
  const outcome=idempotencyOutcome(existing,payloadHash);
  if(outcome==='replay')return readTask(c,b,existing.id,viewer);
  if(outcome==='conflict')ruleFail('IDEMPOTENCY_CONFLICT',409,'รหัสคำขอนี้ใช้กับข้อมูลอื่นแล้ว กรุณาโหลดใหม่');
  const after={title:data.title,status:data.status||'planned',completion_rule:'standard',visibility:data.visibility||DEFAULT_VISIBILITY,roles:{...noRoles(),...(data.roles||{})},viewer_ids:[...new Set(data.viewer_ids||[])].sort(),details:null};
  for(const k of COLUMNS)if(!(k in after))after[k]=data[k]??(k==='acceptance_proposed'?false:null);
  after.roles.C=[...new Set(after.roles.C||[])];after.roles.I=[...new Set(after.roles.I||[])];after.roles.A_confirmed=!!after.roles.A_confirmed&&!!after.roles.A;
  const e=saveError(null,ruleTask(after));if(e)ruleFail(e);
  await checkContexts(c,b,null,after,viewer);await checkPeople(c,b,named(after));await checkActive(c,b,null,after);
  const access=visibilityChange(viewer,null,{visibility:after.visibility,team_id:after.team_id},{named:named(after)});if(access.error)accessFail(access.error);
  const id=randomUUID(),code=await allocate(c,b,'tasks'),values={...Object.fromEntries(COLUMNS.map(k=>[k,after[k]])),code,visibility:after.visibility,status_confirmed:true,source_kind:source,idempotency_key:key,idempotency_hash:payloadHash};
  const keys=Object.keys(values);
  // No RETURNING: a restricted task is readable only once its people exist (SDD-011 "Write order").
  try{await c.query(`INSERT INTO tasks(business_id,id,${keys.join(',')}) VALUES($1,$2,${keys.map((_,i)=>'$'+(i+3)).join(',')})`,[b,id,...Object.values(values)]);}
  catch(err){if(err.code==='23505'&&/idempotency/.test(err.constraint||''))ruleFail('IDEMPOTENCY_CONFLICT',409,'รหัสคำขอนี้ถูกใช้พร้อมกัน กรุณาลองใหม่');throw err;}
  await writePeople(c,b,id,null,after);
  await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);
  const task=await readTask(c,b,id,viewer);await audit(c,b,'tasks',id,null,task,'create');return task;
}

export async function updateTask(c,b,id,input,viewer=viewerOf(c),{campaign=false}={}){
  if(viewer.kind==='guest')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
  const data=cleanInput(input,[...TASK_FIELDS,'row_version','visibility_reason']);
  const before=await readTask(c,b,id,viewer);
  await c.query('SELECT id FROM tasks WHERE business_id=$1 AND id=$2 FOR UPDATE',[b,id]);
  if(Number(data.row_version)!==before.row_version)ruleFail('STALE',409,'ข้อมูลถูกแก้แล้ว กรุณาโหลดใหม่');
  if(!campaign&&before.source_kind==='campaign-legacy'&&!before.details&&('campaign_id' in data)&&data.campaign_id!==before.campaign_id)ruleFail('CAMPAIGN_FIELD',422,'ย้ายงานของ Workboard ออกจากแคมเปญผ่านหน้าแคมเปญ');
  const after={...structuredClone(before)};
  for(const k of COLUMNS)if(k in data)after[k]=data[k];
  if('visibility' in data)after.visibility=data.visibility;
  if('roles' in data)after.roles={...noRoles(),...data.roles,C:[...new Set(data.roles.C||[])],I:[...new Set(data.roles.I||[])]};
  after.roles.A_confirmed=!!after.roles.A_confirmed&&!!after.roles.A;
  if('viewer_ids' in data)after.viewer_ids=[...new Set(data.viewer_ids)].sort();
  // A Workboard completion is kept until the task leaves Done; a new completion is a standard one (AC-010-007-04).
  after.completion_rule=after.status==='done'&&before.status==='done'?before.completion_rule:'standard';
  const e=saveError(ruleTask(before),ruleTask(after));if(e)ruleFail(e);
  await checkContexts(c,b,before,after,viewer);await checkPeople(c,b,named(after));await checkActive(c,b,before,after);
  const changed=after.visibility!==before.visibility||after.team_id!==before.team_id;
  if(changed||after.visibility==='restricted'){
    const access=visibilityChange(viewer,{visibility:before.visibility,team_id:before.team_id},{visibility:after.visibility,team_id:after.team_id},{accountableId:before.roles.A||after.roles.A,reason:data.visibility_reason,named:named(after)});
    if(access.error&&(changed||access.error==='NAMED_REQUIRED'))accessFail(access.error);
  }
  // The people first, then one UPDATE carrying the fields and the new audience, so the row version rises by one
  // (AC-010-009-04) and the new row is readable when the read policy checks it (SDD-011 "Write order").
  await writePeople(c,b,id,before,after);
  const set=[...COLUMNS.filter(k=>k!=='team_id'&&after[k]!==before[k]),...(changed?['visibility','team_id']:[])];
  const updated=await c.query(`UPDATE tasks SET ${set.length?set.map((k,i)=>`${k}=$${i+3}`).join(','):'status=status'} WHERE business_id=$1 AND id=$2`,[b,id,...set.map(k=>after[k])]);
  if(updated.rowCount!==1)ruleFail('SELF_EXCLUDED',422,'เปลี่ยนการมองเห็นก่อน แล้วจึงนำตัวเองออกจากงานนี้');
  if(changed)await audit(c,b,'task_visibility',id,{visibility:before.visibility,team_id:before.team_id},{visibility:after.visibility,team_id:after.team_id,reason:data.visibility_reason?.trim()||null});
  await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);
  const task=await readTask(c,b,id,viewer);await audit(c,b,'tasks',id,before,task);return task;
}

export async function archiveTask(c,b,id,viewer=viewerOf(c)){
  if(viewer.kind==='guest')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
  const before=await readTask(c,b,id,viewer);
  if(before.archived_at)return before;
  const row=(await c.query('UPDATE tasks SET archived_at=now() WHERE business_id=$1 AND id=$2 RETURNING id',[b,id])).rows[0];
  if(!row)fail('ไม่พบงาน',404);
  await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);
  const after=await readTask(c,b,id,viewer);await audit(c,b,'tasks',id,before,after,'archive');return after;
}
