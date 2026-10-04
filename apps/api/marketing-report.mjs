// @trace implements FR-015-001, FR-015-002
import {createHash} from 'node:crypto';
import {VERSION,validDate,dayDiff,plusDays,eligibleOrder} from '../web/src/content/shared/model.mjs';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/;
const reject=(code,status=422)=>{throw Object.assign(Error('Marketing report: '+code),{code,status});};
const integer=(v,min=0)=>Number.isSafeInteger(v)&&v>=min;
const revision=v=>{const s=String(v);if(!/^(0|[1-9][0-9]*)$/.test(s))reject('SOURCE_REVISION_INVALID');return s;};
const instant=value=>{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!validDate(value.slice(0,10))||!Number.isFinite(Date.parse(value)))reject('AS_OF_INVALID');
 const time=value.slice(11,19).split(':').map(Number);if(time[0]>23||time[1]>59||time[2]>59)reject('AS_OF_INVALID');
 return Date.parse(value);
};
const localDate=(value,timezone)=>new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));

export function canonicalHash(value){
 const json=JSON.stringify(value,(_,v)=>{
  if(v===undefined||typeof v==='number'&&!Number.isFinite(v)||['bigint','function','symbol'].includes(typeof v))reject('HASH_VALUE_INVALID');
  return v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v;
 });
 return createHash('sha256').update(json,'utf8').digest('hex');
}

export function validateWindow(input,now=new Date()){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==4||Object.keys(input).some(k=>!['start','endExclusive','timezone','asOf'].includes(k)))reject('WINDOW_FIELDS_INVALID');
 const {start,endExclusive,timezone,asOf}=input;
 if(!validDate(start)||!validDate(endExclusive)||new Date(start+'T00:00:00Z').getUTCDay()!==1||dayDiff(start,endExclusive)!==7)reject('WEEK_INVALID');
 if(typeof timezone!=='string'||timezone.length>64||timezone!=='UTC'&&!timezone.includes('/'))reject('TIMEZONE_INVALID');
 try{new Intl.DateTimeFormat('en',{timeZone:timezone});}catch{reject('TIMEZONE_INVALID');}
 const at=instant(asOf);if(at>now.getTime()||localDate(at,timezone)<start)reject('AS_OF_INVALID');
 return {start,endExclusive,timezone,asOf};
}

// This endpoint accepts only four scalar fields. Detect even escaped duplicate keys before JSON.parse loses them.
export async function readPreviewRequest(req,now=new Date()){
 let raw;
 if(req.body!==undefined)raw=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));
 else{const chunks=[];let size=0;for await(const chunk of req){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>1024)reject('PREVIEW_BODY_LIMIT',413);chunks.push(bytes);}raw=Buffer.concat(chunks);}
 if(raw.length>1024)reject('PREVIEW_BODY_LIMIT',413);
 let text,input;try{text=new TextDecoder('utf-8',{fatal:true}).decode(raw);input=JSON.parse(text);}catch{reject('JSON_INVALID',400);}
 const keys=new Set();for(const token of text.matchAll(/"(?:\\.|[^"\\])*"/g))if(/^\s*:/.test(text.slice(token.index+token[0].length))){const k=JSON.parse(token[0]);if(keys.has(k))reject('JSON_DUPLICATE_KEY',400);keys.add(k);}
 return validateWindow(input,now);
}

