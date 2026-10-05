// @trace verifies AC-015-004-01 — strict durable receipt and bounded single-call transport.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {canonicalHash} from '../marketing-report.mjs';
import {canonicalText} from '../marketing-report-ledger.mjs';
import {parseMarketingReceipt,classifyMarketingResponse,parseRetryAfter,requestMarketingReceipt,readDeliveryRequest,readDeliveryConfiguration} from '../marketing-report-delivery.mjs';

const uuid='00000000-0000-4000-a000-000000000001';
const content={reportId:uuid,reportRevision:1,target:{bindingId:'binding-qa',initiativeId:uuid},campaign:{sourceCampaignId:uuid}};
const envelope={...content,payloadHash:canonicalHash(content)},canonicalEnvelope=canonicalText(envelope);
const receipt={contractVersion:'zuri-marketing-report/0.1',receiverReceiptId:uuid,reportId:uuid,bindingId:'binding-qa',sourceCampaignId:uuid,targetInitiativeId:uuid,reportRevision:1,payloadHash:envelope.payloadHash,acceptedAt:'2026-10-05T00:00:00.000Z',status:'ACCEPTED_REPORTED_EVIDENCE'};
const binding={associationId:uuid,rowVersion:'1',bindingId:'binding-qa',origin:'https://receiver.invalid',credential:'zmr_'+'a'.repeat(43)};

test('only exact durable receipt permits ACK; invalid identity, byte/Unicode/date and unknown fields stay uncertain',()=>{
 assert.deepEqual(parseMarketingReceipt(JSON.stringify(receipt),envelope).receipt,receipt);
 for(const mutate of [r=>r.receiverReceiptId=[uuid],r=>r.reportId='other',r=>r.bindingId='other',r=>r.sourceCampaignId='other',r=>r.targetInitiativeId='other',r=>r.reportRevision=2,r=>r.payloadHash='a'.repeat(64),r=>r.acceptedAt='2026-02-30T00:00:00Z',r=>r.acceptedAt='2026-10-05T24:00:00Z',r=>r.acceptedAt='2026-10-05',r=>r.status='ACCEPTED',r=>r.extra='private']){
  const bad=structuredClone(receipt);mutate(bad);assert.equal(classifyMarketingResponse({status:201,body:JSON.stringify(bad),envelope}).outcome,'UNKNOWN');
 }
 for(const raw of [JSON.stringify(receipt).replace('"reportId":','"report\\u0049d":"other","reportId":'),Buffer.from([0xc3,0x28]),' '.repeat(4097)])assert.equal(classifyMarketingResponse({status:200,body:raw,envelope}).outcome,'UNKNOWN');
 for(const status of [202,204,301,302,307,308,500,503])assert.equal(classifyMarketingResponse({status,body:JSON.stringify(receipt),envelope}).outcome,'UNKNOWN');
 for(const status of [400,401,403,404,409,413,415,422])assert.equal(classifyMarketingResponse({status,body:'private remote error',envelope}).outcome,'REJECTED');
 assert.deepEqual(classifyMarketingResponse({status:429,body:'private',envelope,retryAfter:'120'}),{outcome:'RATE_LIMIT',httpStatus:429,retryDelaySeconds:120});
 assert.deepEqual(parseRetryAfter('9'.repeat(100)),{retryDelaySeconds:86400});assert.deepEqual(parseRetryAfter('invalid'),{});
 assert.deepEqual(parseRetryAfter('Mon, 05 Oct 2026 00:00:00 GMT'),{retryAt:'2026-10-05T00:00:00.000Z'});
});

test('private config and empty command body deny caller URL/token, malformed types and unsupported schemes',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'zuri-delivery-')),file=join(dir,'configuration.json');
 try{
  writeFileSync(file,JSON.stringify({version:1,bindings:[binding]}));assert.deepEqual(readDeliveryConfiguration(file),[binding]);
  for(const change of [{associationId:[uuid]},{bindingId:['binding-qa']},{rowVersion:1},{origin:'http://receiver.invalid'},{origin:'https://receiver.invalid/path'},{origin:'https://receiver.invalid/'},{origin:'https://user:secret@receiver.invalid'},{credential:'wrong'}]){
   writeFileSync(file,JSON.stringify({version:1,bindings:[{...binding,...change}]}));assert.throws(()=>readDeliveryConfiguration(file),e=>e.code==='DELIVERY_CONFIGURATION_INVALID'&&!e.message.includes('secret'));
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
 await readDeliveryRequest({body:''});await readDeliveryRequest({body:'{}'});
 for(const body of ['{"url":"https://other.invalid"}','{"credential":"private"}','[]','null',' '.repeat(1025)])await assert.rejects(readDeliveryRequest({body}));
 let calls=0;const fetchImpl=async()=>{calls++;throw Error('private token');};
 for(const bad of [{binding:{...binding,origin:'http://receiver.invalid'}},{timeoutMs:20001},{timeoutMs:0},{timeoutMs:NaN},{canonicalEnvelope:canonicalEnvelope+'\n'},{envelope:{...envelope,payloadHash:'a'.repeat(64)}}])await assert.rejects(requestMarketingReceipt({binding,envelope,canonicalEnvelope,fetchImpl,...bad}));
 assert.equal(calls,0);
});

test('actual HTTP call sends exact frozen bytes once, refuses redirects, bounds body and includes body wait in timeout',async()=>{
 let calls=0,body='',mode='ok';
 const server=createServer(async(req,res)=>{
  calls++;for await(const chunk of req)body+=chunk;
  assert.equal(req.url,'/api/growth/external-marketing-reports');assert.equal(req.headers.authorization,'Bearer '+binding.credential);
  if(mode==='redirect'){res.writeHead(307,{Location:'/unexpected'});res.end();}
  else if(mode==='large'){res.writeHead(201);res.end('x'.repeat(4097));}
  else if(mode==='stall'){res.writeHead(201);res.flushHeaders();res.write('{');}
  else{res.writeHead(201,{'Content-Type':'application/json'});res.end(JSON.stringify(receipt));}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 // Test-owned loopback injection; the production transport still validates its HTTPS-only origin.
 const fetchImpl=(url,options)=>{assert.equal(url,binding.origin+'/api/growth/external-marketing-reports');assert.equal(options.redirect,'manual');return fetch('http://127.0.0.1:'+server.address().port+'/api/growth/external-marketing-reports',options);};
 try{
  assert.equal((await requestMarketingReceipt({binding,envelope,canonicalEnvelope,fetchImpl})).outcome,'ACK');assert.equal(body,canonicalEnvelope);
  for(mode of ['redirect','large','stall']){body='';const before=calls,start=Date.now();const result=await requestMarketingReceipt({binding,envelope,canonicalEnvelope,fetchImpl,timeoutMs:150});assert.equal(result.outcome,'UNKNOWN');assert.equal(calls,before+1);assert.equal(body,canonicalEnvelope);if(mode==='stall')assert.ok(Date.now()-start<1500);}
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
