// Teams (ฝ่าย) and team membership (FR-011-001). Only a Business admin or the local operator changes them;
// being admin never widens what the admin may read (FR-011-002).
// @trace implements FR-011-001, FR-011-002
import {fail,audit} from './service.mjs';
const canManage=v=>v?.kind==='operator'||v?.kind==='member'&&v.admin===true;
const legacyId=row=>row.legacy_metadata?.id||row.id;
async function withMembers(c,b,teams){
 const members=(await c.query('SELECT id,legacy_metadata FROM members WHERE business_id=$1',[b])).rows,links=(await c.query('SELECT team_id,member_id FROM team_members WHERE business_id=$1',[b])).rows;
 return teams.map(t=>({...t,memberIds:links.filter(l=>l.team_id===t.id).map(l=>legacyId(members.find(m=>m.id===l.member_id)))}));
}
export async function listTeams(c,b,viewer){
 if(viewer?.kind!=='member'&&viewer?.kind!=='operator')fail('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน',401);
 return withMembers(c,b,(await c.query('SELECT * FROM teams WHERE business_id=$1 ORDER BY archived_at NULLS FIRST,name',[b])).rows);
}
export async function saveTeam(c,b,viewer,input,id=null){
 if(!canManage(viewer))fail('เฉพาะผู้ดูแลธุรกิจจัดการฝ่ายได้',403);
 const unknown=Object.keys(input||{}).filter(k=>!['name','archived','memberIds','row_version'].includes(k));if(unknown.length)fail('ข้อมูลไม่รองรับ: '+unknown.join(', '));
 const name=typeof input.name==='string'?input.name.trim():undefined;if(name!==undefined&&(!name||name.length>80))fail('ระบุชื่อฝ่ายไม่เกิน 80 ตัวอักษร');
 let old=null,team;
 if(id){old=(await c.query('SELECT * FROM teams WHERE business_id=$1 AND id=$2 FOR UPDATE',[b,id])).rows[0];if(!old)fail('ไม่พบฝ่าย',404);if(Number(input.row_version)!==Number(old.row_version))fail('ข้อมูลถูกแก้แล้ว กรุณาโหลดใหม่',409);
  const archived=input.archived===undefined?old.archived_at:input.archived?old.archived_at||new Date().toISOString():null;
  team=(await c.query('UPDATE teams SET name=$3,archived_at=$4 WHERE business_id=$1 AND id=$2 RETURNING *',[b,id,name??old.name,archived])).rows[0];}
 else{if(!name)fail('ระบุชื่อฝ่าย');team=(await c.query('INSERT INTO teams(business_id,name) VALUES($1,$2) RETURNING *',[b,name])).rows[0];}
 let before=[],after=null;
 if(input.memberIds!==undefined){
  if(!Array.isArray(input.memberIds))fail('รายชื่อสมาชิกไม่ถูกต้อง');
  const members=(await c.query('SELECT id,legacy_metadata FROM members WHERE business_id=$1',[b])).rows;
  after=[...new Set(input.memberIds.map(value=>{const m=members.find(m=>m.id===value||m.legacy_metadata?.id===value);if(!m)fail('ไม่พบสมาชิกในธุรกิจนี้');return m.id;}))].sort();
  before=(await c.query('SELECT member_id FROM team_members WHERE business_id=$1 AND team_id=$2 ORDER BY member_id',[b,team.id])).rows.map(r=>r.member_id);
  await c.query('DELETE FROM team_members WHERE business_id=$1 AND team_id=$2',[b,team.id]);
  for(const m of after)await c.query('INSERT INTO team_members(business_id,team_id,member_id) VALUES($1,$2,$3)',[b,team.id,m]);
 }
 // Membership decides who sees team items, so open clients reload.
 await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);
 await audit(c,b,'teams',team.id,old&&{...old,memberIds:before},{...team,...(after?{memberIds:after}:{})},old?'update':'create');
 return (await withMembers(c,b,[team]))[0];
}