export async function readMarketingReportSource(tx,businessId,campaignId){
 if(process.env.VERCEL==='1'||tx.zuriViewer?.kind!=='operator')reject('PREVIEW_OPERATOR_REQUIRED',403);
 if(!UUID.test(businessId)||!UUID.test(campaignId))reject('SOURCE_SCOPE_INVALID',403);
 const row=(await tx.query(`SELECT b.id AS business_id,b.domain_revision,c.id AS campaign_id,c.code,c.objective,c.lifecycle,c.currency,
 c.row_version AS campaign_row_version,s.row_version AS state_row_version,s.schema_version,s.payload_hash,s.state_json,
 transaction_timestamp() AS captured_at FROM businesses b JOIN campaigns c ON c.business_id=b.id
 LEFT JOIN campaign_states s ON s.business_id=c.business_id AND s.campaign_id=c.id
 WHERE b.id=$1 AND b.id=current_setting('zuri_go.business_id',true)::uuid AND c.id=$2 AND c.archived_at IS NULL`,[businessId,campaignId])).rows[0];
 if(!row)reject('CAMPAIGN_NOT_READABLE',404);
 if(row.business_id!==businessId||row.campaign_id!==campaignId)reject('SOURCE_SCOPE_INVALID',403);
 if(row.state_json!==null&&(row.schema_version!==VERSION||row.payload_hash!==canonicalHash(row.state_json)))reject('SOURCE_STATE_INVALID');
 if(!/^CAM-[0-9]{4,60}$/.test(row.code)||!['inventory','commerce','leads','awareness'].includes(row.objective)||!['unconfirmed','draft','queued','active','paused','completed','cancelled'].includes(row.lifecycle)||!/^([A-Z]{3})$/.test(row.currency))reject('SOURCE_CONTEXT_INVALID');
 return {businessId,campaign:{sourceCampaignId:campaignId,code:row.code,objective:row.objective,lifecycle:row.lifecycle,currency:row.currency},
  sourceRevision:{campaignRowVersion:revision(row.campaign_row_version),stateRowVersion:row.state_row_version===null?null:revision(row.state_row_version),statePayloadHash:row.payload_hash,businessDomainRevision:revision(row.domain_revision),modelVersion:String(VERSION)},
  capturedAt:new Date(row.captured_at).toISOString(),state:row.state_json};
}

const decimal=value=>{
 if(value==null)return null;
 if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>Number.MAX_SAFE_INTEGER||Math.abs(value*10000-Math.round(value*10000))>0.00001)reject('SOURCE_DECIMAL_INVALID');
 return value.toFixed(4).replace(/\.?0+$/,'')||'0';
};
function inputRows(c,key){
 const rows=c[key];if(!Array.isArray(rows)||rows.length>10000)reject('SOURCE_ROWS_INVALID');
 const ids=new Set();for(const r of rows){if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||!validDate(r.date))reject('SOURCE_ROWS_INVALID');ids.add(r.id);}
 return rows;
}

