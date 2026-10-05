// Visibility, teams and the Guest notice (FEAT-011, PLAN-002 WI-04). The server decides what each viewer sees;
// these controls only choose the level and the people.
import React,{useState} from 'react';
import {Button} from '../../data-app-public.jsx';
import {Field,Modal} from '../dashboard/Forms.jsx';
import {scoped} from '../business/api.mjs';
import {LEVELS,DEFAULT_VISIBILITY} from '../shared/visibility.mjs';

const LABELS={business:'Guest และ Members',team:'Guest และ Members · metadata: ฝ่าย',restricted:'Guest และ Members · metadata: จำกัด',public:'Guest และ Members'};
const SHORT={public:'สาธารณะ',team:'ฝ่าย',restricted:'ลับ'};
const levelOf=item=>item?.visibility||DEFAULT_VISIBILITY;
export function widens(before,after){
  if(!before)return false;const from=LEVELS.indexOf(levelOf(before)),to=LEVELS.indexOf(levelOf(after));
  return to>from||(levelOf(before)==='team'&&levelOf(after)==='team'&&(before.teamId||null)!==(after.teamId||null));
}
export const VisibilityBadge=({level})=>SHORT[level]?<span className={`mt-visibility-badge ${level}`}>{SHORT[level]}</span>:null;
export function GuestNotice({onSignIn}){
  return <div className="mt-guest-notice" role="status"><span>Guest อ่านข้อมูลธุรกิจทั้งหมดได้ · เข้าสู่ระบบเพื่อสร้าง แก้ไข หรือลบข้อมูล</span><Button onClick={onSignIn}>เข้าสู่ระบบเพื่อแก้ไข</Button></div>;
}
export function VisibilityFields({value,original,onChange,teams,members,peopleKey='viewerIds',peopleLabel='ผู้มองเห็นเพิ่มเติม',hint}){
  const level=levelOf(value),set=(k,v)=>onChange({[k]:v}),people=value[peopleKey]||[];
  return <fieldset className="mt-people wide mt-visibility"><legend>การมองเห็น</legend>
    <Field label="ใครเห็นรายการนี้" value={level} options={['business','team','restricted','public'].map(v=>({value:v,label:LABELS[v]}))} onChange={v=>set('visibility',v)}/>
    {level==='team'&&<Field label="ฝ่าย" value={value.teamId||''} options={[{value:'',label:teams.length?'เลือกฝ่าย':'ยังไม่มีฝ่าย · ให้ผู้ดูแลธุรกิจสร้างก่อน'},...teams.filter(t=>!t.archived_at||t.id===value.teamId).map(t=>({value:t.id,label:t.name}))]} onChange={v=>set('teamId',v)}/>}
    {(level==='team'||level==='restricted')&&<div className="mt-visibility-people"><span>{peopleLabel}</span>{members.filter(m=>m.status==='active'||people.includes(m.id)).map(m=><label key={m.id}><input type="checkbox" checked={people.includes(m.id)} onChange={e=>set(peopleKey,e.target.checked?[...people,m.id]:people.filter(id=>id!==m.id))}/>{m.displayName}</label>)}</div>}
    {hint&&<p className="mc-note">{hint}</p>}<p className="mc-note">ระดับการมองเห็นและรายชื่อคงไว้เป็น metadata เท่านั้น ไม่จำกัดการอ่านหรือแก้ไขตาม ADR-008.</p>
  </fieldset>;
}
// The transcript of a restricted meeting stays on the recording machine (FR-011-010). A participant may upload it, with a reason;
// the content comes from a backup of the recording machine, and the server only accepts what matches the hashes it already holds.
export function TranscriptCustody({meeting,businessId,participant,onUploaded}){
  const [open,setOpen]=useState(false),[reason,setReason]=useState(''),[file,setFile]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function upload(e){
    e.preventDefault();setBusy(true);setError('');
    try{
      let domain;try{const backup=JSON.parse(await file.text());domain=backup.meetingTaskManager||backup;}catch{throw Error('ไฟล์ backup ไม่ถูกต้อง');}
      const pick=key=>(domain[key]||[]).filter(x=>x.meetingId===meeting.id);
      await scoped(businessId,`/meetings/${meeting.id}/transcript`,'POST',{reason,sources:pick('sources'),reviews:pick('reviews'),batches:pick('batches')});
      setOpen(false);setReason('');setFile(null);await onUploaded();
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <section className="mt-transcript mt-custody" role="status"><h3>Transcript เก็บไว้ที่เครื่องที่บันทึกการประชุม</h3>
    <p>ประชุมลับนี้ยังไม่มี transcript บน cloud · ที่นี่มีเฉพาะชื่อประชุม วันที่ ผู้เข้าร่วม และงานที่ยืนยันแล้ว</p>
    {participant&&businessId?<><Button onClick={()=>setOpen(!open)}>อัปโหลด transcript พร้อมเหตุผล</Button>
      {open&&<form className="mt-form" onSubmit={upload}>{error&&<p className="mc-errors" role="alert">{error}</p>}
        <Field label="เหตุผลที่อัปโหลด transcript" type="textarea" value={reason} onChange={setReason} required wide hint="ระบบบันทึกผู้อัปโหลด เวลา และเหตุผลไว้ · หลังอัปโหลดเฉพาะผู้เข้าร่วมประชุมเห็น transcript"/>
        <label className="mt-upload">เลือกไฟล์ Backup จากเครื่องที่บันทึกการประชุม (.json)<input type="file" accept="application/json,.json" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
        <div className="mc-form-actions"><Button type="button" onClick={()=>setOpen(false)}>ยกเลิก</Button><Button className="mc-primary" type="submit" disabled={busy||!file||!reason.trim()}>{busy?'กำลังอัปโหลด…':'ยืนยันอัปโหลด'}</Button></div></form>}</>
      :<p className="mc-note">เฉพาะผู้เข้าร่วมประชุมอัปโหลด transcript ขึ้น cloud ได้</p>}
  </section>;
}
export function TeamsPanel({businessId,teams,members,canManage,onChanged}){
  const [editing,setEditing]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const name=id=>members.find(m=>m.id===id)?.displayName||'Member';
  async function save(e){e.preventDefault();setBusy(true);setError('');try{await scoped(businessId,editing.id?`/teams/${editing.id}`:'/teams',editing.id?'PATCH':'POST',{name:editing.name,memberIds:editing.memberIds,...(editing.id?{row_version:editing.row_version,archived:!!editing.archived}:{})});setEditing(null);await onChanged();}catch(e){setError(e.message);}finally{setBusy(false);}}
  const toggle=(id,on)=>setEditing(d=>({...d,memberIds:on?[...d.memberIds,id]:d.memberIds.filter(x=>x!==id)}));
  return <section className="mt-teams"><div className="mt-member-head"><div><h3>ฝ่าย <span>{teams.filter(t=>!t.archived_at).length}</span></h3><p>ใช้จัดกลุ่มสมาชิก · ทุก active Member จัดการฝ่ายได้</p></div>{canManage&&<Button onClick={()=>setEditing({name:'',memberIds:[]})}>＋ เพิ่มฝ่าย</Button>}</div>
    <div className="mt-team-list">{teams.map(t=><div key={t.id} className={t.archived_at?'archived':''}><strong>{t.name}{t.archived_at?' (ปิดแล้ว)':''}</strong><small>{t.memberIds.map(name).join(', ')||'ยังไม่มีสมาชิก'}</small>{canManage&&<Button onClick={()=>setEditing({...t,archived:!!t.archived_at})}>แก้ไข</Button>}</div>)}{!teams.length&&<p className="mc-note">ยังไม่มีฝ่าย</p>}</div>
    {editing&&<Modal title={editing.id?'แก้ไขฝ่าย':'เพิ่มฝ่าย'} onClose={()=>setEditing(null)} wide={false}><form className="mt-form" onSubmit={save}>{error&&<p className="mc-errors" role="alert">{error}</p>}
      <Field label="ชื่อฝ่าย" value={editing.name} onChange={v=>setEditing(d=>({...d,name:v}))} required maxLength={80}/>
      <fieldset className="mt-people"><legend>สมาชิกของฝ่าย</legend>{members.filter(m=>m.status==='active'||editing.memberIds.includes(m.id)).map(m=><label key={m.id}><input type="checkbox" checked={editing.memberIds.includes(m.id)} onChange={e=>toggle(m.id,e.target.checked)}/>{m.displayName}</label>)}</fieldset>
      {editing.id&&<label className="mt-check"><input type="checkbox" checked={editing.archived} onChange={e=>setEditing(d=>({...d,archived:e.target.checked}))}/> ปิดฝ่ายนี้ · งานเดิมยังเห็นตามเดิม แต่เลือกให้งานใหม่ไม่ได้</label>}
      <div className="mc-form-actions"><Button type="button" onClick={()=>setEditing(null)}>ยกเลิก</Button><Button className="mc-primary" type="submit" disabled={busy}>{busy?'กำลังบันทึก…':'บันทึกฝ่าย'}</Button></div></form></Modal>}
  </section>;
}
