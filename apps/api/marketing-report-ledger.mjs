// @trace implements FR-015-001, FR-015-003 — local preparation and immutable QUEUED ledger; no transport.
import {canonicalHash,previewMarketingReport,readMarketingReportSource,validateWindow} from './marketing-report.mjs';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const HASH=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/;
const uuid=v=>typeof v==='string'&&UUID.test(v);
const sha=v=>typeof v==='string'&&HASH.test(v);
const reject=(code,status=422)=>{throw Object.assign(Error('Marketing report: '+code),{code,status});};
const fields=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const revisionKeys=['campaignRowVersion','stateRowVersion','statePayloadHash','businessDomainRevision','modelVersion'];
const validRevision=r=>fields(r,revisionKeys)&&revisionKeys.filter(k=>k!=='statePayloadHash').every(k=>typeof r[k]==='string'&&/^(0|[1-9][0-9]*)$/.test(r[k]))&&sha(r.statePayloadHash)&&r.modelVersion==='1';
const goodUnicode=s=>!/[\uD800-\uDFFF]/u.test(s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,''));
export const canonicalText=v=>{canonicalHash(v);return JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);};

export function validatePreparationRequest(input,now=new Date()){
 if(!fields(input,['idempotencyKey','associationId','window'])||!uuid(input.idempotencyKey)||!uuid(input.associationId))reject('PREPARATION_FIELDS_INVALID');
 return {...input,window:validateWindow(input.window,now)};
}
export function validateFreezeRequest(input){
 if(!fields(input,['idempotencyKey','preparationId','expectedPreviewHash','expectedSourceRevision'])||!uuid(input.idempotencyKey)||!uuid(input.preparationId)||!sha(input.expectedPreviewHash)||!validRevision(input.expectedSourceRevision))reject('FREEZE_FIELDS_INVALID');
 return input;
}

// Parse first, then walk JSON tokens with a separate key set for each object. Escaped names are compared after decoding.
export async function readLedgerRequest(req,operation){
 let raw;
 if(req.body!==undefined)raw=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));
 else{const chunks=[];let size=0;for await(const chunk of req){const b=Buffer.from(chunk);size+=b.length;if(size>4096)reject('REPORT_BODY_LIMIT',413);chunks.push(b);}raw=Buffer.concat(chunks);}
 if(raw.length>4096)reject('REPORT_BODY_LIMIT',413);
 let text,input;try{text=new TextDecoder('utf-8',{fatal:true}).decode(raw);input=JSON.parse(text);}catch{reject('JSON_INVALID',400);}
 const tokens=text.match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]|[^\s{}\[\]:,]+/g);let index=0;
 const walk=()=>{const t=tokens[index++];if(t==='{'||t==='['){const end=t==='{'?'}':']',keys=new Set();while(tokens[index]!==end){if(t==='{'){const key=JSON.parse(tokens[index++]);if(!goodUnicode(key))reject('JSON_UNICODE_INVALID',400);if(keys.has(key))reject('JSON_DUPLICATE_KEY',400);keys.add(key);index++;}walk();if(tokens[index]===',')index++;}index++;}else if(t?.startsWith('"')&&!goodUnicode(JSON.parse(t)))reject('JSON_UNICODE_INVALID',400);};
 walk();return operation==='prepare'?validatePreparationRequest(input):validateFreezeRequest(input);
}

