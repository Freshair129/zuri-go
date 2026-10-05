// Boards and Projects of the Task Manager (FEAT-010, PLAN-002 WI-08). API-backed views of the task records (a board is a filter,
// never a copy); the server decides what each viewer sees and stays authoritative for every rule. Server workspace only.
import React,{useEffect,useRef,useState} from 'react';
import {Button,SegmentedControl} from '../../data-app-public.jsx';
import {Field,Modal} from '../dashboard/Forms.jsx';
import {scoped} from '../business/api.mjs';
import {useWriteAccess} from '../business/TeamAccess.jsx';
import {TASK_STATUSES,PROJECT_STATUSES,RULE_MESSAGES,moveError,saveError,projectError} from '../shared/task-rules.mjs';
import {VisibilityBadge,VisibilityFields,widens} from './Visibility.jsx';
import {STATUSES} from './model.mjs';
import './boards.css';

// Lane labels stay those of the existing boards (FR-010-006 Notes).
const LANES=STATUSES;
const PROJECT_LABELS={active:'กำลังดำเนินการ',on_hold:'พักไว้',done:'เสร็จแล้ว',archived:'เก็บถาวร'};
const KINDS=[{value:'all',label:'ทั้งหมด'},{value:'campaign',label:'แคมเปญ'},{value:'project',label:'โปรเจกต์'},{value:'team',label:'ฝ่าย'},{value:'unlinked',label:'งานทั่วไป'},{value:'mine',label:'งานของฉัน'}];
const dateLabel=value=>value?new Date(`${value}T12:00:00`).toLocaleDateString('th-TH',{day:'numeric',month:'short'}):'ยังไม่กำหนด';
const pick=r=>r?.task||r;
const msg=e=>RULE_MESSAGES[e.code]||e.message;
const blank=v=>v===''||v===undefined?null:v;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// The shape task-rules.mjs reads, from a task as the API serves it.
const ruleView=t=>({title:t.title,status:t.status,blocker:t.blocker,responsibleId:t.roles?.R,accountableId:t.roles?.A,accountableConfirmed:t.roles?.A_confirmed,acceptance:t.acceptance,acceptanceProposed:t.acceptance_proposed,evidence:t.evidence,kpi:t.kpi_note,recheckDate:t.recheck_date,campaignId:t.campaign_id,dueDate:t.due_date,details:t.details,completionRule:t.completion_rule});
const memberOptions=(members,keep=[],label='ยังไม่ระบุ')=>[{value:'',label},...members.filter(m=>m.status==='active'||keep.includes(m.id)).map(m=>({value:m.id,label:m.displayName+(m.status==='inactive'?' (Inactive)':'')}))];
const nameOf=(dir,id)=>dir.members.find(m=>m.id===id)?.displayName||'Member';

// Member UUIDs, campaigns and readable projects. The workspace's domain members carry legacy IDs, so the pickers read /state.
function useDirectory(businessId){
  const [dir,setDir]=useState({members:[],campaigns:[],projects:[]}),seq=useRef(0);
  async function reload(){
    const n=++seq.current;
    try{
      const [state,projects]=await Promise.all([scoped(businessId,'/state'),scoped(businessId,'/projects')]);
      if(n===seq.current)setDir({members:(state.members||[]).map(m=>({id:m.id,displayName:m.display_name,status:m.status})),campaigns:(state.campaigns||[]).map(c=>({id:c.id,name:c.name,archived:!!c.archived_at})),projects:projects.projects||[]});
    }catch{}
  }
  useEffect(()=>{reload();window.addEventListener('zuri-go-viewer-changed',reload);return()=>window.removeEventListener('zuri-go-viewer-changed',reload);},[businessId]);
  return [dir,reload];
}

export function TaskBoards({view,businessId,teams,epoch,onChanged}){
  const [dir,reloadDir]=useDirectory(businessId);
  useEffect(()=>{if(epoch)reloadDir();},[epoch]);
  return view==='projects'?<Projects businessId={businessId} teams={teams||[]} dir={dir} reloadDir={reloadDir} epoch={epoch} onChanged={onChanged}/>:<Boards businessId={businessId} teams={teams||[]} dir={dir} epoch={epoch} onChanged={onChanged}/>;
}

