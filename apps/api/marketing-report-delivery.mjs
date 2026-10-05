// @trace implements FR-015-004 — explicit bounded delivery of immutable reported evidence.
import {readFileSync} from 'node:fs';
import {canonicalHash} from './marketing-report.mjs';
import {canonicalText} from './marketing-report-ledger.mjs';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/;
const HASH=/^[a-f0-9]{64}$/;
const CREDENTIAL=/^zmr_[A-Za-z0-9_-]{43}$/;
const fields=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const reject=(code,status=422)=>{throw Object.assign(Error('Marketing delivery: '+code),{code,status});};
const validInstant=value=>{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))return false;
 const date=value.slice(0,10),day=new Date(date+'T00:00:00Z');
 return Number.isFinite(day.getTime())&&day.toISOString().slice(0,10)===date&&Number(value.slice(11,13))<24&&Number(value.slice(14,16))<60&&Number(value.slice(17,19))<60;
};
function validTransportBinding(binding){
 if(typeof binding?.origin!=='string'||typeof binding.credential!=='string'||!CREDENTIAL.test(binding.credential))return false;
 try{const url=new URL(binding.origin);return url.protocol==='https:'&&!url.username&&!url.password&&url.pathname==='/'&&!url.search&&!url.hash&&url.origin===binding.origin;}catch{return false;}
}

export function parseMarketingReceipt(raw,envelope){
 const bytes=Buffer.from(raw);if(bytes.length>4096)reject('RECEIPT_LIMIT');
 let text,value;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);value=JSON.parse(text);}catch{reject('RECEIPT_INVALID');}
 const keys=new Set();for(const token of text.matchAll(/"(?:\\.|[^"\\])*"/g))if(/^\s*:/.test(text.slice(token.index+token[0].length))){const key=JSON.parse(token[0]);if(keys.has(key))reject('RECEIPT_DUPLICATE_KEY');keys.add(key);}
 const expected=['contractVersion','receiverReceiptId','reportId','bindingId','sourceCampaignId','targetInitiativeId','reportRevision','payloadHash','acceptedAt','status'];
 if(!fields(value,expected)||value.contractVersion!=='zuri-marketing-report/0.1'||typeof value.receiverReceiptId!=='string'||!UUID.test(value.receiverReceiptId)||value.status!=='ACCEPTED_REPORTED_EVIDENCE'||!validInstant(value.acceptedAt))reject('RECEIPT_INVALID');
 if(value.reportId!==envelope.reportId||value.bindingId!==envelope.target.bindingId||value.sourceCampaignId!==envelope.campaign.sourceCampaignId
  ||value.targetInitiativeId!==envelope.target.initiativeId||value.reportRevision!==1||envelope.reportRevision!==1||value.payloadHash!==envelope.payloadHash)reject('RECEIPT_MISMATCH');
 return {receipt:value,canonicalReceipt:canonicalText(value)};
}

export function parseRetryAfter(value){
 if(typeof value!=='string'||value.length>128)return {};
 if(/^[0-9]+$/.test(value)){const seconds=Number(value);return Number.isFinite(seconds)?{retryDelaySeconds:Math.min(seconds,86400)}:{retryDelaySeconds:86400};}
 const time=Date.parse(value);return Number.isFinite(time)?{retryAt:new Date(time).toISOString()}:{};
}

export function classifyMarketingResponse({status,body,envelope,retryAfter}){
 if(status===200||status===201){try{return {outcome:'ACK',httpStatus:status,...parseMarketingReceipt(body,envelope)};}catch{return {outcome:'UNKNOWN',httpStatus:status};}}
 if(status===429)return {outcome:'RATE_LIMIT',httpStatus:status,...parseRetryAfter(retryAfter)};
 return {outcome:[400,401,403,404,409,413,415,422].includes(status)?'REJECTED':'UNKNOWN',httpStatus:status};
}

export function readDeliveryConfiguration(file=new URL('../../.local/marketing-report-delivery.json',import.meta.url)){
 let value;try{value=JSON.parse(readFileSync(file,'utf8'));}catch{reject('DELIVERY_CONFIGURATION_REQUIRED',409);}
 if(!fields(value,['version','bindings'])||value.version!==1||!Array.isArray(value.bindings)||value.bindings.length>100)reject('DELIVERY_CONFIGURATION_INVALID',409);
 const seen=new Set();for(const entry of value.bindings){
  if(!fields(entry,['associationId','rowVersion','bindingId','origin','credential'])||typeof entry.associationId!=='string'||!UUID.test(entry.associationId)||typeof entry.rowVersion!=='string'||!/^[1-9][0-9]*$/.test(entry.rowVersion)
   ||typeof entry.bindingId!=='string'||!ID.test(entry.bindingId)||!validTransportBinding(entry))reject('DELIVERY_CONFIGURATION_INVALID',409);
  if(seen.has(entry.associationId))reject('DELIVERY_CONFIGURATION_INVALID',409);seen.add(entry.associationId);
 }
 return value.bindings;
}

export async function requestMarketingReceipt({binding,canonicalEnvelope,envelope,fetchImpl=fetch,timeoutMs=20000}){
 if(!validTransportBinding(binding)||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>20000)reject('DELIVERY_CONFIGURATION_INVALID',409);
 if(canonicalText(envelope)!==canonicalEnvelope||Buffer.byteLength(canonicalEnvelope)>256*1024
  ||!HASH.test(envelope.payloadHash??'')||canonicalHash(Object.fromEntries(Object.entries(envelope).filter(([key])=>key!=='payloadHash')))!==envelope.payloadHash)reject('FROZEN_REPORT_INVALID');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 let response;
 try{
  response=await fetchImpl(binding.origin+'/api/growth/external-marketing-reports',{method:'POST',redirect:'manual',signal:controller.signal,
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+binding.credential},body:canonicalEnvelope});
  const chunks=[];let size=0;
  if(response.body)for await(const chunk of response.body){size+=chunk.length;if(size>4096){controller.abort();return {outcome:'UNKNOWN',httpStatus:response.status};}chunks.push(Buffer.from(chunk));}
  if(controller.signal.aborted)return {outcome:'UNKNOWN',httpStatus:response.status};
  return classifyMarketingResponse({status:response.status,body:Buffer.concat(chunks),envelope,retryAfter:response.headers.get('retry-after')});
 }catch{return {outcome:'UNKNOWN',...(response?{httpStatus:response.status}:{})};}
 finally{clearTimeout(timer);}
}

export async function readDeliveryRequest(req){
 let raw;if(req.body!==undefined)raw=Buffer.from(typeof req.body==='string'?req.body:Buffer.isBuffer(req.body)?req.body:JSON.stringify(req.body));
 else{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1024)reject('DELIVERY_BODY_LIMIT',413);chunks.push(Buffer.from(chunk));}raw=Buffer.concat(chunks);}
 if(raw.length>1024)reject('DELIVERY_BODY_LIMIT',413);
 if(raw.length===0)return;
 let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));}catch{reject('JSON_INVALID',400);}
 if(!fields(value,[]))reject('DELIVERY_FIELDS_INVALID');
}