// Internal observed arithmetic only. No watermark attests completeness; these facts are never exported while timezone is unknown.
export function deriveReportedFacts(c,window){
 const asOf=localDate(instant(window.asOf),window.timezone),activityEnd=asOf<window.endExclusive?asOf:plusDays(window.endExclusive,-1);
 const inside=date=>validDate(date)&&date>=window.start&&date<window.endExclusive&&date<=asOf;
 const ads=inputRows(c,'ads').filter(r=>inside(r.date)),allLeads=inputRows(c,'leads'),leads=allLeads.filter(r=>inside(r.date));
 const allOrders=inputRows(c,'orders');
 for(const r of ads){if(r.spend==null||r.spend<0)reject('SOURCE_ROWS_INVALID');decimal(r.spend);for(const k of ['impressions','clicks'])if(r[k]!=null&&!integer(r[k]))reject('SOURCE_ROWS_INVALID');if(r.clicks!=null&&r.impressions!=null&&r.clicks>r.impressions)reject('SOURCE_ROWS_INVALID');}
 for(const r of allLeads)for(const k of ['mqlAt','sqlAt'])if(r[k]&&(!validDate(r[k])||r[k]<r.date))reject('SOURCE_ROWS_INVALID');
 for(const r of allOrders){if(!['paid','fulfilled','cancelled','void'].includes(r.status)||r.amount==null||r.refund==null||r.refund<0||r.amount<r.refund)reject('SOURCE_ROWS_INVALID');decimal(r.amount);decimal(r.refund);if(r.refund>0&&(!validDate(r.refundAt)||r.refundAt<r.date))reject('SOURCE_ROWS_INVALID');}
 const orders=allOrders.filter(r=>r.status!=='void'),events=orders.filter(r=>inside(r.date)||inside(r.refundAt));
 const total=key=>ads.length&&ads.every(r=>r[key]!=null)?ads.reduce((n,r)=>n+r[key],0):null;
 const spend=total('spend'),impressions=total('impressions'),clicks=total('clicks');
 const paid=orders.filter(r=>inside(r.date)&&eligibleOrder(r,activityEnd));
 const revenue=events.length?orders.reduce((n,r)=>n+(inside(r.date)?r.amount:0)-(inside(r.refundAt)?r.refund:0),0):null;
 const stages=key=>allLeads.some(r=>inside(r[key]))?allLeads.filter(r=>inside(r[key])).length:leads.length?0:null;
 const windowDays=c.windowDays;if(windowDays!=null&&!integer(windowDays,1))reject('SOURCE_WINDOW_INVALID');
 const mature=windowDays==null?[]:leads.filter(r=>dayDiff(r.date,asOf)>=windowDays);
 const converted=mature.filter(l=>orders.some(o=>o.leadId===l.id&&eligibleOrder(o,asOf)&&dayDiff(l.date,o.date)>=0&&dayDiff(l.date,o.date)<=windowDays)).length;
 const ratio=(a,b)=>a!=null&&b>0?a/b:null,leadCount=leads.length?leads.length:null,orderCount=events.length?paid.length:null;
 for(const value of [impressions,clicks])if(value!=null&&!integer(value))reject('SOURCE_COUNT_INVALID');
 return {spend,impressions,clicks,leadCount,mql:stages('mqlAt'),sql:stages('sqlAt'),orders:orderCount,revenue,ctr:ratio(clicks,impressions),cpl:ratio(spend,leadCount),cpo:ratio(spend,orderCount),
  followupWindowDays:windowDays??null,mature:windowDays==null?null:mature.length,pending:windowDays==null?null:leads.length-mature.length,converted:windowDays==null?null:converted,cvr:windowDays==null?null:ratio(converted,mature.length)};
}

const KEYS=[['reported_spend','currency','ads'],['reported_impressions','count','ads'],['reported_clicks','count','ads'],['reported_new_leads','count','leads'],['reported_mql_entries','count','leads'],['reported_sql_entries','count','leads'],['reported_paid_orders','count','orders'],['reported_net_revenue','currency','orders'],['reported_ctr','ratio','ads','count','count'],['reported_cpl','currency','ads','currency','count'],['reported_cpo','currency','ads','currency','count'],['reported_mature_lead_to_paid','ratio','leads','count','count']];
const FINDINGS={BLOCK:['GATE_BLOCKED'],DATA_HOLD:['MISSING_REVIEW_INPUTS'],LEARNING:['LEARNING_ONLY'],FIX:['RECHECK_REQUIRED'],ON_TRACK:[],HIGH:[],BASE:[]};