function Boards({businessId,teams,dir,epoch,onChanged}){
  // “My tasks” exists only for a signed-in Member (R or A); the local operator and Guests get the other boards.
  const {requestWrite,viewer}=useWriteAccess(),guest=viewer.kind==='guest',noMine=viewer.kind!=='member';
  const [kind,setKind]=useState('all'),[pickedId,setPickedId]=useState(''),[tasks,setTasks]=useState(null),[error,setError]=useState(''),[editor,setEditor]=useState(null),[ask,setAsk]=useState(null),[busyId,setBusyId]=useState(null),seq=useRef(0);
  const effKind=noMine&&kind==='mine'?'all':kind,needsId=['campaign','project','team'].includes(effKind);
  const options=effKind==='campaign'?dir.campaigns.map(c=>({value:c.id,label:c.name+(c.archived?' (เก็บแล้ว)':'')})):effKind==='project'?dir.projects.map(p=>({value:p.id,label:`${p.code} · ${p.name}`})):effKind==='team'?teams.map(t=>({value:t.id,label:t.name+(t.archived_at?' (ปิดแล้ว)':'')})):[];
  const boardId=needsId?(options.some(o=>o.value===pickedId)?pickedId:options[0]?.value||''):'';
  async function load(){
    const n=++seq.current;
    if(needsId&&!boardId){setTasks([]);return;}
    try{const q=new URLSearchParams({board:effKind});if(needsId)q.set(effKind+'_id',boardId);const result=await scoped(businessId,'/tasks?'+q);if(n===seq.current)setTasks(result.tasks);}
    catch(e){if(n===seq.current){setTasks([]);setError(msg(e));}}
  }
  useEffect(()=>{setTasks(null);load();},[businessId,effKind,boardId,viewer.kind,viewer.memberId,epoch]);

  // A move: instant client check (server stays authoritative), optimistic lane change, restored on any error.
  function move(task,to,blocker){
    if(to===task.status)return;
    requestWrite(()=>{
      if(to==='blocked'&&blocker===undefined){setAsk({task,text:task.blocker||'',error:''});return;}
      const code=moveError(ruleView({...task,...(blocker!==undefined?{blocker}:{})}),to);
      if(code){setError(RULE_MESSAGES[code]||code);return;}
      commit(task,to,blocker);
    });
  }
  async function commit(task,to,blocker){
    setBusyId(task.id);setError('');
    setTasks(list=>list&&list.map(t=>t.id===task.id?{...t,status:to,...(blocker!==undefined?{blocker}:{})}:t));
    try{
      const saved=pick(await scoped(businessId,`/tasks/${task.id}`,'PATCH',{row_version:task.row_version,status:to,...(to==='blocked'?{blocker}:{})}));
      setTasks(list=>list&&list.map(t=>t.id===saved.id?saved:t));onChanged?.();
    }catch(e){
      setTasks(list=>list&&list.map(t=>t.id===task.id?task:t));setError(msg(e));
      if(e.status===409)await load();
    }finally{setBusyId(null);}
  }
  function confirmBlocker(e){
    e.preventDefault();const text=ask.text.trim();
    if(!text){setAsk({...ask,error:RULE_MESSAGES.BLOCKER_REQUIRED});return;}
    const task=ask.task;setAsk(null);commit(task,'blocked',text);
  }
  const saved=()=>{load();onChanged?.();};
  const card=t=>{
    const projectText=t.project?`${t.project.code} · ${t.project.name}`:t.project_label,origin=t.details?.original_status;
    return <div key={t.id} className="mt-task mt-bcard" draggable={busyId!==t.id} onDragStart={e=>{e.dataTransfer.setData('application/x-zuri-task',t.id);e.dataTransfer.effectAllowed='move';}}>
      <button className="mt-task-open" onClick={()=>setEditor({task:t})}>
        <div className="mt-card-top"><span>{t.code}</span><VisibilityBadge level={t.visibility}/>{['Backlog','Ready'].includes(origin)&&<span className="mt-origin-badge" title="สถานะเดิมใน Workboard">{origin}</span>}</div>
        <h3>{t.title}</h3>
        {projectText&&<p className="mt-card-project">{projectText}</p>}
        <div className="mt-assignee"><span className="mt-avatar">{(t.roles.R?nameOf(dir,t.roles.R):t.owner_label||'?').slice(0,1)}</span><span>{t.roles.R?nameOf(dir,t.roles.R):t.owner_label||'ยังไม่มี R'}<small>{t.roles.R?'R':t.owner_label?'Owner (ข้อความ)':''}</small></span><span>{t.due_date?dateLabel(t.due_date):''}</span></div>
        {t.blocker&&t.status==='blocked'&&<p className="mt-warning">ติดขัด: {t.blocker}</p>}
      </button>
      <footer><span>{t.campaign_id?dir.campaigns.find(c=>c.id===t.campaign_id)?.name||'แคมเปญ':''}</span><label><span className="mc-sr-only">สถานะ {t.title}</span><select aria-label={`สถานะ ${t.code} ${t.title}`} disabled={busyId===t.id} value={t.status} onChange={e=>move(t,e.target.value)}>{TASK_STATUSES.map(s=><option key={s} value={s}>{LANES[s]}</option>)}</select></label></footer>
    </div>;
  };
  return <section className="mt-boards" aria-label="Boards">
    <div className="mt-boards-bar"><SegmentedControl value={effKind} options={KINDS.filter(k=>!(noMine&&k.value==='mine'))} onChange={v=>{setKind(v);setError('');}}/>
      {needsId&&(options.length?<Field label={KINDS.find(k=>k.value===effKind).label} value={boardId} options={options} onChange={setPickedId}/>:<p className="mc-note">{effKind==='team'?'ยังไม่มีฝ่าย · สร้างที่หน้า Members':effKind==='project'?'ยังไม่มีโปรเจกต์ · สร้างที่แท็บ Projects':'ยังไม่มีแคมเปญ'}</p>)}
      <div className="mt-boards-actions"><Button onClick={()=>{setError('');load();}}>โหลดใหม่</Button><Button className="mc-primary" onClick={()=>requestWrite(()=>setEditor({task:null}))}>＋ เพิ่มงาน</Button></div></div>
    {error&&<div className="mc-errors" role="alert">{error}<button aria-label="ปิดข้อความ" onClick={()=>setError('')}>×</button></div>}
    {tasks===null?<p role="status">กำลังโหลดงาน…</p>:<div className="mt-board">{TASK_STATUSES.map(lane=>{const cards=tasks.filter(t=>t.status===lane);return <section key={lane} className={`mt-lane ${lane}`} aria-label={LANES[lane]} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const t=tasks.find(t=>t.id===e.dataTransfer.getData('application/x-zuri-task'));if(t)move(t,lane);}}><header><h3>{LANES[lane]}</h3><span>{cards.length}</span></header>{cards.map(card)}{!cards.length&&<p className="mt-empty-lane">ยังไม่มีงานในช่องนี้</p>}</section>;})}</div>}
    {ask&&<Modal title="ย้ายไป ติดขัด" onClose={()=>setAsk(null)} wide={false}><form className="mt-form" onSubmit={confirmBlocker}>{ask.error&&<p className="mc-errors" role="alert">{ask.error}</p>}<p>{ask.task.code} · {ask.task.title}</p><Field label="เหตุที่ติดขัด" type="textarea" value={ask.text} onChange={text=>setAsk({...ask,text,error:''})} required wide maxLength={2000}/><div className="mc-form-actions"><Button type="button" onClick={()=>setAsk(null)}>ยกเลิก</Button><Button className="mc-primary" type="submit">ย้ายไป ติดขัด</Button></div></form></Modal>}
    {editor&&<TaskEditor key={editor.task?.id||'new'} businessId={businessId} task={editor.task} dir={dir} teams={teams} onClose={()=>setEditor(null)} onSaved={saved}/>}
  </section>;
}

