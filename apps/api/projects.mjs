// Projects (FR-010-003, FR-010-004): work outside a campaign, with a PRJ-nnnn code, an owner Member and the audience of FR-011-004.
// @trace implements FR-010-003, FR-010-004
import {randomUUID} from 'node:crypto';
import {fail,audit,allocate} from './service.mjs';
import {viewerOf,projectNames,readable} from './audience.mjs';
import {ruleFail,loadTasks} from './tasks.mjs';
import {CHANGE_ERRORS} from './workspace.mjs';
import {visibilityChange,validLevel,DEFAULT_VISIBILITY} from '../web/src/content/shared/visibility.mjs';
import {projectError,TASK_STATUSES} from '../web/src/content/shared/task-rules.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,DATE=/^\d{4}-\d{2}-\d{2}$/;
const FIELDS=['name','description','status','owner_member_id','team_id','planned_start','planned_end','visibility','viewer_ids'];
const COLUMNS=['name','description','status','owner_member_id','planned_start','planned_end'];
const IGNORED=['actor','memberId','pid'];

function clean(input,allowed){
  if(!input||typeof input!=='object'||Array.isArray(input))ruleFail('BODY_INVALID',422,'ข้อมูลไม่ถูกต้อง');
  const data={};
  for(const [k,v] of Object.entries(input)){if(IGNORED.includes(k))continue;if(!allowed.includes(k))ruleFail('FIELD_UNKNOWN',422,'ข้อมูลไม่รองรับ: '+k);data[k]=v;}
  for(const k of ['name','description'])if(k in data){if(data[k]!=null&&typeof data[k]!=='string')ruleFail('FIELD_INVALID',422,'รูปแบบ '+k+' ไม่ถูกต้อง');data[k]=k==='name'?(data[k]??'').trim():data[k]?.trim()||null;}
  for(const k of ['planned_start','planned_end'])if(k in data){data[k]=data[k]||null;if(data[k]&&!DATE.test(data[k]))ruleFail('FIELD_INVALID',422,'วันที่ไม่ถูกต้อง: '+k);}
  for(const k of ['owner_member_id','team_id'])if(k in data){data[k]=data[k]||null;if(data[k]&&!UUID.test(data[k]))ruleFail('FIELD_INVALID',422,'รหัสอ้างอิงไม่ถูกต้อง: '+k);}
  if('visibility' in data&&!validLevel(data.visibility))ruleFail('LEVEL_INVALID',422,CHANGE_ERRORS.LEVEL_INVALID[0]);
  if('viewer_ids' in data&&(!Array.isArray(data.viewer_ids)||data.viewer_ids.some(v=>!UUID.test(v))))ruleFail('FIELD_INVALID',422,'รายชื่อผู้มองเห็นไม่ถูกต้อง');
  return data;
}
async function loadProjects(c,b,viewer){
  const names=await projectNames(c,b),rows=readable(viewer,(await c.query('SELECT * FROM projects WHERE business_id=$1 ORDER BY code',[b])).rows,names);
  const viewers=new Map();for(const v of (await c.query('SELECT project_id,member_id FROM project_viewers WHERE business_id=$1',[b])).rows){if(!viewers.has(v.project_id))viewers.set(v.project_id,[]);viewers.get(v.project_id).push(v.member_id);}
  return rows.map(p=>({...p,row_version:Number(p.row_version),viewer_ids:(viewers.get(p.id)||[]).sort()}));
}
export async function listProjects(c,b,viewer=viewerOf(c)){return {projects:await loadProjects(c,b,viewer)};}
// A project's page: the tasks the viewer may read and how many are in each status (AC-010-003-05).
export async function readProject(c,b,id,viewer=viewerOf(c)){
  const project=UUID.test(id||'')&&(await loadProjects(c,b,viewer)).find(p=>p.id===id);if(!project)fail('ไม่พบโปรเจกต์',404);
  const tasks=(await loadTasks(c,b,viewer)).filter(t=>t.project_id===id);
  return {project,tasks,counts:Object.fromEntries(TASK_STATUSES.map(s=>[s,tasks.filter(t=>t.status===s).length]))};
}
async function checkRefs(c,b,before,after){
  const people=[after.owner_member_id,...after.viewer_ids].filter(Boolean),found=(await c.query('SELECT id FROM members WHERE business_id=$1 AND id=ANY($2::uuid[])',[b,[...new Set(people)]])).rows.length;
  if(found!==new Set(people).size)ruleFail('MEMBER_NOT_FOUND',422,'ไม่พบสมาชิกที่อ้างอิงในธุรกิจนี้');
  if(after.team_id&&after.team_id!==before?.team_id){const t=(await c.query('SELECT archived_at FROM teams WHERE business_id=$1 AND id=$2',[b,after.team_id])).rows[0];if(!t||t.archived_at)ruleFail('TEAM_ARCHIVED',422,'เลือกฝ่ายที่ยังใช้งานอยู่');}
}
const named=p=>[p.owner_member_id,...p.viewer_ids];
async function writeViewers(c,b,id,before,after){
  if(before&&JSON.stringify(before.viewer_ids)===JSON.stringify(after.viewer_ids))return;
  await c.query('DELETE FROM project_viewers WHERE business_id=$1 AND project_id=$2',[b,id]);
  for(const m of after.viewer_ids)await c.query('INSERT INTO project_viewers(business_id,project_id,member_id,added_by_member_id) VALUES($1,$2,$3,$4)',[b,id,m,c.zuriActor?.memberId||null]);
  if(before)await audit(c,b,'project_viewers',id,{viewerIds:before.viewer_ids},{viewerIds:after.viewer_ids});
}
const accessFail=error=>{const [message,status]=CHANGE_ERRORS[error];ruleFail(error,status,message);};

