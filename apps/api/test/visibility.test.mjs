// @trace verifies FR-011-003, FR-011-004, FR-011-006, FR-011-007, FR-011-008, FR-011-009, FR-011-010, FR-011-011
import test from 'node:test';
import assert from 'node:assert/strict';
import {canRead,visibilityChange,meetingAudience,GUEST} from '../../web/src/content/shared/visibility.mjs';
import {viewerSettings,OPERATOR} from '../viewer.mjs';
import {audienceKey} from '../service.mjs';
import {custodyRevision,custodyBatch} from '../workspace.mjs';
import {validateEvidence,isWithheld} from '../../web/src/content/meeting/model.mjs';
const A='00000000-0000-4000-a000-00000000000a',R='00000000-0000-4000-a000-00000000000b',X='00000000-0000-4000-a000-00000000000c';
const TEAM='00000000-0000-4000-a000-0000000000f1',OTHER='00000000-0000-4000-a000-0000000000f2';
const member=(memberId,teamIds=[],admin=false)=>({kind:'member',memberId,teamIds,admin});
const operator={kind:'operator',memberId:null,teamIds:[],admin:false};

test('ADR-008: every Business audience is readable to Guest and any authenticated Member',()=>{
 for(const visibility of ['public','business','team','restricted']){
  const item={visibility,team_id:TEAM};
  assert.equal(canRead(GUEST,item),true,'Guest reads '+visibility);
  assert.equal(canRead(member(A,[],false),item),true,'non-admin Member reads '+visibility);
  assert.equal(canRead(member(R,[OTHER],true),item),true,'admin flag does not change '+visibility);
 }
});

test('canRead: ADR-008 shared Business reads',()=>{
 assert.equal(canRead(GUEST,{visibility:'public'}),true);
 assert.equal(canRead(GUEST,{visibility:'business'}),true);
 assert.equal(canRead(member(X,[TEAM]),{visibility:'team',team_id:TEAM}),true);
 assert.equal(canRead(member(X,[]),{visibility:'team',teamId:TEAM},[X]),true);
 assert.equal(canRead(member(X,[],true),{visibility:'restricted'},[A]),true,'RACI, viewers, and admin flag do not limit reads');
});
test('canRead: every former audience remains readable',()=>{
 assert.equal(canRead(operator,{visibility:'restricted'}),true);
 assert.equal(canRead(member(X),{visibility:'restricted'},[A,R]),true);
 assert.equal(canRead(member(X,[OTHER]),{visibility:'team',team_id:TEAM},[A]),true);
});
test('canRead: missing level and Guest both use the Business boundary',()=>{
 assert.equal(canRead(member(X),{}),true);assert.equal(canRead(GUEST,{}),true);assert.equal(canRead(undefined,{visibility:'business'}),true);
 assert.equal(canRead({kind:'member'},{visibility:'business'}),true,'authentication validates identity before this projection');
 assert.equal(canRead({kind:'unknown'},{visibility:'business'}),false);
});
test('visibilityChange keeps optional audience metadata without authorizing by owner or role',()=>{
 const named=[A,R];
 assert.deepEqual(visibilityChange(member(R),{visibility:'restricted'},{visibility:'business'},{accountableId:A,named}),{ok:true});
 assert.deepEqual(visibilityChange(member(A),{visibility:'restricted'},{visibility:'business'},{accountableId:A,reason:'ทีมทั้งหมดต้องเห็น',named}),{ok:true});
 assert.deepEqual(visibilityChange(member(X,[TEAM]),{visibility:'business'},{visibility:'team',team_id:TEAM},{accountableId:A,named}),{ok:true});
});
test('visibilityChange validates only retained metadata shape',()=>{
 assert.deepEqual(visibilityChange(member(A),{visibility:'restricted'},{visibility:'public'},{accountableId:A,reason:'  ',named:[A]}),{ok:true});
 assert.deepEqual(visibilityChange(member(A),{visibility:'business'},{visibility:'team'},{accountableId:A,named:[A]}),{error:'TEAM_REQUIRED'});
 assert.deepEqual(visibilityChange(member(X),{visibility:'business'},{visibility:'restricted'},{accountableId:A,named:[A]}),{ok:true});
});
test('visibilityChange no longer gates by audience widening or named-viewer role',()=>{
 assert.deepEqual(visibilityChange(member(X,[TEAM,OTHER]),{visibility:'team',team_id:TEAM},{visibility:'team',team_id:OTHER},{accountableId:A,reason:'ย้ายฝ่าย',named:[A]}),{ok:true});
 assert.deepEqual(visibilityChange(operator,{visibility:'restricted'},{visibility:'business'},{accountableId:A,reason:'operator'}),{ok:true});
 assert.deepEqual(visibilityChange(member(A),null,{visibility:'restricted'},{named:[]}),{error:'NAMED_REQUIRED'});
 assert.deepEqual(visibilityChange(member(A),null,{visibility:'secret'},{}),{error:'LEVEL_INVALID'});
 assert.deepEqual(visibilityChange(member(A),null,{visibility:'business'},{}),{ok:true},'a new item is not a widening');
});
test('viewerSettings: the database settings of each viewer kind (FR-011-003)',()=>{
 assert.deepEqual(viewerSettings(OPERATOR),{kind:'operator',member:''});
 assert.deepEqual(viewerSettings(member(A)),{kind:'member',member:A});
 assert.deepEqual(viewerSettings(GUEST),{kind:'guest',member:''});
 assert.deepEqual(viewerSettings({kind:'admin',memberId:A}),{kind:'guest',member:''},'unknown kinds read as guest');
});
test('audienceKey: cache key follows the visible tasks and their versions (FR-011-008)',()=>{
 const t1={id:'t1',row_version:1},t2={id:'t2',row_version:4};
 assert.equal(audienceKey({tasks:[t1,t2]}),audienceKey({tasks:[t1,t2]}));
 assert.notEqual(audienceKey({tasks:[t1]}),audienceKey({tasks:[t1,t2]}));
 assert.equal(audienceKey({tasks:[t2,t1]}),audienceKey({tasks:[t1,t2]}),'order does not matter');
 assert.notEqual(audienceKey({tasks:[{...t1,row_version:2}]}),audienceKey({tasks:[t1]}));
});