const fromTask=(t={})=>({title:t.title||'',description:t.description||'',status:t.status||'planned',due_date:t.due_date||'',blocker:t.blocker||'',acceptance:t.acceptance||'',acceptance_proposed:!!t.acceptance_proposed,evidence:t.evidence||'',kpi_note:t.kpi_note||'',recheck_date:t.recheck_date||'',campaign_id:t.campaign_id||'',project_id:t.project_id||'',teamId:t.team_id||'',visibility:t.visibility||'business',viewer_ids:t.viewer_ids||[],visibilityReason:'',R:t.roles?.R||'',A:t.roles?.A||'',A_confirmed:!!t.roles?.A_confirmed,C:t.roles?.C||[],I:t.roles?.I||[]});
const FIELDS=['title','description','status','due_date','blocker','acceptance','acceptance_proposed','evidence','kpi_note','recheck_date','campaign_id','project_id'];
// Only what changed (a whole PATCH never overwrites a field the editor does not show); a create sends what was filled in.
function taskBody(before,draft,edit){
  const out={};
  for(const k of FIELDS)if(blank(draft[k])!==blank(before[k]))out[k]=k==='acceptance_proposed'?draft[k]:blank(draft[k]);
  if(blank(draft.teamId)!==blank(before.teamId))out.team_id=blank(draft.teamId);
  if(draft.visibility!==before.visibility)out.visibility=draft.visibility;
  if(!same([...draft.viewer_ids].sort(),[...before.viewer_ids].sort()))out.viewer_ids=draft.viewer_ids;
  const roles={R:blank(draft.R),A:blank(draft.A),A_confirmed:!!draft.A&&draft.A_confirmed,C:draft.C,I:draft.I},was={R:blank(before.R),A:blank(before.A),A_confirmed:!!before.A&&before.A_confirmed,C:before.C,I:before.I};
  if(!same(roles,was))out.roles=roles;
  if(widens({visibility:before.visibility,teamId:before.teamId},{visibility:draft.visibility,teamId:draft.teamId})&&edit&&draft.visibilityReason.trim())out.visibility_reason=draft.visibilityReason.trim();
  return out;
}
const asRuleTask=(d,t)=>ruleView({title:d.title,status:d.status,blocker:d.blocker,roles:{R:d.R,A:d.A,A_confirmed:!!d.A&&d.A_confirmed},acceptance:d.acceptance,acceptance_proposed:d.acceptance_proposed,evidence:d.evidence,kpi_note:d.kpi_note,recheck_date:d.recheck_date,campaign_id:d.campaign_id,due_date:d.due_date,details:t?.details,completion_rule:t?.completion_rule});

