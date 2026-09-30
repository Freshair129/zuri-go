import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {empty,hash,canonicalChoices,seedWorkspace,saveMember,saveTask,setPriority,weekOf,weeklyRows,weeklySummary,membership,validateState,addSource,saveReview,reviewHash,addBatch,commitBatch,isBatchStale,validateEvidence} from './model.mjs';
import {parseConnection,createFungClient} from './fung-client.mjs';
const seed=JSON.parse(await readFile(new URL('./seed.json',import.meta.url),'utf8'));
const fresh=()=>{const s=empty();seedWorkspace(s,seed);return s;};
function meetingFixture(){const s=fresh(),source={schemaVersion:1,sourceInstanceId:'fixture',projectId:'p1',recordingId:'r1',contentHash:'source-1',sourceMode:'native',segments:[{segmentId:'segment-1',startMs:1000,endMs:4000,text:'Chef เลือกแบบเว็บ',speakerLabel:null}]};const meetingId=addSource(s,source,{title:'Fixture meeting'});const sourceId=s.meetings[0].sourceId;const reviewId=saveReview(s,{id:'review-1',sourceId,segments:source.segments,reviewHash:'review-hash'});const evidence=[{segmentId:'segment-1',startMs:1000,endMs:4000,quote:'เลือกแบบเว็บ',reviewRevisionId:reviewId}];const reply={draftBatchId:'batch-1',sourceHash:'source-1',reviewRevisionId:reviewId,reviewHash:'review-hash',generatedAt:new Date().toISOString(),items:[{proposalId:'proposal-1',kind:'task',title:'เลือกแบบเว็บ',deliverable:'แบบที่เลือก',evidence}]};addBatch(s,meetingId,reply);const choices=[{proposalId:'proposal-1',mode:'create',title:'เลือกแบบเว็บ',description:null,responsibleId:s.members[0].id,week:'2026-09-28',priority:'must'}];return {s,source,sourceId,meetingId,reviewId,evidence,reply,choices};}