test('meetingAudience: SDD-011 acceptance and holdout examples (FR-011-009)',()=>{
 assert.deepEqual(meetingAudience({visibility:'restricted'},[A,R,X]),{visibility:'restricted',viewerIds:[A,R,X]},'a restricted meeting hands its three participants over');
 assert.equal(meetingAudience({visibility:'business'},[A,R,X]),null);
 for(const visibility of ['team','public'])assert.equal(meetingAudience({visibility},[A]),null,visibility);
 assert.equal(meetingAudience({},[A]),null,'a meeting without a level is business');
 assert.deepEqual(meetingAudience({visibility:'restricted'},[A,A,R]).viewerIds,[A,R],'a person is listed once');
});
test('custodyRevision: SDD-011 acceptance and holdout examples (FR-011-010)',()=>{
 const row={meeting_id:'m',kind:'source',content_hash:'h1',segments:[{segmentId:'s1',startMs:0,endMs:10,text:'ลับ'}],legacy_metadata:{id:'r1',contentHash:'h1',segments:[{segmentId:'s1',startMs:0,endMs:10,text:'ลับ'}]}};
 const stub=custodyRevision(row,'local_only');
 assert.deepEqual(stub.segments,[]);assert.equal(stub.content_hash,'h1');assert.equal(stub.legacy_metadata.withheld,true);assert.deepEqual(stub.legacy_metadata.segments,[]);assert.equal(stub.legacy_metadata.contentHash,'h1');
 assert.equal(row.segments.length,1,'the input is not changed');assert.equal(row.legacy_metadata.withheld,undefined);
 assert.equal(custodyRevision(row,'cloud'),row,'cloud custody leaves the revision unchanged');
 assert.deepEqual(custodyRevision(stub,'local_only'),stub,'a stub stays a stub');
 assert.equal(isWithheld(stub.legacy_metadata),true);assert.equal(isWithheld(row.legacy_metadata),false);
});
test('custodyBatch: evidence text is removed and everything else is kept (FR-011-010)',()=>{
 const batch={id:'b',reviewHash:'rh',items:[{proposalId:'p1',title:'งาน',evidence:[{segmentId:'s1',startMs:0,endMs:10,quote:'ลับ',reviewRevisionId:'r'}]}]};
 const stub=custodyBatch(batch,'local_only');
 assert.deepEqual(stub.items[0].evidence,[{segmentId:'s1',startMs:0,endMs:10,reviewRevisionId:'r'}]);assert.equal(stub.items[0].title,'งาน');assert.equal(stub.reviewHash,'rh');
 assert.equal(batch.items[0].evidence[0].quote,'ลับ','the input is not changed');assert.equal(custodyBatch(batch,'cloud'),batch);assert.deepEqual(custodyBatch(stub,'local_only'),stub);
});
test('validateEvidence: only the withheld marker relaxes the segment and quote check (FR-011-010)',()=>{
 const place=[{segmentId:'s1',startMs:0,endMs:10,reviewRevisionId:'r'}];
 const normal={id:'r',segments:[{segmentId:'s1',startMs:0,endMs:10,text:'ลับ'}]},stub={id:'r',segments:[],withheld:true};
 assert.throws(()=>validateEvidence(normal,place),/ไม่ตรง/,'a normal revision still needs the quote');
 assert.throws(()=>validateEvidence({id:'r',segments:[]},place),/ไม่ตรง/,'an empty revision without the marker is refused');
 assert.doesNotThrow(()=>validateEvidence(stub,place));
 assert.throws(()=>validateEvidence(stub,[{...place[0],reviewRevisionId:'other'}]),/ไม่ตรง/,'a stub still binds evidence to its own revision');
 assert.throws(()=>validateEvidence(stub,[{...place[0],endMs:-1}]),/ไม่ตรง/);
 assert.throws(()=>validateEvidence(stub,[]),/หลักฐาน/);
});