// Create (POST, one idempotency key per open form, kept on retry) and edit (PATCH with row_version) of one task.
export function TaskEditor({businessId,task,initial,dir,teams,onClose,onSaved}){
  const {canWrite,requestWrite}=useWriteAccess();
  const [current,setCurrent]=useState(task),[draft,setDraft]=useState(()=>fromTask(task||initial)),[error,setError]=useState(''),[busy,setBusy]=useState(false),[stale,setStale]=useState(false),key=useRef(null);
  const set=patch=>setDraft(d=>({...d,...patch})),original=fromTask(current||{});
  const campaignTask=!!current&&(!!current.details||current.source_kind==='campaign-legacy');
  const projects=[{value:'',label:'ไม่ผูกโปรเจกต์'},...dir.projects.filter(p=>p.status!=='archived'||p.id===draft.project_id).map(p=>({value:p.id,label:`${p.code} · ${p.name}${p.status==='archived'?' (เก็บถาวร)':''}`}))];
  const teamChoices=[{value:'',label:'ไม่ผูกฝ่าย'},...teams.filter(t=>!t.archived_at||t.id===draft.teamId).map(t=>({value:t.id,label:t.name+(t.archived_at?' (ปิดแล้ว)':'')}))];
  const campaigns=[{value:'',label:'ไม่ผูกแคมเปญ'},...dir.campaigns.filter(c=>!c.archived||c.id===draft.campaign_id).map(c=>({value:c.id,label:c.name}))];
  const people=key=>draft[key];
  async function submit(e){
    e.preventDefault();setError('');
    if(!draft.title.trim()){setError(RULE_MESSAGES.TITLE_REQUIRED);return;}
    const rule=saveError(current?ruleView(current):null,asRuleTask(draft,current));if(rule){setError(RULE_MESSAGES[rule]||rule);return;}
    const body=taskBody(original,draft,!!current);
    if(current&&!Object.keys(body).length){onClose();return;}
    setBusy(true);
    try{
      key.current??=crypto.randomUUID();
      const saved=pick(await scoped(businessId,current?`/tasks/${current.id}`:'/tasks',current?'PATCH':'POST',current?{row_version:current.row_version,...body}:{idempotency_key:key.current,...body}));
      onSaved(saved);onClose();
    }catch(err){setError(msg(err));if(err.status===409&&current)setStale(true);}finally{setBusy(false);}
  }
  async function reloadTask(){
    try{const fresh=pick(await scoped(businessId,`/tasks/${current.id}`));setCurrent(fresh);setDraft(fromTask(fresh));setStale(false);setError('');onSaved(fresh);}
    catch(err){setError(msg(err));}
  }
  return <Modal title={current?`${current.code} · รายละเอียดงาน`:'เพิ่มงาน'} onClose={onClose}>
    {!canWrite&&<div className="mt-readonly-note"><span>Guest mode · รายละเอียดงานอ่านอย่างเดียว</span><Button onClick={()=>requestWrite(null)}>แก้ไขงาน</Button></div>}
    <fieldset className="mt-access-fields" disabled={!canWrite}><form className="mt-form" onSubmit={submit}>
      {error&&<p className="mc-errors" role="alert">{error}{stale&&<> <Button type="button" onClick={reloadTask}>โหลดงานล่าสุด</Button></>}</p>}
      <div className="mc-form-grid">
        <Field label="ชื่องาน" value={draft.title} onChange={v=>set({title:v})} required wide maxLength={300}/>
        <Field label="รายละเอียดงาน" type="textarea" value={draft.description} onChange={v=>set({description:v})} hint="กรอกภายหลังได้" wide maxLength={20000}/>
        <Field label="สถานะงาน" value={draft.status} options={TASK_STATUSES.map(s=>({value:s,label:LANES[s]}))} onChange={v=>set({status:v})}/>
        <Field label="วันส่ง" type="date" value={draft.due_date} onChange={v=>set({due_date:v})}/>
        <Field label="เหตุที่ติดขัด" value={draft.blocker} onChange={v=>set({blocker:v})} required={draft.status==='blocked'} wide/>
        <Field label="R · ผู้ลงมือทำ / PIC" value={draft.R} options={memberOptions(dir.members,[draft.R])} onChange={v=>set({R:v})}/>
        <Field label="A · ผู้ตรวจรับ" value={draft.A} options={memberOptions(dir.members,[draft.A],'รอยืนยัน')} onChange={v=>set({A:v,A_confirmed:false})}/>
        <label className="mt-check wide"><input type="checkbox" checked={!!draft.A&&draft.A_confirmed} disabled={!draft.A} onChange={e=>set({A_confirmed:e.target.checked})}/> ยืนยัน A ที่ระบุไว้ (ก่อน Done)</label>
        {['C','I'].map(k=><fieldset key={k} className="mt-people"><legend>{k==='C'?'C · ผู้ให้คำปรึกษา':'I · ผู้รับทราบ'}</legend>{dir.members.filter(m=>m.status==='active'||people(k).includes(m.id)).map(m=><label key={m.id}><input type="checkbox" checked={people(k).includes(m.id)} onChange={e=>set({[k]:e.target.checked?[...people(k),m.id]:people(k).filter(id=>id!==m.id)})}/>{m.displayName}{m.status==='inactive'?' (Inactive)':''}</label>)}</fieldset>)}
        <Field label="เกณฑ์รับงาน" type="textarea" value={draft.acceptance} onChange={v=>set({acceptance:v})} wide/>
        <label className="mt-check wide"><input type="checkbox" checked={draft.acceptance_proposed} onChange={e=>set({acceptance_proposed:e.target.checked})}/> เกณฑ์ข้างต้นเป็นข้อเสนอ ยังไม่ยืนยัน (ต้องยืนยันก่อน Done)</label>
        <Field label="หลักฐานส่งงาน / ลิงก์ผลงาน" type="textarea" value={draft.evidence} onChange={v=>set({evidence:v})} wide/>
        <Field label="KPI ที่ต้องตรวจซ้ำ (ถ้ามี)" value={draft.kpi_note} onChange={v=>set({kpi_note:v})}/>
        <Field label="วันตรวจผลซ้ำ" type="date" value={draft.recheck_date} onChange={v=>set({recheck_date:v})}/>
        <Field label="โปรเจกต์" value={draft.project_id} options={projects} onChange={v=>set({project_id:v})} hint={!draft.project_id&&current?.project_label?`ข้อความโปรเจกต์เดิม: ${current.project_label}`:undefined}/>
        <Field label="ฝ่าย" value={draft.teamId} options={teamChoices} onChange={v=>set({teamId:v})}/>
        <Field label="แคมเปญที่เกี่ยวข้อง" value={draft.campaign_id} options={campaigns} onChange={v=>set({campaign_id:v})} disabled={campaignTask} hint={campaignTask?'งานของ Workboard · ย้ายแคมเปญที่หน้าแคมเปญ':undefined}/>
        {current?.owner_label&&<Field label="Owner (ข้อความเดิมจาก Workboard)" value={current.owner_label} onChange={()=>{}} readOnly hint="อ่านอย่างเดียว · กำหนด R เป็น Member ได้ที่ช่อง R"/>}
        <VisibilityFields value={draft} original={current?{visibility:current.visibility,teamId:current.team_id}:null} onChange={set} teams={teams} members={dir.members} peopleKey="viewer_ids" hint="R, A, C และ I เห็นงานเสมอเมื่อเป็นระดับฝ่ายหรือลับ · ผู้ดูแลธุรกิจไม่ได้เห็นงานลับโดยอัตโนมัติ"/>
      </div>
      <div className="mc-form-actions"><Button type="button" onClick={onClose}>ยกเลิก</Button><Button type="submit" className="mc-primary" disabled={busy}>{busy?'กำลังบันทึก…':'บันทึกงาน'}</Button></div>
    </form></fieldset>
  </Modal>;
}

