// @trace verifies AC-015-004-01, AC-015-004-02 — orchestration/control-plane denial.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {sendMarketingDelivery} from '../marketing-report-delivery.mjs';
import {handleApi} from '../api.mjs';
import {pool} from '../db.mjs';
after(()=>pool.end());
const b='00000000-0000-4000-a000-000000000001',r='00000000-0000-4000-a000-000000000002';
const binding={associationId:b,rowVersion:'1',bindingId:'qa-binding'};
function sql(expiry){return {zuriViewer:{kind:'operator'},query:async query=>{
 if(query.includes('set_config'))return {rows:[]};
 if(query.includes('association_id'))return {rows:[{association_id:b,association_version:'1',external_binding_id:'qa-binding'}]};
 if(query.includes('marketing_delivery_claim'))return {rows:[{result:{claimed:true,claim:{leaseId:b,attemptNumber:1,leaseExpiresAt:expiry,canonicalEnvelope:'{}'}}}]};
 return {rows:[{result:{delivery:{state:'SENDING'}}}]};
}};}
test('expired committed claim never dispatches HTTP',async()=>{
 let sends=0;
 await assert.rejects(sendMarketingDelivery({transaction:fn=>fn(sql('2000-01-01T00:00:00Z')),businessId:b,reportId:r,bindings:[binding],requestReceipt:async()=>{sends++;}}),e=>e.code==='DELIVERY_LEASE_STALE');
 assert.equal(sends,0);
});
test('only rolled-back transactions retry; completion retries never repeat HTTP',async()=>{
 let transactions=0,sends=0,completes=0;
 const tx=sql(new Date(Date.now()+60000).toISOString()),original=tx.query;
 tx.query=async query=>{if(query.includes('marketing_delivery_complete')){completes++;if(completes<3)throw Object.assign(Error('rolled back'),{code:completes===1?'40001':'40P01'});return {rows:[{result:{delivery:{state:'UNKNOWN'}}}]};}return original(query);};
 const result=await sendMarketingDelivery({transaction:async fn=>{transactions++;return fn(tx);},businessId:b,reportId:r,bindings:[binding],requestReceipt:async()=>{sends++;return {outcome:'UNKNOWN'};}});
 assert.equal(result.delivery.state,'UNKNOWN');assert.equal(sends,1);assert.equal(completes,3);assert.equal(transactions,4);
});
test('sender authorization routes reject hosted, Guest, Member and foreign Business before DB/config/network',async()=>{
 for(const action of ['', '/send','/settle'])for(const context of [{storage:'postgresql-cloud'},{requireMember:true},{principal:null},{principal:{kind:'session'}},{businessId:r}]){
  const method=action?'POST':'GET',req={method,headers:{'x-zuri-go':'1','content-type':'application/json'},body:action?'{}':undefined};
  await assert.rejects(handleApi(req,{},new URL(`http://127.0.0.1/api/zuri-go/v1/businesses/${b}/marketing-reports/${r}/delivery${action}`),{businessId:b,storage:'postgresql-local',principal:{kind:'operator'},...context}),e=>e.status===403);
 }
 for(const body of ['{"credential":"private"}','{"origin":"https://other.invalid"}'])await assert.rejects(handleApi({method:'POST',headers:{'x-zuri-go':'1','content-type':'application/json'},body},{},new URL(`http://127.0.0.1/api/zuri-go/v1/businesses/${b}/marketing-reports/${r}/delivery/send`),{businessId:b,storage:'postgresql-local',principal:{kind:'operator'}}),e=>e.code==='DELIVERY_FIELDS_INVALID');
});