const metricUnits={reported_spend:'currency',reported_impressions:'count',reported_clicks:'count',reported_new_leads:'count',reported_mql_entries:'count',reported_sql_entries:'count',reported_paid_orders:'count',reported_net_revenue:'currency',reported_ctr:'ratio',reported_cpl:'currency',reported_cpo:'currency',reported_mature_lead_to_paid:'ratio'};
const findings={BLOCK:['GATE_BLOCKED'],DATA_HOLD:['MISSING_REVIEW_INPUTS'],LEARNING:['LEARNING_ONLY'],FIX:['RECHECK_REQUIRED'],ON_TRACK:[],HIGH:[],BASE:[]};
const equal=(a,b)=>canonicalText(a)===canonicalText(b);
const amount=v=>v===null||typeof v==='string'&&/^(0|[1-9][0-9]*)(\.[0-9]{1,4})?$/.test(v)&&Number(v)<=Number.MAX_SAFE_INTEGER;
function assertPreview(p){
 const invalid=()=>reject('PREPARATION_INVALID');
 if(!fields(p,['previewVersion','readiness','businessId','campaign','sourceRevision','capturedAt','window','payload','previewHash'])||p.previewVersion!=='zuri-marketing-preview/0.1'||p.readiness!=='HELD'||!uuid(p.businessId)||!validRevision(p.sourceRevision)||typeof p.capturedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(p.capturedAt))invalid();
 validateWindow(p.window,new Date(p.capturedAt));
 const c=p.campaign;
 if(!fields(c,['sourceCampaignId','code','objective','lifecycle','currency'])||!uuid(c.sourceCampaignId)||typeof c.code!=='string'||!/^CAM-[0-9]{4,60}$/.test(c.code)||!['inventory','commerce','leads','awareness'].includes(c.objective)||!['unconfirmed','draft','queued','active','paused','completed','cancelled'].includes(c.lifecycle)||typeof c.currency!=='string'||!/^([A-Z]{3})$/.test(c.currency))invalid();
 const payload=p.payload;
 if(!fields(payload,['context','measurements','sourceReferences','weeklyReviewAssertion','missingFieldCodes']))invalid();
 const context=payload.context;
 if(!fields(context,['settingsVersion','targets','releasedCap','committedSpend','definitionVersion','missingFieldCodes'])||!Number.isSafeInteger(context.settingsVersion)||context.settingsVersion<1||context.definitionVersion!=='1'||!fields(context.targets,['low','mid','high'])||![...Object.values(context.targets),context.releasedCap,context.committedSpend].every(amount))invalid();
 const contextMissing=[];for(const k of ['low','mid','high'])if(context.targets[k]===null)contextMissing.push('TARGET_'+k.toUpperCase()+'_MISSING');
 if(context.releasedCap===null)contextMissing.push('RELEASED_CAP_MISSING');if(context.committedSpend===null)contextMissing.push('COMMITTED_SPEND_MISSING');if(!equal(context.missingFieldCodes,contextMissing))invalid();
 const baseMissing=['SOURCE_TIMEZONE_UNATTESTED','SOURCE_COVERAGE_UNATTESTED'];
 const refs=[{refId:'campaign-state',kind:'CAMPAIGN_STATE',sourceEntityId:c.sourceCampaignId,sourceRevision:p.sourceRevision.stateRowVersion,sanitizedHash:null}];
 const review=payload.weeklyReviewAssertion;
 if(review!==null){
  if(!fields(review,['sourceReviewId','recordedDate','settingsVersion','reportedGateStatus','findingCodes','recommendationCodes','provenance','approvalTrust','sanitizedSnapshotHash'])||typeof review.sourceReviewId!=='string'||!ID.test(review.sourceReviewId)||!Number.isSafeInteger(review.settingsVersion)||review.settingsVersion<1||typeof review.recordedDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(review.recordedDate)||review.recordedDate<p.window.start||review.recordedDate>=p.window.endExclusive||!Object.hasOwn(findings,review.reportedGateStatus)||review.provenance!=='LEGACY_REPORTED'||review.approvalTrust!=='UNVERIFIED'||!equal(review.findingCodes,findings[review.reportedGateStatus])||!equal(review.recommendationCodes,[]))invalid();
  const {sanitizedSnapshotHash,...safe}=review;if(sanitizedSnapshotHash!==canonicalHash(safe))invalid();
  refs.push({refId:'weekly-review',kind:'LEGACY_REVIEW',sourceEntityId:review.sourceReviewId,sourceRevision:p.sourceRevision.stateRowVersion,sanitizedHash:sanitizedSnapshotHash});
 }
 if(!equal(payload.sourceReferences,refs)||!equal(payload.missingFieldCodes,review===null?[...baseMissing,'WEEKLY_REVIEW_UNAVAILABLE']:baseMissing)||!Array.isArray(payload.measurements)||!payload.measurements.every(m=>m&&typeof m==='object'&&!Array.isArray(m))||!equal(payload.measurements.map(m=>m.key),Object.keys(metricUnits).sort()))invalid();
 for(const m of payload.measurements){
  const key=m.key,cohort=key==='reported_mature_lead_to_paid',unit=metricUnits[key];
  if(!fields(m,['key','value','unit','currency','quality','reasonCodes','scope','ratio','cohort','provenance'])||m.value!==null||m.unit!==unit||m.currency!==(unit==='currency'?c.currency:null)||m.quality!=='UNKNOWN'||!equal(m.reasonCodes,baseMissing)||!equal(m.scope,{kind:cohort?'ACQUISITION_COHORT':'ACTIVITY',...p.window,offer:null,channel:null,attributionState:'UNKNOWN'}))invalid();
  const ratio=['reported_ctr','reported_cpl','reported_cpo','reported_mature_lead_to_paid'].includes(key)?{numerator:null,denominator:null,numeratorUnit:unit==='currency'?'currency':'count',denominatorUnit:'count',formulaVersion:'reported-marketing/0.1'}:null;
  if(!equal(m.ratio,ratio)||(!cohort&&m.cohort!==null)||cohort&&(!fields(m.cohort,['followupWindowDays','matureCount','pendingCount','convertedCount'])||!['matureCount','pendingCount','convertedCount'].every(k=>m.cohort[k]===null)||m.cohort.followupWindowDays!==null&&(!Number.isSafeInteger(m.cohort.followupWindowDays)||m.cohort.followupWindowDays<1)))invalid();
  const provenance=m.provenance;
  if(!fields(provenance,['sourceClass','modelVersion','collectionKnownAt','watermarkDate','sourceTimezone','timezoneState','sourceRefIds'])||provenance.sourceClass!=='MANUAL_REPORTED'||provenance.modelVersion!=='1'||provenance.collectionKnownAt!==null||provenance.sourceTimezone!==null||provenance.timezoneState!=='UNKNOWN'||!equal(provenance.sourceRefIds,['campaign-state'])||provenance.watermarkDate!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(provenance.watermarkDate))invalid();
 }
}
export function buildMarketingEnvelope(preparation,association,serverIdentity){
 const preview=preparation.preview;
 assertPreview(preview);if(preview.previewHash!==canonicalHash(Object.fromEntries(Object.entries(preview).filter(([k])=>k!=='previewHash'))))reject('PREPARATION_INVALID');
 if(!['source_deployment_id','external_binding_id','parent_initiative_id'].every(k=>typeof association[k]==='string'&&ID.test(association[k]))||!uuid(serverIdentity.reportId)||typeof serverIdentity.frozenAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(serverIdentity.frozenAt)||!Number.isFinite(Date.parse(serverIdentity.frozenAt))||Date.parse(serverIdentity.frozenAt)<Date.parse(preview.capturedAt))reject('SERVER_IDENTITY_INVALID');
 const {campaign,sourceRevision,window,payload}=preview;
 const content={contractVersion:'zuri-marketing-report/0.1',reportId:serverIdentity.reportId,reportRevision:1,supersedesReportId:null,
  source:{system:'zuri-go',deploymentId:association.source_deployment_id,sourceBusinessId:preview.businessId},target:{bindingId:association.external_binding_id,initiativeId:association.parent_initiative_id},campaign,sourceRevision,window,frozenAt:serverIdentity.frozenAt,payload};
 const envelope={...content,payloadHash:canonicalHash(content)},bytes=canonicalText(envelope);
 if(Buffer.byteLength(bytes)>256*1024)reject('REPORT_OUTPUT_LIMIT',413);
 return {envelope,bytes,payloadHash:envelope.payloadHash};
}