function Projects({businessId,teams,dir,reloadDir,epoch,onChanged}){
  const {requestWrite,viewer}=useWriteAccess();
  const [open,setOpen]=useState(null),[page,setPage]=useState(null),[form,setForm]=useState(null),[editor,setEditor]=useState(null),[archived,setArchived]=useState(false),[error,setError]=useState('');
  async function loadPage(id=open){if(!id){setPage(null);return;}try{setPage(await scoped(businessId,`/projects/${id}`));setError('');}catch(e){setPage(null);setError(msg(e));}}
  useEffect(()=>{loadPage();},[open,epoch,viewer.kind,viewer.memberId]);
  const afterSave=async()=>{await reloadDir();await loadPage();};
  const team=id=>teams.find(t=>t.id===id)?.name;
  const shown=dir.projects.filter(p=>archived||p.status!=='archived');
  const errorBox=error&&<div className="mc-errors" role="alert">{error}<button aria-label="ปิดข้อความ" onClick={()=>setError('')}>×</button></div>;
  if(open){
    return <section className="mt-projects" aria-label="Project">
      <div className="mt-boards-bar"><Button onClick={()=>{setOpen(null);setPage(null);setError('');}}>← โปรเจกต์ทั้งหมด</Button>{page&&<div className="mt-boards-actions"><Button onClick={()=>requestWrite(()=>setForm({project:page.project}))}>แก้ไขโปรเจกต์</Button><Button className="mc-primary" onClick={()=>requestWrite(()=>setEditor({task:null}))}>＋ เพิ่มงานในโปรเจกต์</Button></div>}</div>
      {errorBox}{!page&&!error&&<p role="status">กำลังโหลดโปรเจกต์…</p>}
      {page&&<>
        <div className="mt-project-head"><div><span className="mt-origin-badge">{page.project.code}</span> <VisibilityBadge level={page.project.visibility}/><h3>{page.project.name}</h3>{page.project.description&&<p>{page.project.description}</p>}<small>{PROJECT_LABELS[page.project.status]} · เจ้าของ {nameOf(dir,page.project.owner_member_id)}{team(page.project.team_id)?` · ฝ่าย ${team(page.project.team_id)}`:''} · {dateLabel(page.project.planned_start)} – {dateLabel(page.project.planned_end)}</small></div></div>
        <div className="mt-counts" role="group" aria-label="จำนวนงานตามสถานะ">{TASK_STATUSES.map(s=><div key={s}><strong>{page.counts[s]||0}</strong><span>{LANES[s]}</span></div>)}</div>
        <div className="mt-all-tasks mt-backlog">{page.tasks.map(t=><button key={t.id} onClick={()=>setEditor({task:t})}><strong>{t.code} · {t.title}</strong><span>{LANES[t.status]} · {t.roles.R?nameOf(dir,t.roles.R):t.owner_label||'ยังไม่มี R'} · {dateLabel(t.due_date)}</span></button>)}{!page.tasks.length&&<p className="mc-note">โปรเจกต์นี้ยังไม่มีงาน</p>}</div>
      </>}
      {form&&<ProjectForm businessId={businessId} project={form.project} dir={dir} teams={teams} onClose={()=>setForm(null)} onSaved={afterSave}/>}
      {editor&&<TaskEditor key={editor.task?.id||'new'} businessId={businessId} task={editor.task} initial={{project_id:open}} dir={dir} teams={teams} onClose={()=>setEditor(null)} onSaved={()=>{loadPage();onChanged?.();}}/>}
    </section>;
  }
  return <section className="mt-projects" aria-label="Projects">
    <div className="mt-boards-bar"><div><h3>โปรเจกต์ <span>{shown.length}</span></h3><p className="mc-note">งานนอกแคมเปญที่ต้องการจัดกลุ่ม · ความคืบหน้านับงานตามสถานะ</p></div><div className="mt-boards-actions"><label className="mt-check"><input type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)}/> แสดงโปรเจกต์ที่เก็บถาวร</label><Button className="mc-primary" onClick={()=>requestWrite(()=>setForm({project:null}))}>＋ เพิ่มโปรเจกต์</Button></div></div>
    {errorBox}
    <div className="mt-project-grid">{shown.map(p=><button key={p.id} className={`mt-project ${p.status}`} onClick={()=>setOpen(p.id)}><div className="mt-card-top"><span>{p.code}</span><VisibilityBadge level={p.visibility}/><span className="mt-origin-badge">{PROJECT_LABELS[p.status]}</span></div><h3>{p.name}</h3><small>เจ้าของ {nameOf(dir,p.owner_member_id)}{team(p.team_id)?` · ฝ่าย ${team(p.team_id)}`:''}</small><small>{dateLabel(p.planned_start)} – {dateLabel(p.planned_end)}</small></button>)}</div>
    {!shown.length&&<p className="mc-note">ยังไม่มีโปรเจกต์ที่คุณเห็น</p>}
    {form&&<ProjectForm businessId={businessId} project={form.project} dir={dir} teams={teams} onClose={()=>setForm(null)} onSaved={afterSave}/>}
  </section>;
}