test('seed repeats preserve 5 tasks, 4 members, names and user edits',()=>{const s=fresh();saveTask(s,{id:s.tasks[0].id,description:'เติมภายหลัง'});seedWorkspace(s,seed);assert.equal(s.tasks.length,5);assert.equal(s.members.length,4);assert.equal(s.tasks[0].description,'เติมภายหลัง');assert.equal(weeklySummary(weeklyRows(s,seed.weekStart)).unknown,5);assert.equal(weeklySummary(weeklyRows(s,seed.weekStart)).percent,null);});
test('title-only tasks and name-only members keep optional values null',()=>{const s=empty();const member=saveMember(s,{displayName:'ทดสอบ'});const id=saveTask(s,{title:'งานทดสอบ'});assert.equal(s.tasks[0].description,null);assert.equal(s.members[0].phone,null);assert.equal(s.weeks.length,0);assert.ok(member&&id);assert.throws(()=>saveTask(s,{title:'   '}));assert.throws(()=>saveMember(s,{displayName:''}));});
test('later details preserve ID, R, state and week; omitted differs from null',()=>{const s=fresh(),t=structuredClone(s.tasks[0]);saveTask(s,{id:t.id,description:'รายละเอียด\nภาษาไทย'});assert.equal(s.tasks[0].responsibleId,t.responsibleId);assert.equal(s.tasks[0].statusConfirmed,false);assert.equal(s.weeks[0].entries[0].priority,null);saveTask(s,{id:t.id,title:'ชื่อใหม่'});assert.equal(s.tasks[0].description,'รายละเอียด\nภาษาไทย');saveTask(s,{id:t.id,description:null});assert.equal(s.tasks[0].description,null);});
test('member phone stays a string and rename keeps task references',()=>{const s=fresh(),id=s.members[0].id;saveMember(s,{id,displayName:'Chef ใหม่',phone:'0812345678',notes:'ภายหลัง\nสองบรรทัด'});assert.equal(s.members[0].phone,'0812345678');assert.equal(s.tasks[0].responsibleId,id);assert.equal(s.members[0].notes,'ภายหลัง\nสองบรรทัด');});
test('duplicate names remain separate; inactive cannot take new assignments',()=>{const s=fresh(),id=s.members[0].id;saveMember(s,{displayName:'Chef'});assert.equal(s.members.filter(m=>m.displayName==='Chef').length,2);saveMember(s,{id,status:'inactive'});assert.throws(()=>saveTask(s,{title:'ใหม่',responsibleId:id}),/Active/);assert.doesNotThrow(()=>saveTask(s,{id:s.tasks[0].id,description:'แก้รายละเอียด'}));assert.equal(s.tasks[0].responsibleId,id);});
test('stale form version cannot overwrite concurrent edits',()=>{const s=fresh(),t={...s.tasks[0]};saveTask(s,{id:t.id,version:t.version,description:'ใหม่'});assert.throws(()=>saveTask(s,{id:t.id,version:t.version,title:'ทับ'}),/ถูกแก้/);});
test('MoSCoW never changes task status and is independent per week',()=>{const s=fresh(),id=s.tasks[0].id;setPriority(s,id,'2026-09-28','must','จำเป็น');setPriority(s,id,'2026-10-05');assert.equal(membership(s,id,'2026-09-28').priority,'must');assert.equal(membership(s,id,'2026-10-05').priority,null);setPriority(s,id,'2026-09-28','wont');assert.equal(s.tasks[0].status,'planned');assert.throws(()=>setPriority(s,id,'2026-09-28','high'));assert.throws(()=>setPriority(s,id,'2026-09-29','must'));});
test('summary excludes Won’t/unclassified and never asserts unknown progress',()=>{const s=fresh();setPriority(s,s.tasks[0].id,seed.weekStart,'must');setPriority(s,s.tasks[1].id,seed.weekStart,'wont');let summary=weeklySummary(weeklyRows(s,seed.weekStart));assert.equal(summary.planned,1);assert.equal(summary.deferred,1);assert.equal(summary.percent,null);saveTask(s,{id:s.tasks[0].id,status:'doing',statusConfirmed:true});summary=weeklySummary(weeklyRows(s,seed.weekStart));assert.equal(summary.percent,0);});
test('Done needs confirmed A, accepted criteria, evidence; no artificial due required',()=>{const s=fresh(),t=s.tasks[0];assert.throws(()=>saveTask(s,{id:t.id,status:'done'}),/ก่อน Done/);const copy=structuredClone(s);saveTask(copy,{id:t.id,status:'done',accountableId:s.members[1].id,accountableConfirmed:true,acceptanceProposed:false,evidence:'ผลที่ตรวจแล้ว'});assert.equal(copy.tasks[0].dueDate,null);assert.equal(copy.tasks[0].status,'done');assert.throws(()=>saveTask(copy,{id:t.id,kpi:'CTR'}),/ตรวจผลซ้ำ/);});
test('Blocked requires a reason',()=>{const s=fresh();assert.throws(()=>saveTask(s,{id:s.tasks[0].id,status:'blocked'}),/เหตุที่ติดขัด/);});
test('history snapshots do not change when tasks are updated',()=>{const s=fresh(),before=JSON.stringify(s.events);saveTask(s,{id:s.tasks[0].id,description:'แก้แล้ว'});assert.equal(JSON.stringify(s.events.slice(0,-1)),before);});
test('week boundaries and invalid dates',()=>{assert.equal(weekOf('2026-10-04'),'2026-09-28');assert.equal(weekOf('2026-10-05'),'2026-10-05');assert.equal(weekOf(''),'');assert.throws(()=>weekOf('2026-02-31'));assert.throws(()=>weekOf('invalid'));assert.throws(()=>saveTask(fresh(),{title:'bad date',dueDate:'invalid'}));});
test('backup validates all member and weekly references',()=>{const s=fresh();assert.doesNotThrow(()=>validateState(JSON.parse(JSON.stringify(s))));const bad=structuredClone(s);bad.tasks[0].responsibleId='missing';assert.throws(()=>validateState(bad),/สมาชิก/);const wrong=structuredClone(s);wrong.weeks[0].entries[0].priority='urgent';assert.throws(()=>validateState(wrong),/priority/);});
test('backup rejects malformed text, dates and dangling source references before render',()=>{const s=fresh();s.tasks[0].description={bad:true};assert.throws(()=>validateState(s),/ข้อความ/);s.tasks[0].description=null;s.tasks[0].dueDate='invalid';assert.throws(()=>validateState(s),/วันที่/);const f=meetingFixture();f.s.meetings[0].sourceId='missing';assert.throws(()=>validateState(f.s),/Meeting/);});
test('source import replay does not create duplicate meetings or snapshots',()=>{const {s,source}=meetingFixture();addSource(s,source,{title:'Same'});assert.equal(s.meetings.length,1);assert.equal(s.sources.length,1);});
test('review preserves raw source/timecodes and blocks changing spans',()=>{const {s,sourceId}=meetingFixture();const segments=structuredClone(s.sources[0].segments);segments[0].text='Chef เลือกแบบเว็บไซต์';saveReview(s,{sourceId,segments,reviewHash:'new'});assert.equal(s.sources[0].segments[0].text,'Chef เลือกแบบเว็บ');segments[0].startMs=0;assert.throws(()=>saveReview(s,{sourceId,segments,reviewHash:'bad'}),/timecode/);});
test('draft evidence requires exact quote and finite source timecodes',()=>{const {s,evidence}=meetingFixture();assert.doesNotThrow(()=>validateEvidence(s.reviews[0],evidence));assert.throws(()=>validateEvidence(s.reviews[0],[{...evidence[0],quote:'แต่งขึ้น'}]));assert.throws(()=>validateEvidence(s.reviews[0],[{...evidence[0],startMs:undefined}]));});
test('batch replay gives same IDs; changed payload conflicts',()=>{const {s,choices}=meetingFixture();const ids=commitBatch(s,'batch-1',choices);assert.equal(s.tasks.length,6);assert.deepEqual(commitBatch(s,'batch-1',choices),ids);assert.equal(s.tasks.length,6);assert.throws(()=>commitBatch(s,'batch-1',[{...choices[0],title:'เปลี่ยน'}]),/Conflict/);assert.equal(s.receipts.length,1);});
test('duplicate proposal selection is refused',()=>{const {s,choices}=meetingFixture();assert.throws(()=>commitBatch(s,'batch-1',[choices[0],choices[0]]),/ซ้ำ/);});
test('refreshed source invalidates old draft without rewriting committed task',()=>{const {s,choices,source,meetingId}=meetingFixture();const ids=commitBatch(s,'batch-1',choices),title=s.tasks.find(t=>t.id===ids[0]).title;addSource(s,{...source,contentHash:'source-new',segments:[{...source.segments[0],text:'เปลี่ยนข้อความ'}]},{title:'new'});assert.equal(isBatchStale(s,s.batches[0]),true);assert.equal(s.tasks.find(t=>t.id===ids[0]).title,title);assert.equal(s.meetings.find(m=>m.id===meetingId).sourceId,s.sources[0].id);});
test('new review makes draft stale and prevents commit',()=>{const {s,choices,sourceId,source}=meetingFixture();saveReview(s,{sourceId,segments:source.segments,reviewHash:'new'});assert.throws(()=>commitBatch(s,'batch-1',choices),/ร่างเก่า/);});
test('link existing task preserves task fields and count',()=>{const {s,choices}=meetingFixture();const old=structuredClone(s.tasks[0]);const ids=commitBatch(s,'batch-1',[{...choices[0],mode:'link',taskId:old.id,taskVersion:old.version}]);assert.equal(s.tasks.length,5);assert.equal(ids[0],old.id);assert.equal(s.tasks[0].title,old.title);assert.equal(s.tasks[0].sourceRefs.length,1);});
test('review fingerprint is deterministic and text-sensitive',async()=>{const segments=[{segmentId:'1',startMs:0,endMs:100,text:'ไทย',speakerLabel:null}];assert.equal(await reviewHash('r',segments),await reviewHash('r',structuredClone(segments)));assert.notEqual(await reviewHash('r',segments),await reviewHash('r',[{...segments[0],text:'อื่น'}]));});
test('connector refuses non-loopback, credentials, paths and query secrets',()=>{assert.equal(parseConnection('http://127.0.0.1:9999/#fixture-token').origin,'http://127.0.0.1:9999');for(const v of ['https://example.com/#fixture','http://127.0.0.1.evil.com/#fixture','http://user@localhost/#fixture','http://localhost/redirect#fixture','http://localhost/?token=fixture','http://localhost/'])assert.throws(()=>parseConnection(v));});
test('connection checks authenticated recordings; bearer never goes in URL',async()=>{const calls=[];const client=createFungClient('http://127.0.0.1:9999/#fixture-only',{fetchImpl:async(url,init)=>{calls.push({url,init});return new Response(JSON.stringify(url.endsWith('/recordings')?{recordings:[]}:{protocolVersion:1}),{status:200});}});await client.connect();assert.equal(calls.length,2);for(const call of calls){assert.ok(!call.url.includes('fixture-only'));assert.equal(call.init.headers.Authorization,'Bearer fixture-only');assert.equal(call.init.redirect,'error');assert.equal(call.init.credentials,'omit');}client.disconnect();await assert.rejects(client.recordings(),/ยกเลิก/);});
test('unauthorized connection remains an error',async()=>{const client=createFungClient('http://localhost/#fixture',{fetchImpl:async()=>new Response('{}',{status:401})});await assert.rejects(client.connect(),/Token/);});
test('audio defaults to server channel and import sends safe Unicode filename header',async()=>{const calls=[];const client=createFungClient('http://localhost/#fixture',{fetchImpl:async(url,init)=>{calls.push({url,init});return new Response(JSON.stringify({jobId:'j',recordingId:'r',projectId:'p'}),{status:200});}});await client.audio('rec-live');await client.audio('rec-live','mic');await client.upload(new File(['audio'],'เสียงประชุม.wav',{type:'audio/wav'}));assert.ok(calls[0].url.endsWith('/audio'));assert.ok(calls[1].url.endsWith('/audio?channel=mic'));assert.equal(calls[2].init.headers['X-Fung-Filename'],'meeting-upload.wav');});

