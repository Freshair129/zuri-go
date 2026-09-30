// @trace verifies FR-011-003, FR-011-004, FR-011-006, FR-011-007, FR-011-008, FR-011-011
import test from 'node:test';
import assert from 'node:assert/strict';
import {canRead,visibilityChange,GUEST} from '../../web/src/content/shared/visibility.mjs';
import {viewerSettings,OPERATOR} from '../viewer.mjs';
import {audienceKey} from '../service.mjs';
const A='00000000-0000-4000-a000-00000000000a',R='00000000-0000-4000-a000-00000000000b',X='00000000-0000-4000-a000-00000000000c';
const TEAM='00000000-0000-4000-a000-0000000000f1',OTHER='00000000-0000-4000-a000-0000000000f2';
const member=(memberId,teamIds=[],admin=false)=>({kind:'member',memberId,teamIds,admin});
const operator={kind:'operator',memberId:null,teamIds:[],admin:false};

test('canRead: SDD-011 acceptance examples',()=>{
 assert.equal(canRead(GUEST,{visibility:'public'}),true);
 assert.equal(canRead(GUEST,{visibility:'business'}),false);
 assert.equal(canRead(member(X,[TEAM]),{visibility:'team',team_id:TEAM}),true);
 assert.equal(canRead(member(X,[]),{visibility:'team',teamId:TEAM},[X]),true);
 assert.equal(canRead(member(X,[],true),{visibility:'restricted'},[A]),false,'admin reads nothing extra (FR-011-002)');
});
test('canRead: SDD-011 holdout examples',()=>{
 assert.equal(canRead(operator,{visibility:'restricted'}),true);
 assert.equal(canRead(member(X),{visibility:'restricted'},[A,R]),false);
 assert.equal(canRead(member(X,[OTHER]),{visibility:'team',team_id:TEAM},[A]),false);
});
test('canRead: missing level reads as business and a Guest never sees it',()=>{
 assert.equal(canRead(member(X),{}),true);assert.equal(canRead(GUEST,{}),false);assert.equal(canRead(undefined,{visibility:'business'}),false);
 assert.equal(canRead({kind:'member'},{visibility:'business'}),false,'a member without an ID is not a Member');
});
test('visibilityChange: SDD-011 acceptance examples (FR-011-011)',()=>{
 const named=[A,R];
 assert.deepEqual(visibilityChange(member(R),{visibility:'restricted'},{visibility:'business'},{accountableId:A,reason:'ทีมทั้งหมดต้องเห็น',named}),{error:'WIDEN_DENIED'});
 assert.deepEqual(visibilityChange(member(A),{visibility:'restricted'},{visibility:'business'},{accountableId:A,reason:'ทีมทั้งหมดต้องเห็น',named}),{ok:true});
 assert.deepEqual(visibilityChange(member(X,[TEAM]),{visibility:'business'},{visibility:'team',team_id:TEAM},{accountableId:A,named}),{ok:true});
});
test('visibilityChange: SDD-011 holdout examples',()=>{
 assert.deepEqual(visibilityChange(member(A),{visibility:'restricted'},{visibility:'public'},{accountableId:A,reason:'  ',named:[A]}),{error:'REASON_REQUIRED'});
 assert.deepEqual(visibilityChange(member(A),{visibility:'business'},{visibility:'team'},{accountableId:A,named:[A]}),{error:'TEAM_REQUIRED'});
 assert.deepEqual(visibilityChange(member(X),{visibility:'business'},{visibility:'restricted'},{accountableId:A,named:[A]}),{error:'SELF_EXCLUDED'});
});
test('visibilityChange: moving a team item to another team is widening; the operator may widen with a reason',()=>{
 assert.deepEqual(visibilityChange(member(X,[TEAM,OTHER]),{visibility:'team',team_id:TEAM},{visibility:'team',team_id:OTHER},{accountableId:A,reason:'ย้ายฝ่าย',named:[A]}),{error:'WIDEN_DENIED'});
 assert.deepEqual(visibilityChange(operator,{visibility:'restricted'},{visibility:'business'},{accountableId:A,reason:'operator'}),{ok:true});
 assert.deepEqual(visibilityChange(operator,{visibility:'restricted'},{visibility:'business'},{accountableId:A}),{error:'REASON_REQUIRED'});
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