const fromProject=(p={},owner='')=>({name:p.name||'',description:p.description||'',status:p.status||'active',owner_member_id:p.owner_member_id||owner,teamId:p.team_id||'',planned_start:p.planned_start||'',planned_end:p.planned_end||'',visibility:p.visibility||'business',viewer_ids:p.viewer_ids||[],visibilityReason:''});
function ProjectForm({businessId,project,dir,teams,onClose,onSaved}){
  const {canWrite,viewer,requestWrite}=useWriteAccess();
  const [draft,setDraft]=useState(()=>fromProject(project||{},viewer.memberId||'')),[error,setError]=useState(''),[busy,setBusy]=useState(false),set=patch=>setDraft(d=>({...d,...patch})),original=fromProject(project||{},'');
  async function submit(e){
    e.preventDefault();setError('');
    const code=projectError({...draft,name:draft.name});if(code){setError(RULE_MESSAGES[code]||code);return;}
    if(!draft.owner_member_id){setError('ระบุเจ้าของโปรเจกต์');return;}
    const body={};
    for(const k of ['name','description','status','owner_member_id','planned_start','planned_end'])if(blank(draft[k])!==blank(original[k])||(!project&&k==='owner_member_id'))body[k]=k==='name'?draft.name.trim():blank(draft[k]);
    if(blank(draft.teamId)!==blank(original.teamId))body.team_id=blank(draft.teamId);
    if(draft.visibility!==original.visibility)body.visibility=draft.visibility;
    if(!same([...draft.viewer_ids].sort(),[...original.viewer_ids].sort()))body.viewer_ids=draft.viewer_ids;
    if(project&&widens({visibility:original.visibility,teamId:original.teamId},{visibility:draft.visibility,teamId:draft.teamId})&&draft.visibilityReason.trim())body.visibility_reason=draft.visibilityReason.trim();
    if(project&&!Object.keys(body).length){onClose();return;}
    setBusy(true);
    try{await scoped(businessId,project?`/projects/${project.id}`:'/projects',project?'PATCH':'POST',project?{row_version:project.row_version,...body}:body);await onSaved();onClose();}
    catch(err){setError(msg(err));}finally{setBusy(false);}
  }
  return <Modal title={project?`${project.code} · แก้ไขโปรเจกต์`:'เพิ่มโปรเจกต์'} onClose={onClose}>
    {!canWrite&&<div className="mt-readonly-note"><span>Guest mode · อ่านอย่างเดียว</span><Button onClick={()=>requestWrite(null)}>แก้ไขโปรเจกต์</Button></div>}
    <fieldset className="mt-access-fields" disabled={!canWrite}><form className="mt-form" onSubmit={submit}>
      {error&&<p className="mc-errors" role="alert">{error}</p>}
      <div className="mc-form-grid">
        <Field label="ชื่อโปรเจกต์" value={draft.name} onChange={v=>set({name:v})} required wide maxLength={80}/>
        <Field label="รายละเอียด" type="textarea" value={draft.description} onChange={v=>set({description:v})} hint="กรอกภายหลังได้" wide maxLength={20000}/>
        <Field label="สถานะ" value={draft.status} options={PROJECT_STATUSES.map(s=>({value:s,label:PROJECT_LABELS[s]}))} onChange={v=>set({status:v})}/>
        <Field label="เจ้าของโปรเจกต์" value={draft.owner_member_id} options={memberOptions(dir.members,[draft.owner_member_id],'เลือกเจ้าของ')} onChange={v=>set({owner_member_id:v})} required/>
        <Field label="ฝ่าย" value={draft.teamId} options={[{value:'',label:'ไม่ผูกฝ่าย'},...teams.filter(t=>!t.archived_at||t.id===draft.teamId).map(t=>({value:t.id,label:t.name+(t.archived_at?' (ปิดแล้ว)':'')}))]} onChange={v=>set({teamId:v})}/>
        <Field label="วันเริ่มตามแผน" type="date" value={draft.planned_start} onChange={v=>set({planned_start:v})}/>
        <Field label="วันจบตามแผน" type="date" value={draft.planned_end} onChange={v=>set({planned_end:v})}/>
        <VisibilityFields value={draft} original={project?{visibility:project.visibility,teamId:project.team_id}:null} onChange={set} teams={teams} members={dir.members} peopleKey="viewer_ids" hint="เจ้าของและผู้ชมที่ระบุยังคงเป็น metadata · Guest และ active Member อ่านและแก้ไขได้"/>
      </div>
      <div className="mc-form-actions"><Button type="button" onClick={onClose}>ยกเลิก</Button><Button type="submit" className="mc-primary" disabled={busy}>{busy?'กำลังบันทึก…':'บันทึกโปรเจกต์'}</Button></div>
    </form></fieldset>
  </Modal>;
}