export function previewMarketingReport(snapshot,requestedWindow){
 const window=validateWindow(requestedWindow,new Date(snapshot.capturedAt)),c=snapshot.state;
 const missingFieldCodes=['SOURCE_TIMEZONE_UNATTESTED','SOURCE_COVERAGE_UNATTESTED'];
 if(!c)missingFieldCodes.push('CAMPAIGN_STATE_MISSING');
 else{if(!integer(c.version,1))reject('SOURCE_SETTINGS_INVALID');deriveReportedFacts(c,window);}
 const contextMissing=[];
 const amount=(v,code)=>{if(v==null)contextMissing.push(code);if(v!=null&&v<0)reject('SOURCE_CONTEXT_INVALID');return decimal(v);};
 const context={settingsVersion:c?.version??null,targets:{low:amount(c?.targets?.low,'TARGET_LOW_MISSING'),mid:amount(c?.targets?.mid,'TARGET_MID_MISSING'),high:amount(c?.targets?.high,'TARGET_HIGH_MISSING')},releasedCap:amount(c?.cap,'RELEASED_CAP_MISSING'),committedSpend:amount(c?.committed,'COMMITTED_SPEND_MISSING'),definitionVersion:String(VERSION),missingFieldCodes:contextMissing};
 const sourceReferences=c?[{refId:'campaign-state',kind:'CAMPAIGN_STATE',sourceEntityId:snapshot.campaign.sourceCampaignId,sourceRevision:snapshot.sourceRevision.stateRowVersion,sanitizedHash:null}]:[];
 const measurements=KEYS.map(([key,unit,collection,numeratorUnit,denominatorUnit])=>{
  const cohort=key==='reported_mature_lead_to_paid',watermark=c?.sources?.[collection];
  return {key,value:null,unit,currency:unit==='currency'?snapshot.campaign.currency:null,quality:'UNKNOWN',reasonCodes:[...missingFieldCodes],
   scope:{kind:cohort?'ACQUISITION_COHORT':'ACTIVITY',...window,offer:null,channel:null,attributionState:'UNKNOWN'},
   ratio:numeratorUnit?{numerator:null,denominator:null,numeratorUnit,denominatorUnit,formulaVersion:'reported-marketing/0.1'}:null,
   cohort:cohort?{followupWindowDays:c?.windowDays??null,matureCount:null,pendingCount:null,convertedCount:null}:null,
   provenance:{sourceClass:'MANUAL_REPORTED',modelVersion:String(VERSION),collectionKnownAt:null,watermarkDate:validDate(watermark)?watermark:null,sourceTimezone:null,timezoneState:'UNKNOWN',sourceRefIds:c?['campaign-state']:[]}};
 }).sort((a,b)=>a.key<b.key?-1:1);
 let weeklyReviewAssertion=null;
 if(c){if(!Array.isArray(c.reviews)||c.reviews.length>10000)reject('SOURCE_REVIEWS_INVALID');
  const candidates=c.reviews.filter(r=>r&&validDate(r.date)&&r.date>=window.start&&r.date<window.endExclusive&&r.date<=localDate(instant(window.asOf),window.timezone)).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:String(a.id)<String(b.id)?-1:1);
  const r=candidates.at(-1),status=r?.snapshot?.gate?.status,settingsVersion=r?.snapshot?.settings?.version;
  if(r&&ID.test(r.id)&&integer(settingsVersion,1)&&Object.hasOwn(FINDINGS,status)){
   const safe={sourceReviewId:r.id,recordedDate:r.date,settingsVersion,reportedGateStatus:status,findingCodes:FINDINGS[status],recommendationCodes:[],provenance:'LEGACY_REPORTED',approvalTrust:'UNVERIFIED'};
   weeklyReviewAssertion={...safe,sanitizedSnapshotHash:canonicalHash(safe)};
   sourceReferences.push({refId:'weekly-review',kind:'LEGACY_REVIEW',sourceEntityId:r.id,sourceRevision:snapshot.sourceRevision.stateRowVersion,sanitizedHash:weeklyReviewAssertion.sanitizedSnapshotHash});
  }
 }
 if(!weeklyReviewAssertion)missingFieldCodes.push('WEEKLY_REVIEW_UNAVAILABLE');
 const campaign=Object.fromEntries(['sourceCampaignId','code','objective','lifecycle','currency'].map(k=>[k,snapshot.campaign[k]]));
 const sourceRevision=Object.fromEntries(['campaignRowVersion','stateRowVersion','statePayloadHash','businessDomainRevision','modelVersion'].map(k=>[k,snapshot.sourceRevision[k]]));
 const content={previewVersion:'zuri-marketing-preview/0.1',readiness:'HELD',businessId:snapshot.businessId,campaign,sourceRevision,capturedAt:snapshot.capturedAt,window,
  payload:{context,measurements,sourceReferences,weeklyReviewAssertion,missingFieldCodes}};
 if(Buffer.byteLength(JSON.stringify(content),'utf8')>256*1024)reject('PREVIEW_OUTPUT_LIMIT',413);
 return {...content,previewHash:canonicalHash(content)};
}
