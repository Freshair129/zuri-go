// @trace implements FR-014-001, FR-014-003, FR-014-007, FR-014-010
import {createHash} from 'node:crypto';
export const fail=(code,status=422,message='ข้อมูล Visual Studio ไม่ถูกต้อง')=>{throw Object.assign(Error(message),{code,status});};
export const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const digest=value=>createHash('sha256').update(JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v)).digest('hex');
export const STAGES=['RESEARCH','STRATEGY','CONCEPT','COPY','ART_DIRECTION'];
export const assetText=payload=>payload.copy+'\n\n'+payload.visual_prompt;
export const assetChecksum=payload=>createHash('sha256').update(assetText(payload),'utf8').digest('hex');
export const CHECKS=['brand_consistency','message_accuracy','offer_accuracy','cta_clarity','channel_suitability','policy_safety','hallucinated_claims','duplicate_concepts'];
export function object(input,fields){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('BODY_INVALID');
 if(Buffer.byteLength(JSON.stringify(input))>65536)fail('BODY_TOO_LARGE',413);
 for(const key of Object.keys(input))if(!fields.includes(key))fail('FIELD_UNKNOWN');
 return input;
}
const text=v=>{if(v==null)return null;if(typeof v!=='string'||v.length>4000||v.includes('\0'))fail('FIELD_INVALID');return v.trim();};
const list=v=>{if(v==null)return [];if(!Array.isArray(v)||v.length>50)fail('FIELD_INVALID');return v.map(x=>{const t=text(x);if(!t)fail('FIELD_INVALID');return t;});};
export const BRAND_FIELDS=['identity','positioning','audience','tone_of_voice','colors','typography','visual_language','photography_style','composition_rules','messaging_rules','approved_claims','forbidden_claims','positive_examples','negative_examples'];
const brandLists=['colors','composition_rules','messaging_rules','approved_claims','forbidden_claims','positive_examples','negative_examples'];
export function validateBrand(input){object(input,BRAND_FIELDS);const out=Object.fromEntries(BRAND_FIELDS.map(k=>[k,brandLists.includes(k)?list(input[k]):text(input[k])]));if(!out.identity)fail('BRAND_REQUIRED');return out;}
export const BRIEF_FIELDS=['project_id','brand_profile_id','campaign_id','objective','product','offer','audience','insight','message','proof_points','channel','format','aspect_ratio','cta','tone','visual_direction','mandatory_elements','forbidden_elements','references','due_date'];
const briefLists=['proof_points','mandatory_elements','forbidden_elements','references'];
export function validateBrief(input){
 object(input,BRIEF_FIELDS);const out=Object.fromEntries(BRIEF_FIELDS.map(k=>[k,briefLists.includes(k)?list(input[k]):text(input[k])]));
 for(const k of ['project_id','brand_profile_id'])if(!uuid(out[k]))fail('FIELD_INVALID');
 if(out.campaign_id&&!uuid(out.campaign_id))fail('FIELD_INVALID');
 for(const k of ['objective','product','audience','message','channel','format','cta'])if(!out[k])fail('BRIEF_REQUIRED');
 if(!/^([1-9]\d?):([1-9]\d?)$/.test(out.aspect_ratio||''))fail('ASPECT_RATIO_INVALID');
 if(out.due_date&&(!/^\d{4}-\d{2}-\d{2}$/.test(out.due_date)||!Number.isFinite(Date.parse(out.due_date))||new Date(out.due_date).toISOString().slice(0,10)!==out.due_date))fail('DATE_INVALID');
 return out;
}
export function validateStage(stage,input){
 if(!STAGES.includes(stage))fail('STAGE_INVALID');object(input,['text','claims']);const out={text:text(input.text),claims:list(input.claims)};if(!out.text)fail('OUTPUT_REQUIRED');return out;
}
export function reviewBundle(brief,brand,outputs,assessment={}){
 object(assessment,CHECKS);for(const value of Object.values(assessment))if(typeof value!=='boolean')fail('ASSESSMENT_INVALID');
 const allowed=new Set([...(brief.proof_points||[]),...(brand.approved_claims||[])]),forbidden=[...(brief.forbidden_elements||[]),...(brand.forbidden_claims||[])];
 const findings=CHECKS.map(category=>({category,status:assessment[category]===true?'pass':assessment[category]===false?'fail':'not_assessed',severity:assessment[category]===true?'info':'blocking',evidenceRefs:['brief','brand','COPY','ART_DIRECTION'],message:assessment[category]===true?'ผู้ตรวจยืนยันแล้ว':'ต้องตรวจยืนยันหัวข้อนี้'}));
 for(const [stage,output] of Object.entries(outputs)){
  for(const claim of output.claims||[])if(!allowed.has(claim))findings.push({category:'hallucinated_claims',status:'fail',severity:'blocking',evidenceRefs:[stage],message:'ข้อความอ้างอิงไม่มีหลักฐานที่ยืนยัน: '+claim});
  for(const word of forbidden)if(output.text?.toLowerCase().includes(word.toLowerCase()))findings.push({category:'brand_consistency',status:'fail',severity:'blocking',evidenceRefs:[stage],message:'พบข้อความที่ห้ามใช้: '+word});
 }
 for(const stage of ['COPY','ART_DIRECTION'])if(!outputs[stage])findings.push({category:'completeness',status:'fail',severity:'blocking',evidenceRefs:[stage],message:'ยังไม่มี '+stage});
 for(const category of ['visual_hierarchy','readability'])findings.push({category,status:'not_assessed',severity:'info',evidenceRefs:['ART_DIRECTION'],message:'ตรวจได้เฉพาะ visual prompt; ยังไม่มีภาพให้ตรวจ'});
 const blockingIssues=findings.filter(f=>f.severity==='blocking');return {status:blockingIssues.length?'needs_revision':'pass',findings,blockingIssues,suggestions:blockingIssues.map(f=>f.message),deliverable:'copy_and_visual_prompt'};
}
export function validateAsset(input){
 object(input,['mime_type','object_key','checksum','width','height','duration']);
 if(input.mime_type!=='text/plain'||!/^artifact:[0-9a-f-]{36}$/.test(input.object_key||'')||!uuid(input.object_key.slice(9))||!/^([a-f0-9]{64})$/.test(input.checksum||'')||[input.width,input.height,input.duration].some(v=>v!=null))fail('ASSET_INVALID');
 return {...input,width:null,height:null,duration:null,storage_provider:'artifact_text'};
}