export async function createProject(c,b,input,viewer=viewerOf(c)){
  if(viewer.kind==='guest')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
  const data=clean(input,FIELDS);
  // A project always has an owner Member (owner decision 2026-10-01); a Member creating one owns it unless they name another.
  const after={name:data.name??'',description:data.description??null,status:data.status||'active',owner_member_id:data.owner_member_id||viewer.memberId||null,team_id:data.team_id||null,planned_start:data.planned_start||null,planned_end:data.planned_end||null,visibility:data.visibility||DEFAULT_VISIBILITY,viewer_ids:[...new Set(data.viewer_ids||[])].sort()};
  const e=projectError(after);if(e)ruleFail(e);
  if(!after.owner_member_id)ruleFail('OWNER_REQUIRED',422,'ระบุเจ้าของโปรเจกต์');
  await checkRefs(c,b,null,after);
  const access=visibilityChange(viewer,null,{visibility:after.visibility,team_id:after.team_id},{named:named(after)});if(access.error)accessFail(access.error);
  const id=randomUUID(),code=await allocate(c,b,'projects'),values={...Object.fromEntries(COLUMNS.map(k=>[k,after[k]])),team_id:after.team_id,visibility:after.visibility,code},keys=Object.keys(values);
  await c.query(`INSERT INTO projects(business_id,id,${keys.join(',')}) VALUES($1,$2,${keys.map((_,i)=>'$'+(i+3)).join(',')})`,[b,id,...Object.values(values)]);
  await writeViewers(c,b,id,null,after);
  await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);
  const {project}=await readProject(c,b,id,viewer);await audit(c,b,'projects',id,null,project,'create');return project;
}
export async function updateProject(c,b,id,input,viewer=viewerOf(c)){
  if(viewer.kind==='guest')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
  const data=clean(input,[...FIELDS,'row_version','visibility_reason']);
  const {project:before}=await readProject(c,b,id,viewer);
  await c.query('SELECT id FROM projects WHERE business_id=$1 AND id=$2 FOR UPDATE',[b,id]);
  if(Number(data.row_version)!==before.row_version)ruleFail('STALE',409,'ข้อมูลถูกแก้แล้ว กรุณาโหลดใหม่');
  const after={...before};for(const k of [...COLUMNS,'team_id','visibility'])if(k in data)after[k]=data[k];
  if('viewer_ids' in data)after.viewer_ids=[...new Set(data.viewer_ids)].sort();
  const e=projectError(after);if(e)ruleFail(e);if(!after.owner_member_id)ruleFail('OWNER_REQUIRED',422,'ระบุเจ้าของโปรเจกต์');
  await checkRefs(c,b,before,after);
  const changed=after.visibility!==before.visibility||after.team_id!==before.team_id;
  if(changed||after.visibility==='restricted'){
    // Only the project's owner widens it, with a reason (FR-011-011).
    const access=visibilityChange(viewer,{visibility:before.visibility,team_id:before.team_id},{visibility:after.visibility,team_id:after.team_id},{accountableId:before.owner_member_id,reason:data.visibility_reason,named:named(after)});
    if(access.error&&(changed||access.error==='NAMED_REQUIRED'))accessFail(access.error);
  }
  await writeViewers(c,b,id,before,after);
  const set=[...COLUMNS.filter(k=>after[k]!==before[k]),...(changed?['visibility','team_id']:[])];
  const updated=await c.query(`UPDATE projects SET ${set.length?set.map((k,i)=>`${k}=$${i+3}`).join(','):'status=status'} WHERE business_id=$1 AND id=$2`,[b,id,...set.map(k=>after[k])]);
  if(updated.rowCount!==1)ruleFail('SELF_EXCLUDED',422,'เปลี่ยนการมองเห็นก่อน แล้วจึงนำตัวเองออกจากโปรเจกต์นี้');
  if(changed)await audit(c,b,'project_visibility',id,{visibility:before.visibility,team_id:before.team_id},{visibility:after.visibility,team_id:after.team_id,reason:data.visibility_reason?.trim()||null});
  await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);
  const {project}=await readProject(c,b,id,viewer);await audit(c,b,'projects',id,before,project);return project;
}
