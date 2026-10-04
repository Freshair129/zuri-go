// @trace verifies AC-015-001-01, AC-015-001-02 — mocked source and router denial only.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {canonicalHash,readMarketingReportSource} from '../marketing-report.mjs';
import {handleApi,sendError} from '../api.mjs';
import {pool} from '../db.mjs';
import {hash} from '../service.mjs';

const b='00000000-0000-4000-a000-000000000001',id='00000000-0000-4000-a000-000000000002';
const state={version:1,ads:[],leads:[],orders:[],reviews:[]};
const row=()=>({business_id:b,campaign_id:id,code:'CAM-0001',objective:'leads',lifecycle:'draft',currency:'THB',campaign_row_version:'9007199254740993',state_row_version:'2',payload_hash:canonicalHash(state),domain_revision:'4',schema_version:1,state_json:state,captured_at:new Date('2026-10-05T05:00:00Z')});
after(()=>pool.end());

test('source reader requires resolved operator and Business setting, uses one SELECT without a write',async()=>{
 let calls=0;const tx={zuriViewer:{kind:'operator'},query:async(sql,args)=>{calls++;assert.match(sql,/current_setting\('zuri_go.business_id'/);assert.match(sql,/campaign_states/);assert.ok(!/INSERT|UPDATE|DELETE|FOR UPDATE/.test(sql));assert.deepEqual(args,[b,id]);return {rows:[row()]};}};
 const s=await readMarketingReportSource(tx,b,id);assert.equal(calls,1);assert.equal(s.sourceRevision.campaignRowVersion,'9007199254740993');assert.equal(s.sourceRevision.statePayloadHash,canonicalHash(state));assert.equal(s.capturedAt,'2026-10-05T05:00:00.000Z');
 for(const kind of ['guest','member',undefined])await assert.rejects(readMarketingReportSource({...tx,zuriViewer:{kind}},b,id),e=>e.status===403);
 assert.equal(calls,1);
});

test('unreadable, crossed scope, corrupted hash and unsupported model are not exposed',async()=>{
 const tx=value=>({zuriViewer:{kind:'operator'},query:async()=>({rows:value?[value]:[]})});
 await assert.rejects(readMarketingReportSource(tx(null),b,id),e=>e.status===404);
 for(const value of [{...row(),business_id:id},{...row(),campaign_id:b},{...row(),payload_hash:'a'.repeat(64)},{...row(),schema_version:2}])await assert.rejects(readMarketingReportSource(tx(value),b,id),e=>[403,422].includes(e.status));
});

test('canonical source hash agrees with existing persistence hash, including nested Thai JSON',()=>{
 const value={...state,notes:'ข้อมูลส่วนตัว',nested:{z:[{b:2,a:1}],a:0},cap:0.1};assert.equal(canonicalHash(value),hash(value));
});

async function call(options,method='POST',body={}){
 return new Promise((resolve,reject)=>{const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(raw){resolve({status:this.status,headers:this.headers,body:JSON.parse(raw)});}};handleApi({method,headers:{'x-zuri-go':'1','content-type':'application/json'},body},res,new URL(`http://127.0.0.1/api/zuri-go/v1/businesses/${b}/campaigns/${id}/marketing-report-preview`),{businessId:b,storage:'postgresql-local',principal:{kind:'operator'},...options}).catch(e=>{try{sendError(res,e);}catch(x){reject(x);}});});
}

test('preview denies hosted, Guest, Member and other Business before database access',async()=>{
 for(const options of [{storage:'postgresql-cloud'},{requireMember:true},{principal:null},{principal:{kind:'session',claims:{}}},{businessId:id}])assert.equal((await call(options)).status,403);
 assert.equal((await call({},'GET')).status,405);
 assert.equal((await call({},'POST',{actor:{kind:'operator'}})).status,422);
});
