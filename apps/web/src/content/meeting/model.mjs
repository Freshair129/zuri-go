export const MOSCOW={must:'Must · ต้องทำ',should:'Should · ควรทำ',could:'Could · มีเวลาแล้วทำ',wont:'Won’t · ไม่ทำรอบนี้'};
export const STATUSES={planned:'งานสัปดาห์นี้',doing:'กำลังทำ',blocked:'ติดขัด',review:'รอตรวจรับ',done:'เสร็จแล้ว'};
export const uid=()=>crypto.randomUUID();
export const now=()=>new Date().toISOString();
export const empty=()=>({schemaVersion:1,revision:0,members:[],tasks:[],weeks:[],meetings:[],sources:[],reviews:[],batches:[],receipts:[],events:[],seedKeys:[]});
export const text=v=>typeof v==='string'&&v.trim()?v.trim():null;
const fail=message=>{throw Error(message);};
const required=(v,label)=>text(v)||fail(`กรุณากรอก${label}`);
export function weekOf(date){if(date==null||date==='')return '';if(!/^\d{4}-\d{2}-\d{2}$/.test(date))fail('วันที่ไม่ถูกต้อง');const d=new Date(`${date}T12:00:00Z`);if(Number.isNaN(+d)||d.toISOString().slice(0,10)!==date)fail('วันที่ไม่ถูกต้อง');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function addDays(date,n){const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export const memberName=(s,id)=>s.members.find(m=>m.id===id)?.displayName||'รอยืนยัน';
export const membership=(s,id,week)=>s.weeks.find(w=>w.weekStart===week)?.entries.find(e=>e.taskId===id);
const event=(s,type,taskId,detail)=>s.events.push({id:uid(),type,taskId,detail:structuredClone(detail),at:now(),actor:'ผู้ใช้ในเครื่อง'});
function checkVersion(old,expected){if(old&&expected!=null&&old.version!==expected)fail('ข้อมูลถูกแก้แล้ว กรุณาปิดแล้วเปิดรายการใหม่ก่อนบันทึก');}
function person(s,id,old){if(!id)return null;const member=s.members.find(m=>m.id===id);if(!member)fail('ไม่พบ Member ที่อ้างอิง');if(member.status==='inactive'&&id!==old)fail('สมาชิกนี้ปิดใช้งานอยู่ กรุณาเลือกคนที่ Active');return id;}
export function saveMember(s,input){
  const old=s.members.find(m=>m.id===input.id);checkVersion(old,input.version);
  const m={...(old||{id:input.id||uid(),createdAt:now(),version:0}),displayName:required(input.displayName??old?.displayName,'ชื่อที่ใช้แสดง'),status:input.status??old?.status??'active',updatedAt:now()};
  if(!['active','inactive'].includes(m.status))fail('สถานะ Member ไม่ถูกต้อง');
  for(const key of ['fullName','nickname','team','position','email','phone','notes'])m[key]=Object.hasOwn(input,key)?text(input[key]):old?.[key]??null;
  if(m.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email))fail('รูปแบบ Email ไม่ถูกต้อง');
  if(m.phone&&!/^[+\d() .-]{3,30}$/.test(m.phone))fail('รูปแบบเบอร์ติดต่อไม่ถูกต้อง');
  m.version++;if(old)s.members[s.members.indexOf(old)]=m;else s.members.push(m);return m.id;
}
export function setPriority(s,taskId,week,priority=null,priorityNote=null){
  if(!s.tasks.some(t=>t.id===taskId))fail('ไม่พบงาน');
  if(!week||weekOf(week)!==week)fail('กรุณาเลือกสัปดาห์ก่อนจัดลำดับ');
  if(priority!==null&&!Object.hasOwn(MOSCOW,priority))fail('Priority ต้องเป็น MoSCoW');
  let plan=s.weeks.find(w=>w.weekStart===week);if(!plan){plan={weekStart:week,timezone:'Asia/Bangkok',entries:[]};s.weeks.push(plan);}
  let item=plan.entries.find(e=>e.taskId===taskId);const before=item?{...item}:null;
  if(!item){item={taskId,priority:null,priorityNote:null};plan.entries.push(item);}
  item.priority=priority;item.priorityNote=text(priorityNote);event(s,'priority',taskId,{weekStart:week,before,after:{...item}});
}
export function saveTask(s,input,{week,priority=null,priorityNote=null}={}){
  const old=s.tasks.find(t=>t.id===input.id);checkVersion(old,input.version);
  const t={...(old||{id:input.id||uid(),createdAt:now(),version:0,sourceKind:'manual',sourceRefs:[]}),title:required(input.title??old?.title,'ชื่องาน'),updatedAt:now()};
  for(const key of ['description','deliverable','dueDate','acceptance','evidence','blocker','campaignId','project','dependency','kpi','recheckDate'])t[key]=Object.hasOwn(input,key)?text(input[key]):old?.[key]??null;
  for(const key of ['responsibleId','accountableId'])t[key]=person(s,Object.hasOwn(input,key)?input[key]:old?.[key],old?.[key]);
  for(const key of ['consultedIds','informedIds'])t[key]=[...new Set((input[key]??old?.[key]??[]).map(id=>person(s,id,old?.[key]?.includes(id)?id:null)).filter(Boolean))];
  t.accountableConfirmed=input.accountableConfirmed??old?.accountableConfirmed??false;
  // Visibility (FR-011-004, -005, -011) is enforced by the server; a widening reason is sent once and never kept.
  if(Object.hasOwn(input,'visibility'))t.visibility=input.visibility||null;if(Object.hasOwn(input,'teamId'))t.teamId=input.teamId||null;
  if(Object.hasOwn(input,'viewerIds'))t.viewerIds=[...new Set((input.viewerIds||[]).map(id=>person(s,id,old?.viewerIds?.includes(id)?id:null)).filter(Boolean))];
  if(text(input.visibilityReason))t.visibilityReason=text(input.visibilityReason);else delete t.visibilityReason;
  t.acceptanceProposed=input.acceptanceProposed??old?.acceptanceProposed??false;t.raciProposed=input.raciProposed??old?.raciProposed??false;
  if(old&&t.accountableId!==old.accountableId&&!Object.hasOwn(input,'accountableConfirmed'))t.accountableConfirmed=false;
  t.status=input.status??old?.status??'planned';t.statusConfirmed=input.statusConfirmed??old?.statusConfirmed??true;
  if(!Object.hasOwn(STATUSES,t.status))fail('สถานะงานไม่ถูกต้อง');
  for(const key of ['dueDate','recheckDate'])if(t[key])weekOf(t[key]);
  if(t.status==='blocked'&&!t.blocker)fail('ระบุเหตุที่ติดขัดก่อนบันทึก');
  if(t.status==='done'){
    if(!t.responsibleId||!t.accountableId||!t.accountableConfirmed||!t.acceptance||t.acceptanceProposed||!t.evidence)fail('ก่อน Done ต้องมี R, A ที่ยืนยัน, เกณฑ์รับงานที่ยืนยัน และหลักฐาน');
    if(t.kpi&&!t.recheckDate)fail('งานที่ผูก KPI ต้องมีวันตรวจผลซ้ำ');
  }
  if(!old&&input.sourceKind){if(!['manual','manual-from-meeting','meeting','weekly-plan'].includes(input.sourceKind))fail('แหล่งงานไม่ถูกต้อง');t.sourceKind=input.sourceKind;t.sourceRefs=structuredClone(input.sourceRefs||[]);}
  t.version++;if(old)s.tasks[s.tasks.indexOf(old)]=t;else s.tasks.push(t);
  if(week)setPriority(s,t.id,week,priority,priorityNote);
  event(s,old?'task-updated':'task-created',t.id,{before:old||null,after:t});return t.id;
}
export function seedWorkspace(s,seed){
  if(s.seedKeys.includes(seed.seedKey))return;
  const members=new Map();for(const row of seed.members){let m=s.members.find(m=>m.seedMemberId===row.seedMemberId);if(!m){const id=saveMember(s,row);m=s.members.find(m=>m.id===id);m.seedMemberId=row.seedMemberId;}members.set(row.seedMemberId,m.id);}
  const byName=name=>s.members.find(m=>m.seedMemberId&&m.displayName===name)?.id;
  for(const row of seed.tasks){const id=saveTask(s,{title:row.title,description:null,deliverable:row.deliverable,responsibleId:members.get(row.responsibleMemberSeedId),consultedIds:row.consultedNames.map(byName).filter(Boolean),informedIds:row.informedNames.map(byName).filter(Boolean),status:'planned',statusConfirmed:false,acceptance:row.acceptance.join('\n'),sourceKind:'weekly-plan'},{week:seed.weekStart});const t=s.tasks.find(t=>t.id===id);t.seedTaskId=row.sourceTaskId;t.raciProposed=true;t.acceptanceProposed=true;t.sourceUrl=row.sourceUrl;}
  s.seedKeys.push(seed.seedKey);
}
export function weeklyRows(s,week){return (s.weeks.find(w=>w.weekStart===week)?.entries||[]).map(e=>({...s.tasks.find(t=>t.id===e.taskId),...e}));}
export function weeklySummary(rows){const active=rows.filter(t=>['must','should','could'].includes(t.priority));return {total:rows.length,planned:active.length,done:active.filter(t=>t.status==='done').length,unknown:rows.filter(t=>!t.priority).length,deferred:rows.filter(t=>t.priority==='wont').length,blocked:active.filter(t=>t.status==='blocked').length,percent:active.length&&active.every(t=>t.statusConfirmed)?Math.round(active.filter(t=>t.status==='done').length/active.length*100):null};}
export function addSource(s,snapshot,recording){
  required(snapshot.sourceInstanceId,'source instance');required(snapshot.recordingId,'recording');required(snapshot.contentHash,'source hash');
  if(!['native','legacy'].includes(snapshot.sourceMode)||!Array.isArray(snapshot.segments))fail('รูปแบบ source snapshot ไม่ถูกต้อง');
  for(const seg of snapshot.segments)if(!seg.segmentId||!Number.isFinite(seg.startMs)||!Number.isFinite(seg.endMs)||seg.startMs<0||seg.endMs<seg.startMs||typeof seg.text!=='string')fail('ช่วงข้อความต้นทางไม่ถูกต้อง');
  let meeting=s.meetings.find(m=>m.sourceInstanceId===snapshot.sourceInstanceId&&m.projectId===snapshot.projectId&&m.recordingId===snapshot.recordingId);
  if(!meeting){meeting={id:uid(),sourceInstanceId:snapshot.sourceInstanceId,projectId:snapshot.projectId,recordingId:snapshot.recordingId,title:recording.title||recording.name||snapshot.recordingId,meetingStartedAt:snapshot.meetingStartedAt||null,createdAt:now(),sourceId:null};s.meetings.push(meeting);}
  if(Array.isArray(recording.channels))meeting.channels=recording.channels.filter(c=>['file','mic','system'].includes(c));
  if(recording.originalFilename)meeting.originalFilename=recording.originalFilename;
  let source=s.sources.find(src=>src.meetingId===meeting.id&&src.contentHash===snapshot.contentHash);
  if(!source){source={...structuredClone(snapshot),id:uid(),meetingId:meeting.id};s.sources.push(source);}
  meeting.latestSourceId=source.id;if(!meeting.sourceId)meeting.sourceId=source.id;return meeting.id;
}
export function adoptSource(s,meetingId,sourceId){const meeting=s.meetings.find(m=>m.id===meetingId);if(!meeting||!s.sources.some(v=>v.meetingId===meetingId&&v.id===sourceId))fail('ไม่พบฉบับต้นทาง');meeting.sourceId=sourceId;}
export function saveReview(s,input){
  const source=s.sources.find(v=>v.id===input.sourceId),meeting=s.meetings.find(m=>m.id===source?.meetingId);if(!source||meeting.sourceId!==source.id)fail('ต้นฉบับเปลี่ยน กรุณาตรวจใหม่');
  if(!Array.isArray(input.segments)||input.segments.length!==source.segments.length)fail('จำนวน segment ไม่ตรงกับต้นทาง');
  input.segments.forEach((seg,i)=>{const original=source.segments[i];if(seg.segmentId!==original.segmentId||seg.startMs!==original.startMs||seg.endMs!==original.endMs||typeof seg.text!=='string')fail('ห้ามเปลี่ยน segment หรือ timecode');});
  const review={id:input.id||uid(),meetingId:meeting.id,sourceId:source.id,parentRevisionId:meeting.reviewId||null,segments:structuredClone(input.segments),reviewHash:input.reviewHash,reviewedAt:now()};s.reviews.push(review);meeting.reviewId=review.id;return review.id;
}
export function isBatchStale(s,batch){const meeting=s.meetings.find(m=>m.id===batch.meetingId);return !meeting||meeting.reviewId!==batch.reviewRevisionId||meeting.sourceId!==batch.sourceId||meeting.latestSourceId!==batch.sourceId;}
export function validateEvidence(review,evidence){if(!Array.isArray(evidence)||!evidence.length)fail('งานจากประชุมต้องมีหลักฐาน');for(const e of evidence){const seg=review.segments.find(seg=>seg.segmentId===e.segmentId);if(!seg||!text(e.quote)||!seg.text.includes(e.quote)||!Number.isFinite(e.startMs)||!Number.isFinite(e.endMs)||e.startMs<seg.startMs||e.endMs>seg.endMs||e.endMs<e.startMs||e.reviewRevisionId!==review.id)fail('ข้อความอ้างอิงไม่ตรงฉบับตรวจแล้ว');}}
export function addBatch(s,meetingId,response){
  const meeting=s.meetings.find(m=>m.id===meetingId),review=s.reviews.find(r=>r.id===meeting?.reviewId),source=s.sources.find(src=>src.id===meeting?.sourceId);
  if(!review||review.id!==response.reviewRevisionId||review.reviewHash!==response.reviewHash||source.contentHash!==response.sourceHash)fail('ผลร่างอ้างฉบับเก่า กรุณาตรวจใหม่');
  if(!Array.isArray(response.items)||response.items.length>30)fail('รูปแบบร่างงานไม่ถูกต้อง');
  const ids=new Set();for(const item of response.items){if(ids.has(item.proposalId)||!item.proposalId||!text(item.title)||!['task','decision','question'].includes(item.kind))fail('รายการร่างไม่ถูกต้อง');ids.add(item.proposalId);validateEvidence(review,item.evidence);}
  const old=s.batches.find(b=>b.id===response.draftBatchId);if(old)return old.id;
  const batch={...structuredClone(response),id:required(response.draftBatchId,'batch ID'),meetingId,sourceId:source.id};s.batches.push(batch);return batch.id;
}
export function commitBatch(s,batchId,choices,payloadHash=null){
  const batch=s.batches.find(b=>b.id===batchId);if(!batch)fail('ไม่พบร่างงาน');
  if(!Array.isArray(choices)||new Set(choices.map(c=>c.proposalId)).size!==choices.length)fail('รายการที่เลือกซ้ำหรือไม่ถูกต้อง');
  const payload=JSON.stringify(choices),receipt=s.receipts.find(r=>r.batchId===batchId);
  if(receipt){if(receipt.payload!==payload)fail('Conflict: ร่างนี้เคยบันทึกแล้วด้วยรายละเอียดต่างกัน');return receipt.taskIds;}
  if(isBatchStale(s,batch))fail('ร่างเก่าใช้สร้างงานไม่ได้ กรุณาตรวจฉบับใหม่');
  const taskIds=[],review=s.reviews.find(r=>r.id===batch.reviewRevisionId),meeting=s.meetings.find(m=>m.id===batch.meetingId);
  for(const choice of choices){if(choice.mode==='skip')continue;const item=batch.items.find(i=>i.proposalId===choice.proposalId);if(!item)fail('ไม่พบรายการร่าง');validateEvidence(review,item.evidence);
    const ref={meetingId:batch.meetingId,sourceId:batch.sourceId,reviewRevisionId:review.id,proposalId:item.proposalId,evidence:item.evidence};let id;
    if(choice.mode==='link'){const t=s.tasks.find(t=>t.id===choice.taskId);if(!t)fail('กรุณาเลือกงานที่ต้องการผูก');checkVersion(t,choice.taskVersion);if(!t.sourceRefs.some(r=>r.proposalId===item.proposalId&&r.reviewRevisionId===review.id))t.sourceRefs.push(ref);t.version++;event(s,'source-linked',t.id,ref);id=t.id;if(choice.week)setPriority(s,id,choice.week,choice.priority??null,choice.priorityNote);}
    else {if(!['create','update'].includes(choice.mode))fail('วิธีสร้างงานไม่ถูกต้อง');if(!choice.responsibleId)fail('เลือกรายชื่อ R ก่อนสร้างงานจากประชุม');const old=choice.mode==='update'?s.tasks.find(t=>t.id===choice.taskId):null;if(choice.mode==='update'&&!old)fail('ไม่พบงานที่จะอัปเดต');id=saveTask(s,{...(old?{id:old.id,version:choice.taskVersion}:{}),title:choice.title,description:choice.description,deliverable:item.deliverable,responsibleId:choice.responsibleId,accountableId:choice.accountableId||null,dueDate:choice.dueDate||null,sourceKind:'meeting',sourceRefs:[ref]},{week:choice.week,priority:choice.priority??null,priorityNote:choice.priorityNote});if(old)s.tasks.find(t=>t.id===id).sourceRefs.push(ref);}
    taskIds.push(id);
  }
  if(!taskIds.length)fail('กรุณาเลือกรายการที่จะสร้างหรือผูกงาน');const selected=choices.filter(c=>c.mode!=='skip');s.receipts.push({id:uid(),batchId,idempotencyKey:[meeting.sourceInstanceId,meeting.projectId,meeting.recordingId,review.id,review.reviewHash,batchId].join(':'),payloadHash,payload,taskIds,mappings:selected.map((c,i)=>({proposalId:c.proposalId,taskId:taskIds[i]})),committedAt:now()});return taskIds;
}
export function validateState(s){
  if(s?.schemaVersion!==1||!Number.isInteger(s.revision)||s.revision<0)fail('Version ข้อมูล Meeting & Task Manager ไม่รองรับ');
  for(const key of ['members','tasks','weeks','meetings','sources','reviews','batches','receipts','events','seedKeys'])if(!Array.isArray(s[key]))fail(`ข้อมูล ${key} ไม่ถูกต้อง`);
  for(const key of ['members','tasks','meetings','sources','reviews','batches','receipts','events']){const ids=s[key].map(v=>v?.id);if(ids.some(v=>typeof v!=='string'||!v)||new Set(ids).size!==ids.length)fail(`ID ${key} ไม่ถูกต้องหรือซ้ำ`);}
  const optionalText=(row,keys)=>{for(const key of keys)if(row[key]!=null&&typeof row[key]!=='string')fail(`รูปแบบ ${key} ต้องเป็นข้อความ`);};
  for(const m of s.members)optionalText(m,['fullName','nickname','team','position','email','phone','notes']);
  for(const t of s.tasks){optionalText(t,['description','deliverable','acceptance','evidence','blocker','campaignId','project','dependency','kpi','sourceKind']);for(const key of ['dueDate','recheckDate'])if(t[key]!=null)weekOf(t[key]);if(!Number.isInteger(t.version)||t.version<1)fail('Version Task ไม่ถูกต้อง');if(t.status==='blocked'&&!text(t.blocker))fail('งานที่ติดขัดไม่มีเหตุผล');if(t.status==='done'&&(t.acceptanceProposed||(t.kpi&&!t.recheckDate)))fail('งาน Done ยังไม่ผ่านเกณฑ์');}
  for(const m of s.members)if(!text(m.displayName)||!['active','inactive'].includes(m.status))fail('ข้อมูล Member ไม่ถูกต้อง');
  const memberIds=new Set(s.members.map(m=>m.id)),taskIds=new Set(s.tasks.map(t=>t.id));
  for(const t of s.tasks){if(!text(t.title)||!Object.hasOwn(STATUSES,t.status)||!Array.isArray(t.sourceRefs)||!Array.isArray(t.consultedIds)||!Array.isArray(t.informedIds))fail('ข้อมูล Task ไม่ถูกต้อง');for(const id of [t.responsibleId,t.accountableId,...t.consultedIds,...t.informedIds].filter(Boolean))if(!memberIds.has(id))fail('งานอ้างสมาชิกที่ไม่มีอยู่ กรุณาแก้ backup ก่อน');if(t.status==='done'&&(!t.responsibleId||!t.accountableId||!t.accountableConfirmed||!t.acceptance||!t.evidence))fail('งาน Done ไม่มีข้อมูลตรวจรับครบ');}
  const weeks=new Set();for(const w of s.weeks){if(weeks.has(w.weekStart)||weekOf(w.weekStart)!==w.weekStart||!w.weekStart||!Array.isArray(w.entries))fail('ข้อมูลสัปดาห์ไม่ถูกต้อง');weeks.add(w.weekStart);const ids=new Set();for(const e of w.entries){if(ids.has(e.taskId)||!taskIds.has(e.taskId)||(e.priority!==null&&!Object.hasOwn(MOSCOW,e.priority)))fail('Membership / priority ไม่ถูกต้อง');ids.add(e.taskId);}}
  for(const src of s.sources)if(!s.meetings.some(m=>m.id===src.meetingId)||!Array.isArray(src.segments))fail('Source ไม่ตรง meeting');
  for(const r of s.reviews)if(!s.sources.some(src=>src.id===r.sourceId&&src.meetingId===r.meetingId)||!Array.isArray(r.segments))fail('Review ไม่ตรง source');
  for(const m of s.meetings){if(!text(m.title)||![m.sourceId,m.latestSourceId].every(id=>s.sources.some(src=>src.id===id&&src.meetingId===m.id))||(m.reviewId&&!s.reviews.some(r=>r.id===m.reviewId&&r.meetingId===m.id)))fail('Meeting อ้างฉบับที่ไม่มีอยู่');if(m.channels&&(!Array.isArray(m.channels)||m.channels.some(c=>!['file','mic','system'].includes(c))))fail('ช่องเสียงไม่ถูกต้อง');}
  for(const doc of [...s.sources,...s.reviews])for(const seg of doc.segments){if(typeof seg.segmentId!=='string'||typeof seg.text!=='string'||!Number.isFinite(seg.startMs)||!Number.isFinite(seg.endMs)||seg.startMs<0||seg.endMs<seg.startMs)fail('Segment ไม่ถูกต้อง');optionalText(seg,['speakerLabel']);}
  for(const t of s.tasks)for(const ref of t.sourceRefs){const review=s.reviews.find(r=>r.id===ref.reviewRevisionId&&r.meetingId===ref.meetingId&&r.sourceId===ref.sourceId);if(!review)fail('งานอ้างฉบับประชุมที่ไม่มีอยู่');validateEvidence(review,ref.evidence);}
  for(const b of s.batches)if(!s.reviews.some(r=>r.id===b.reviewRevisionId&&r.sourceId===b.sourceId)||!Array.isArray(b.items))fail('Batch ไม่ตรง review');
  for(const r of s.receipts)if(!s.batches.some(b=>b.id===r.batchId)||!Array.isArray(r.taskIds)||r.taskIds.some(id=>!taskIds.has(id)))fail('Receipt ไม่ตรง task');
  return s;
}
export async function hash(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');}
export const reviewHash=(id,segments)=>hash([id,segments.map(s=>[s.segmentId,s.startMs,s.endMs,s.text,s.speakerLabel??null])]);
