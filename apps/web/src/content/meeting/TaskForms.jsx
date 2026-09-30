import {useWriteAccess} from '../business/TeamAccess.jsx';
import {TaskAttachments} from './TaskAttachments.jsx';
import {VisibilityFields} from './Visibility.jsx';
import React,{useState} from 'react';
import {Button} from '../../data-app-public.jsx';
import {Field,Modal} from '../dashboard/Forms.jsx';
import {MOSCOW,STATUSES,weekOf} from './model.mjs';

export function MemberForm({member,onSave,onClose,members=[]}){
  const {canWrite,requestWrite}=useWriteAccess();
  const [draft,setDraft]=useState(member||{displayName:'',status:'active'}),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const set=(k,v)=>setDraft(d=>({...d,[k]:v}));
  async function submit(e){e.preventDefault();setError('');setBusy(true);try{await onSave(draft);onClose();}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <Modal title={member?'รายละเอียด Member':'ลงทะเบียน Member'} onClose={onClose}>{member?.pid&&<p>PID: <strong>{member.pid}</strong> <Button onClick={()=>navigator.clipboard.writeText(member.pid)}>คัดลอก PID</Button></p>}{!canWrite&&<Button onClick={()=>requestWrite(null)}>แก้ไข Member</Button>}<fieldset className="mt-access-fields" disabled={!canWrite}><form onSubmit={submit} className="mt-form"><p className="mc-note">เริ่มจากชื่อที่ใช้แสดง แล้วกลับมาเติมรายละเอียดภายหลังได้</p>{error&&<p role="alert" className="mc-errors">{error}</p>}<div className="mc-form-grid">
    <Field label="ชื่อที่ใช้แสดง" value={draft.displayName} onChange={v=>set('displayName',v)} required maxLength={160}/>
    <Field label="สถานะสมาชิก" value={draft.status} options={[{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]} onChange={v=>set('status',v)}/>
    {[['fullName','ชื่อ–นามสกุล'],['nickname','ชื่อเล่น'],['team','ทีม'],['position','ตำแหน่ง'],['email','Email'],['phone','เบอร์ติดต่อ']].map(([key,label])=><Field key={key} label={label} type={key==='email'?'email':key==='phone'?'tel':'text'} value={draft[key]} onChange={v=>set(key,v)} hint="กรอกภายหลังได้" maxLength={250}/>)}
    <Field label="รายละเอียด Member / หมายเหตุ" type="textarea" value={draft.notes} onChange={v=>set('notes',v)} wide hint="กรอกภายหลังได้" maxLength={12000}/>
  </div>{members.some(m=>m.id!==draft.id&&m.displayName.trim()===draft.displayName.trim())&&<p className="mc-note">มีชื่อเหมือนกันในทะเบียน กรุณาตรวจทีม/ตำแหน่งเพื่อแยกคน ระบบจะเก็บเป็นคนละ Member</p>}<div className="mc-form-actions"><Button onClick={onClose} type="button">ยกเลิก</Button><Button className="mc-primary" type="submit" disabled={busy}>{busy?'กำลังบันทึก…':'บันทึก Member'}</Button></div></form></fieldset></Modal>;
}

export function TaskForm({businessId,initialError,task,week,entry,state,campaigns,teams=null,onSave,onMember,onClose,onSource}){
  const {canWrite,requestWrite}=useWriteAccess();
  const [draft,setDraft]=useState(task||{title:'',status:'planned',statusConfirmed:true,consultedIds:[],informedIds:[],accountableConfirmed:false}),[selectedWeek,setWeek]=useState(week||''),[priority,setPriority]=useState(entry?.priority||''),[note,setNote]=useState(entry?.priorityNote||''),[error,setError]=useState(initialError||''),[busy,setBusy]=useState(false),[newName,setNewName]=useState(''),[quick,setQuick]=useState(false);
  const set=(k,v)=>setDraft(d=>({...d,[k]:v,...(k==='accountableId'?{accountableConfirmed:false}:{}),...(k==='status'?{statusConfirmed:true}:{})}));
  const choices=key=>[{value:'',label:'รอยืนยัน'},...state.members.filter(m=>m.status==='active'||draft[key]===m.id).map(m=>({value:m.id,label:`${m.displayName}${m.team?' · '+m.team:''}${m.status==='inactive'?' (Inactive)':''} · ${m.id.slice(0,4)}`}))];
  async function submit(e){e.preventDefault();setError('');setBusy(true);try{await onSave(draft,{week:selectedWeek,priority:priority||null,priorityNote:note});onClose();}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function quickMember(){setBusy(true);setError('');try{const id=await onMember({displayName:newName});set('responsibleId',id);setNewName('');setQuick(false);}catch(e){setError(e.message);}finally{setBusy(false);}}
  function changeWeek(value){const w=value?weekOf(value):'';setWeek(w);const saved=state.weeks.find(p=>p.weekStart===w)?.entries.find(e=>e.taskId===task?.id);setPriority(saved?.priority||'');setNote(saved?.priorityNote||'');}
  return <Modal title={task?.id?'รายละเอียดงาน':'เพิ่มงานเอง'} onClose={onClose}>{!canWrite&&<div className="mt-readonly-note"><span>Guest mode · รายละเอียดงานอ่านอย่างเดียว</span><Button onClick={()=>requestWrite(null)}>แก้ไขงาน</Button></div>}<fieldset className="mt-access-fields" disabled={!canWrite}><form className="mt-form" onSubmit={submit}>{error&&<p className="mc-errors" role="alert">{error}</p>}<div className="mc-form-grid">
    <Field label="ชื่องาน" value={draft.title} onChange={v=>set('title',v)} required wide maxLength={300}/>
    <Field label="รายละเอียดงาน" type="textarea" value={draft.description} onChange={v=>set('description',v)} hint="กรอกภายหลังได้" wide maxLength={20000}/>
    <Field label="R · ผู้ลงมือทำ / PIC" value={draft.responsibleId} options={choices('responsibleId')} onChange={v=>set('responsibleId',v)}/>
    <Field label="A · ผู้ตรวจรับ" value={draft.accountableId} options={choices('accountableId')} onChange={v=>set('accountableId',v)}/>
    <label className="mt-check wide"><input type="checkbox" checked={!!draft.accountableConfirmed} disabled={!draft.accountableId} onChange={e=>set('accountableConfirmed',e.target.checked)}/> ยืนยัน A ที่ระบุไว้ (บันทึกในเครื่อง)</label>
    <div className="wide"><Button type="button" onClick={()=>setQuick(!quick)}>＋ เพิ่ม Member จากฟอร์มนี้</Button>{quick&&<div className="mt-quick"><Field label="ชื่อ Member ใหม่" value={newName} onChange={setNewName}/><Button type="button" disabled={busy||!newName.trim()} onClick={quickMember}>เพิ่มและเลือกเป็น R</Button></div>}</div>
    {['consultedIds','informedIds'].map((key,index)=><fieldset key={key} className="mt-people"><legend>{index?'I · ผู้รับทราบ':'C · ผู้ให้คำปรึกษา'}</legend>{state.members.filter(m=>m.status==='active'||draft[key]?.includes(m.id)).map(m=><label key={m.id}><input type="checkbox" checked={draft[key]?.includes(m.id)||false} onChange={e=>set(key,e.target.checked?[...(draft[key]||[]),m.id]:(draft[key]||[]).filter(id=>id!==m.id))}/>{m.displayName}{m.status==='inactive'?' (Inactive)':''}</label>)}</fieldset>)}
    {teams&&<VisibilityFields value={draft} original={task?.id?task:null} onChange={patch=>setDraft(d=>({...d,...patch}))} teams={teams} members={state.members} hint="R, A, C และ I เห็นงานเสมอเมื่อเป็นระดับฝ่ายหรือลับ · ผู้ดูแลธุรกิจไม่ได้เห็นงานลับโดยอัตโนมัติ"/>}
    {draft.raciProposed&&<label className="mt-check wide"><input type="checkbox" onChange={()=>set('raciProposed',false)}/> C/I มาจากข้อเสนอเดิม — กดเพื่อยืนยันรายชื่อ</label>}
    <Field label="สัปดาห์ที่วางแผน" type="date" value={selectedWeek} onChange={changeWeek} hint={task?.id?"เลือกสัปดาห์เพื่อเพิ่มหรือแก้แผนรอบนั้น; เว้นว่างเพื่อคงแผนเดิม":"เลือกวันใดก็ได้ ระบบใช้สัปดาห์จันทร์–อาทิตย์; เว้นว่างเป็น Backlog"}/>
    <Field label="MoSCoW" value={priority} disabled={!selectedWeek} options={[{value:'',label:selectedWeek?'ยังไม่จัดลำดับ':'เลือกสัปดาห์ก่อน'},...Object.entries(MOSCOW).map(([value,label])=>({value,label}))]} onChange={setPriority}/>
    <Field label="เหตุผลของ priority" value={note} disabled={!selectedWeek} onChange={setNote} hint="กรอกภายหลังได้"/>
    <Field label="วันส่ง" type="date" value={draft.dueDate} onChange={v=>set('dueDate',v)}/>
    <Field label="สถานะงาน" value={draft.status} options={Object.entries(STATUSES).map(([value,label])=>({value,label}))} onChange={v=>set('status',v)}/>
    <Field label="เหตุที่ติดขัด" value={draft.blocker} onChange={v=>set('blocker',v)} required={draft.status==='blocked'}/>
    {!draft.statusConfirmed&&<label className="mt-check wide"><input type="checkbox" onChange={e=>set('statusConfirmed',e.target.checked)}/> ยืนยันสถานะปัจจุบันของงานนี้</label>}
    <Field label="สิ่งส่งมอบ" value={draft.deliverable} onChange={v=>set('deliverable',v)} wide/>
    <Field label="เกณฑ์รับงาน" type="textarea" value={draft.acceptance} onChange={v=>set('acceptance',v)} wide/>
    {draft.acceptanceProposed&&<label className="mt-check wide"><input type="checkbox" onChange={()=>set('acceptanceProposed',false)}/> เกณฑ์ข้างต้นเป็นข้อเสนอ — กดเพื่อยืนยันก่อน Done</label>}
    <Field label="หลักฐานส่งงาน / ลิงก์ผลงาน" type="textarea" value={draft.evidence} onChange={v=>set('evidence',v)} wide/>
    <Field label="Project" value={draft.project} onChange={v=>set('project',v)}/>
    <Field label="Campaign ที่เกี่ยวข้อง" value={draft.campaignId} options={[{value:'',label:'ไม่ผูกแคมเปญ'},...campaigns.map(c=>({value:c.id,label:c.name}))]} onChange={v=>set('campaignId',v)}/>
    <Field label="Dependency / งานที่ต้องรอ" value={draft.dependency} onChange={v=>set('dependency',v)}/>
    <Field label="KPI ที่ต้องตรวจซ้ำ (ถ้ามี)" value={draft.kpi} onChange={v=>set('kpi',v)}/>
    {draft.kpi&&<Field label="วันตรวจ KPI ซ้ำ" type="date" value={draft.recheckDate} onChange={v=>set('recheckDate',v)}/>}
  </div><div className="mc-form-actions"><Button type="button" onClick={onClose}>ยกเลิก</Button><Button type="submit" className="mc-primary" disabled={busy}>{busy?'กำลังบันทึก…':'บันทึกงาน'}</Button></div></form></fieldset>
    <TaskAttachments businessId={businessId} taskId={task?.id} onEvidence={url=>{if(!draft.evidence)set('evidence',url);}}/>
    {task?.sourceRefsWithheld&&<p className="mc-note">งานนี้มาจากประชุมที่คุณไม่ได้อยู่ในผู้เข้าร่วม จึงไม่แสดงข้อความอ้างอิงจากประชุม</p>}
    {task?.sourceRefs?.length>0&&<section className="mt-source"><h3>ที่มาจากประชุม</h3>{task.sourceRefs.map((ref,i)=><div key={i}>{ref.evidence?.map((e,j)=><blockquote key={j}>{e.quote}<small>{Math.floor(e.startMs/1000)}s – {Math.floor(e.endMs/1000)}s</small></blockquote>)}<Button onClick={()=>onSource(ref.meetingId)}>เปิดประชุมต้นทาง</Button></div>)}</section>}
    {task?.sourceUrl&&<p><a href={task.sourceUrl} target="_blank" rel="noreferrer">เอกสารต้นทาง ↗</a></p>}
    {task?.id&&<details className="mt-history"><summary>ประวัติการแก้ไข · {task.id.slice(0,8)}</summary>{state.events.filter(e=>e.taskId===task.id).slice().reverse().map(e=><p key={e.id}><b>{e.type==='priority'?`MoSCoW · ${e.detail.weekStart} · ${MOSCOW[e.detail.after.priority]||'ยังไม่จัดลำดับ'}`:e.type}</b><small>{new Date(e.at).toLocaleString('th-TH')} · {e.actor}</small></p>)}</details>}
  </Modal>;
}