function operator(tx,businessId){if(process.env.VERCEL==='1'||tx.zuriViewer?.kind!=='operator'||!UUID.test(businessId))reject('REPORT_OPERATOR_REQUIRED',403);}
const SQL_CODES={REPORT_DENIED:403,ASSOCIATION_DENIED:403,PREPARATION_NOT_READABLE:404,CAMPAIGN_NOT_READABLE:404,SOURCE_INCOMPLETE:422,SOURCE_INVALID:422,REQUEST_INVALID:422,
 IDEMPOTENCY_CONFLICT:409,ASSOCIATION_STALE:409,SOURCE_STALE:409,PREVIEW_MISMATCH:409,PREPARATION_EXPIRED:409,PREPARATION_ALREADY_FROZEN:409,REPORT_SCOPE_EXISTS:409};
async function finalize(tx,fn,b,c,input){
 try{return (await tx.query(`SELECT zuri_go.${fn}($1::uuid,$2::uuid,$3::jsonb) AS result`,[b,c,input])).rows[0].result;}
 catch(e){if(e.code==='P0001'&&Object.hasOwn(SQL_CODES,e.message))reject(e.message,SQL_CODES[e.message]);throw e;}
}
export async function prepareMarketingReport(tx,businessId,campaignId,request){
 operator(tx,businessId);if(!UUID.test(campaignId))reject('SOURCE_SCOPE_INVALID',403);validatePreparationRequest(request);
 const result=await finalize(tx,'marketing_prepare',businessId,campaignId,request);
 // Independent JS/SQL projection parity for newly captured rows. Replay never recaptures or changes its original bytes/time.
 if(!result.replayed){const source=await readMarketingReportSource(tx,businessId,campaignId);source.capturedAt=result.preparation.preview.capturedAt;
  if(canonicalText(previewMarketingReport(source,request.window))!==canonicalText(result.preparation.preview))reject('SOURCE_INVALID');}
 return result;
}
export async function freezeMarketingReport(tx,businessId,campaignId,request){
 operator(tx,businessId);if(!UUID.test(campaignId))reject('SOURCE_SCOPE_INVALID',403);validateFreezeRequest(request);
 return finalize(tx,'marketing_freeze',businessId,campaignId,request);
}
export async function readMarketingReport(tx,businessId,reportId){
 operator(tx,businessId);if(!UUID.test(reportId))reject('REPORT_NOT_READABLE',404);
 const row=(await tx.query(`SELECT r.canonical_envelope,o.state FROM zuri_go.marketing_reports r
 JOIN zuri_go.marketing_report_outbox o ON o.business_id=r.business_id AND o.report_id=r.id
 JOIN zuri_go.marketing_report_preparations p ON p.business_id=r.business_id AND p.id=r.preparation_id
 JOIN zuri_go.marketing_report_associations a ON a.business_id=p.business_id AND a.id=p.association_id AND a.active AND a.row_version=p.association_version
 WHERE r.business_id=$1 AND r.business_id=current_setting('zuri_go.business_id',true)::uuid AND r.id=$2`,[businessId,reportId])).rows[0];
 if(!row)reject('REPORT_NOT_READABLE',404);
 return {envelope:JSON.parse(row.canonical_envelope),canonicalEnvelope:row.canonical_envelope,state:row.state};
}
export const ledgerRetry=e=>e.code==='40001'||e.code==='23505'&&['marketing_preparation_key','marketing_freeze_key','marketing_one_preparation','marketing_original_scope'].includes(e.constraint);
