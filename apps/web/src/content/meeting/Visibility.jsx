// Visibility, teams and the Guest notice (FEAT-011, PLAN-002 WI-04). The server decides what each viewer sees;
// these controls only choose the level and the people.
import React,{useState} from 'react';
import {Button} from '../../data-app-public.jsx';
import {Field,Modal} from '../dashboard/Forms.jsx';
import {scoped} from '../business/api.mjs';
import {LEVELS,DEFAULT_VISIBILITY} from '../shared/visibility.mjs';

const LABELS={business:'สมาชิกที่เข้าสู่ระบบ',team:'เฉพาะฝ่าย และคนที่ระบุชื่อ',restricted:'เฉพาะคนที่ระบุชื่อ (ลับ)',public:'ทุกคน รวม Guest'};
const SHORT={public:'สาธารณะ',team:'ฝ่าย',restricted:'ลับ'};
const levelOf=item=>item?.visibility||DEFAULT_VISIBILITY;
export function widens(before,after){
  if(!before)return false;const from=LEVELS.indexOf(levelOf(before)),to=LEVELS.indexOf(levelOf(after));
  return to>from||(levelOf(before)==='team'&&levelOf(after)==='team'&&(before.teamId||null)!==(after.teamId||null));
}
export const VisibilityBadge=({level})=>SHORT[level]?<span className={`mt-visibility-badge ${level}`}>{SHORT[level]}</span>:null;
export function GuestNotice({onSignIn}){
  return <div className="mt-guest-notice" role="status"><span>Guest เห็นเฉพาะงานและประชุมที่ตั้งเป็น “สาธารณะ” · งานของทีมจะแสดงหลังเข้าสู่ระบบ</span><Button onClick={onSignIn}>เข้าสู่ระบบเพื่อดูงานของทีม</Button></div>;
}
export function VisibilityFields({value,original,onChange,teams,members,peopleKey='viewerIds',peopleLabel='ผู้มองเห็นเพิ่มเติม',hint}){
  const level=levelOf(value),set=(k,v)=>onChange({[k]:v}),people=value[peopleKey]||[];
  return <fieldset className="mt-people wide mt-visibility"><legend>การมองเห็น</legend>
    <Field label="ใครเห็นรายการนี้" value={level} options={['business','team','restricted','public'].map(v=>({value:v,label:LABELS[v]}))} onChange={v=>set('visibility',v)}/>
    {level==='team'&&<Field label="ฝ่าย" value={value.teamId||''} options={[{value:'',label:teams.length?'เลือกฝ่าย':'ยังไม่มีฝ่าย · ให้ผู้ดูแลธุรกิจสร้างก่อน'},...teams.filter(t=>!t.archived_at||t.id===value.teamId).map(t=>({value:t.id,label:t.name}))]} onChange={v=>set('teamId',v)}/>}
    {(level==='team'||level==='restricted')&&<div className="mt-visibility-people"><span>{peopleLabel}</span>{members.filter(m=>m.status==='active'||people.includes(m.id)).map(m=><label key={m.id}><input type="checkbox" checked={people.includes(m.id)} onChange={e=>set(peopleKey,e.target.checked?[...people,m.id]:people.filter(id=>id!==m.id))}/>{m.displayName}</label>)}</div>}
    {widens(original,value)&&<Field label="เหตุผลที่ขยายการมองเห็น" value={value.visibilityReason||''} onChange={v=>set('visibilityReason',v)} required wide hint="ระบบบันทึกเหตุผลและผู้เปลี่ยนไว้"/>}
    {hint&&<p className="mc-note">{hint}</p>}
  </fieldset>;
}
export function TeamsPanel({businessId,teams,members,canManage,onChanged}){
  const [editing,setEditing]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const name=id=>members.find(m=>m.id===id)?.displayName||'Member';
  async function save(e){e.preventDefault();setBusy(true);setError('');try{await scoped(businessId,editing.id?`/teams/${editing.id}`:'/teams',editing.id?'PATCH':'POST',{name:editing.name,memberIds:editing.memberIds,...(editing.id?{row_version:editing.row_version,archived:!!editing.archived}:{})});setEditing(null);await onChanged();}catch(e){setError(e.message);}finally{setBusy(false);}}
  const toggle=(id,on)=>setEditing(d=>({...d,memberIds:on?[...d.memberIds,id]:d.memberIds.filter(x=>x!==id)}));
  return <section className="mt-teams"><div className="mt-member-head"><div><h3>ฝ่าย <span>{teams.filter(t=>!t.archived_at).length}</span></h3><p>ใช้กำหนดว่าใครเห็นงานระดับฝ่าย · จัดการได้เฉพาะผู้ดูแลธุรกิจ</p></div>{canManage&&<Button onClick={()=>setEditing({name:'',memberIds:[]})}>＋ เพิ่มฝ่าย</Button>}</div>
    <div className="mt-team-list">{teams.map(t=><div key={t.id} className={t.archived_at?'archived':''}><strong>{t.name}{t.archived_at?' (ปิดแล้ว)':''}</strong><small>{t.memberIds.map(name).join(', ')||'ยังไม่มีสมาชิก'}</small>{canManage&&<Button onClick={()=>setEditing({...t,archived:!!t.archived_at})}>แก้ไข</Button>}</div>)}{!teams.length&&<p className="mc-note">ยังไม่มีฝ่าย</p>}</div>
    {editing&&<Modal title={editing.id?'แก้ไขฝ่าย':'เพิ่มฝ่าย'} onClose={()=>setEditing(null)} wide={false}><form className="mt-form" onSubmit={save}>{error&&<p className="mc-errors" role="alert">{error}</p>}
      <Field label="ชื่อฝ่าย" value={editing.name} onChange={v=>setEditing(d=>({...d,name:v}))} required maxLength={80}/>
      <fieldset className="mt-people"><legend>สมาชิกของฝ่าย</legend>{members.filter(m=>m.status==='active'||editing.memberIds.includes(m.id)).map(m=><label key={m.id}><input type="checkbox" checked={editing.memberIds.includes(m.id)} onChange={e=>toggle(m.id,e.target.checked)}/>{m.displayName}</label>)}</fieldset>
      {editing.id&&<label className="mt-check"><input type="checkbox" checked={editing.archived} onChange={e=>setEditing(d=>({...d,archived:e.target.checked}))}/> ปิดฝ่ายนี้ · งานเดิมยังเห็นตามเดิม แต่เลือกให้งานใหม่ไม่ได้</label>}
      <div className="mc-form-actions"><Button type="button" onClick={()=>setEditing(null)}>ยกเลิก</Button><Button className="mc-primary" type="submit" disabled={busy}>{busy?'กำลังบันทึก…':'บันทึกฝ่าย'}</Button></div></form></Modal>}
  </section>;
}