test('commit receipt binds canonical payload and proposal-to-task mapping',async()=>{const {s,choices}=meetingFixture();const fingerprint=await hash(choices);const ids=commitBatch(s,'batch-1',choices,fingerprint);assert.equal(s.receipts[0].payloadHash,fingerprint);assert.equal(s.receipts[0].mappings[0].taskId,ids[0]);assert.equal(s.receipts[0].mappings[0].proposalId,choices[0].proposalId);assert.ok(s.receipts[0].idempotencyKey.includes('review-1'));});

// A revision kept on the recording machine is a stub marked `withheld` (FR-011-010, SDD-011 "Meetings (P3)").
function stubbed(){const f=meetingFixture(),ids=commitBatch(f.s,'batch-1',f.choices),s=structuredClone(f.s);for(const doc of [...s.sources,...s.reviews]){doc.segments=[];doc.withheld=true;}for(const i of s.batches[0].items)i.evidence=i.evidence.map(({quote,...place})=>place);return {...f,s,ids};}
test('a state of stubs validates, and only the marker allows it',()=>{
  const {s}=stubbed();assert.doesNotThrow(()=>validateState(s));
  const unmarked=structuredClone(s);for(const r of unmarked.reviews)delete r.withheld;assert.throws(()=>validateState(unmarked),/ไม่ตรง/,'a task reference to an empty, unmarked review is refused');
});
test('withheld revisions cannot be reviewed, drafted or committed on this side',()=>{
  const {s,sourceId,meetingId,reviewId}=stubbed(),meeting=s.meetings[0];
  assert.throws(()=>saveReview(s,{sourceId,segments:[],reviewHash:'x'}),/เก็บไว้ที่เครื่องที่บันทึก/);
  assert.throws(()=>addBatch(s,meetingId,{draftBatchId:'batch-2',reviewRevisionId:reviewId,reviewHash:'review-hash',sourceHash:'source-1',items:[]}),/เก็บไว้ที่เครื่องที่บันทึก/);
  const fresh=meetingFixture();for(const r of fresh.s.reviews)r.withheld=true;assert.throws(()=>commitBatch(fresh.s,'batch-1',fresh.choices),/เก็บไว้ที่เครื่องที่บันทึก/);
  assert.equal(meeting.reviewId,reviewId);
});

// ---- WI-09 (SDD-004 amendment): canonical choices, audience and the server's use of commitBatch --------------------------------------
test('canonicalChoices gives the same string for any key or choice order, and a different one for other content',()=>{
  const {choices}=meetingFixture(),a=choices[0],b={...a,proposalId:'proposal-0',mode:'skip'};
  const shuffled=Object.fromEntries(Object.entries(a).reverse());
  assert.equal(canonicalChoices([a,b]),canonicalChoices([b,shuffled]),'key order and choice order do not matter');
  assert.notEqual(canonicalChoices([a]),canonicalChoices([{...a,dueDate:'2026-10-09'}]),'holdout: a different dueDate is a different payload');
  assert.notEqual(canonicalChoices([a]),canonicalChoices([{...a,week:'2026-10-05'}]));
  const input=[b,a];canonicalChoices(input);assert.deepEqual(input,[b,a],'the input is not reordered in place');
});
test('commitBatch with an audience gives every created task that audience; without one the task carries none (holdout)',()=>{
  const plain=meetingFixture();commitBatch(plain.s,'batch-1',plain.choices);
  const open=plain.s.tasks.at(-1);assert.equal(open.visibility,undefined);assert.equal(open.viewerIds,undefined);
  const {s,choices}=meetingFixture(),people=s.members.slice(0,3).map(m=>m.id),ids=commitBatch(s,'batch-1',choices,null,{audience:{visibility:'restricted',viewerIds:people}});
  const made=s.tasks.find(t=>t.id===ids[0]);assert.equal(made.visibility,'restricted');assert.deepEqual(made.viewerIds,people);
  const empty=meetingFixture();assert.throws(()=>commitBatch(empty.s,'batch-1',empty.choices,null,{audience:{visibility:'restricted',viewerIds:[]}}),/ไม่มีผู้เข้าร่วม/);assert.equal(empty.s.receipts.length,0);
});
test('link never changes the audience of a task; update needs a restricted task named only by participants (AUDIENCE_WIDER)',()=>{
  const people=fresh().members.slice(0,3).map(m=>m.id),audience=people=>({visibility:'restricted',viewerIds:people});
  const link=meetingFixture(),target=structuredClone(link.s.tasks[0]);
  commitBatch(link.s,'batch-1',[{...link.choices[0],mode:'link',taskId:target.id,taskVersion:target.version}],null,{audience:audience(link.s.members.slice(0,3).map(m=>m.id))});
  const linked=link.s.tasks[0];assert.equal(linked.visibility,target.visibility);assert.deepEqual(linked.viewerIds,target.viewerIds);assert.equal(linked.sourceRefs.length,1);
  const wide=meetingFixture(),old=wide.s.tasks[0];
  assert.throws(()=>commitBatch(wide.s,'batch-1',[{...wide.choices[0],mode:'update',taskId:old.id,taskVersion:old.version}],null,{audience:audience(wide.s.members.slice(0,3).map(m=>m.id))}),e=>e.code==='AUDIENCE_WIDER');
  assert.equal(wide.s.receipts.length,0);assert.equal(wide.s.tasks[0].title,old.title,'a refused update changes nothing');
  const narrow=meetingFixture(),ids=narrow.s.members.slice(0,3).map(m=>m.id);
  saveTask(narrow.s,{id:narrow.s.tasks[0].id,responsibleId:ids[0],accountableId:ids[1],consultedIds:[],informedIds:[],visibility:'restricted',viewerIds:[ids[2]]});
  const restricted=narrow.s.tasks[0];
  commitBatch(narrow.s,'batch-1',[{...narrow.choices[0],mode:'update',taskId:restricted.id,taskVersion:restricted.version,title:'ปรับจากประชุม'}],null,{audience:audience(ids)});
  assert.equal(narrow.s.tasks[0].title,'ปรับจากประชุม');assert.equal(narrow.s.tasks[0].visibility,'restricted');assert.deepEqual(narrow.s.tasks[0].viewerIds,[ids[2]]);
  const outside=meetingFixture(),some=outside.s.members.slice(0,2).map(m=>m.id);
  saveTask(outside.s,{id:outside.s.tasks[0].id,responsibleId:outside.s.members[3].id,visibility:'restricted',viewerIds:[some[0]]});
  const named=outside.s.tasks[0];assert.throws(()=>commitBatch(outside.s,'batch-1',[{...outside.choices[0],mode:'update',taskId:named.id,taskVersion:named.version}],null,{audience:audience(some)}),e=>e.code==='AUDIENCE_WIDER','a named R outside the participants widens it');
});
test('a stub review commits only when the caller allows it (the server), on its spans',()=>{
  const {s,choices}=meetingFixture();for(const r of s.reviews){r.segments=[];r.withheld=true;}
  assert.throws(()=>commitBatch(s,'batch-1',choices),/เก็บไว้ที่เครื่องที่บันทึก/);
  const ids=commitBatch(s,'batch-1',choices,null,{allowStub:true});assert.equal(ids.length,1);
  const bad=meetingFixture();for(const r of bad.s.reviews){r.segments=[];r.withheld=true;}bad.s.batches[0].items[0].evidence[0].reviewRevisionId='other';
  assert.throws(()=>commitBatch(bad.s,'batch-1',bad.choices,null,{allowStub:true}),/ไม่ตรงฉบับตรวจ/,'a span of another review is refused');
});
test('a receipt from the server replays by the canonical payload; one from the old client by the plain payload',()=>{
  const {s,choices}=meetingFixture(),ids=commitBatch(s,'batch-1',choices);
  assert.deepEqual(commitBatch(s,'batch-1',choices),ids,'old receipt, same plain payload');
  const reordered=Object.fromEntries(Object.entries(choices[0]).reverse());
  assert.throws(()=>commitBatch(s,'batch-1',[reordered]),/Conflict/,'an old receipt still compares the plain string');
  Object.assign(s.receipts[0],{origin:'server',payload:canonicalChoices(choices)});
  assert.deepEqual(commitBatch(s,'batch-1',[reordered]),ids,'a server receipt ignores key order');assert.throws(()=>commitBatch(s,'batch-1',[{...choices[0],title:'อื่น'}]),/Conflict/);
});
test('a task reference whose evidence is withheld validates; a missing reference target still does not',()=>{
  const {s,choices}=meetingFixture();commitBatch(s,'batch-1',choices);const t=s.tasks.at(-1);
  t.sourceRefs[0].evidence={withheld:true};assert.doesNotThrow(()=>validateState(s));
  t.sourceRefs[0].reviewRevisionId='missing';assert.throws(()=>validateState(s),/ฉบับประชุม/);
});
