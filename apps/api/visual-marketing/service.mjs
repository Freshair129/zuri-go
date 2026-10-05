// @trace implements FR-014-001, FR-014-003, FR-014-004, FR-014-007, FR-014-008, FR-014-009, FR-014-010
import {randomUUID} from 'node:crypto';
import {digest,fail,uuid,object,validateBrand,validateBrief,validateStage,validateAsset,assetChecksum,STAGES,CHECKS} from './contracts.mjs';
import {STAGE_AGENT,checkDelegation,getAgentRegistry} from './registry.mjs';
import {audit} from '../service.mjs';
export const actor=c=>{const v=c.zuriViewer;if(!['operator','member'].includes(v?.kind))fail('AUTH_REQUIRED',401);return {kind:v.kind,id:v.memberId||null};};
function approvalBoundaryError(error){
 const code=error?.code==='42501'?'APPROVAL_DENIED':['STALE','QA_REQUIRED','APPROVAL_DENIED','BUNDLE_INVALID'].includes(error?.message)?error.message:null;
 if(code)fail(code,code==='APPROVAL_DENIED'?403:409);
 throw error;
}
const artifactDto=({canonical_hash,...row})=>({...row,content_hash:canonical_hash});
export async function project(c,b,p,lock=false){
 const row=(await c.query(`SELECT v.*,p.name,p.owner_member_id,p.visibility FROM visual_projects v JOIN projects p ON p.business_id=v.business_id AND p.id=v.project_id WHERE v.business_id=$1 AND v.project_id=$2 ${lock?'FOR UPDATE OF v':''}`,[b,p])).rows[0];
 if(!row)fail('NOT_FOUND',404);return row;
}
export function version(row,input){if(String(row.row_version)!==String(input.row_version))fail('STALE',409);}
export function owner(c,row){return actor(c);}
export async function context(c,b,p){
 const row=await project(c,b,p),brief=(await c.query('SELECT * FROM visual_briefs WHERE business_id=$1 AND project_id=$2 AND id=$3',[b,p,row.current_brief_id])).rows[0];
 if(!brief)fail('BRIEF_REQUIRED',409);
 const brand=(await c.query('SELECT * FROM visual_brand_profiles WHERE business_id=$1 AND project_id=$2 AND id=$3',[b,p,brief.brand_profile_id])).rows[0];
 const artifacts=(await c.query('SELECT * FROM visual_artifacts WHERE business_id=$1 AND project_id=$2 AND revision=$3 ORDER BY created_at,id',[b,p,row.revision])).rows;
 return {row,brief,brand,artifacts,outputs:Object.fromEntries(artifacts.filter(a=>STAGES.includes(a.kind)).map(a=>[a.kind,a.payload]))};
}
export async function detail(c,b,p){
 const row=await project(c,b,p),result={project:row};
 for(const [key,table] of Object.entries({brands:'visual_brand_profiles',briefs:'visual_briefs',runs:'visual_runs',artifacts:'visual_artifacts',reviews:'visual_reviews',decisions:'visual_decisions',assets:'visual_assets',provider_runs:'visual_provider_runs'}))result[key]=(await c.query(`SELECT * FROM ${table} WHERE business_id=$1 AND project_id=$2 ORDER BY ${table==='visual_runs'?'started_at':'created_at'} DESC,id DESC LIMIT 100`,[b,p])).rows;
 result.artifacts=result.artifacts.map(artifactDto);
 result.jobs=(await c.query('SELECT id,project_id,run_id,revision,stage,state,attempt,row_version,error_class,created_at,updated_at FROM visual_jobs WHERE business_id=$1 AND project_id=$2 ORDER BY created_at DESC LIMIT 20',[b,p])).rows;
 result.public_outputs=(await c.query('SELECT project_id,artifact_id,decision_id,active,trusted_publication,created_at FROM visual_public_outputs WHERE business_id=$1 AND project_id=$2 ORDER BY created_at DESC',[b,p])).rows;
 result.can_approve=['operator','member'].includes(c.zuriViewer.kind);return result;
}
export async function receipt(c,b,p,operation,input,perform){
 const a=actor(c);if(!uuid(input.idempotency_key))fail('IDEMPOTENCY_REQUIRED');
 const key=a.kind+':'+(a.id||'local'),hash=digest(input),old=(await c.query('SELECT * FROM visual_receipts WHERE business_id=$1 AND actor_key=$2 AND operation=$3 AND idempotency_key=$4',[b,key,operation,input.idempotency_key])).rows[0];
 if(old){await project(c,b,old.project_id);if(old.payload_hash!==hash)fail('IDEMPOTENCY_CONFLICT',409);return old.response;}
 const response=await perform();await c.query('INSERT INTO visual_receipts(business_id,project_id,actor_key,operation,idempotency_key,payload_hash,response) VALUES($1,$2,$3,$4,$5,$6,$7)',[b,p,key,operation,input.idempotency_key,hash,response]);return response;
}
export async function initialize(c,b,input){
 object(input,['project_id','idempotency_key','strategy_approval_required']);if(!uuid(input.project_id)||input.strategy_approval_required!=null&&typeof input.strategy_approval_required!=='boolean')fail('FIELD_INVALID');
 return receipt(c,b,input.project_id,'initialize',input,async()=>{
  if(!(await c.query('SELECT id FROM projects WHERE business_id=$1 AND id=$2',[b,input.project_id])).rowCount)fail('NOT_FOUND',404);
  await c.query('INSERT INTO visual_projects(business_id,project_id,strategy_approval_required) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[b,input.project_id,input.strategy_approval_required===true]);return project(c,b,input.project_id);
 });
}
export async function brand(c,b,input){
 object(input,['project_id','idempotency_key','profile','confirmed','source_refs']);if(input.confirmed!==true)fail('CONFIRMATION_REQUIRED');
 const profile=validateBrand(input.profile),refs=input.source_refs==null?[]:input.source_refs;if(!Array.isArray(refs)||refs.length>20||refs.some(x=>typeof x!=='string'||!x.trim()||x.trim().length>2000))fail('FIELD_INVALID');
 const sourceRefs=refs.map(ref=>ref.trim());if(profile.approved_claims.length&&!sourceRefs.length)fail('CLAIM_SOURCE_REQUIRED');
 return receipt(c,b,input.project_id,'brand',input,async()=>{await project(c,b,input.project_id,true);const a=actor(c);return (await c.query('INSERT INTO visual_brand_profiles(business_id,project_id,profile,source_refs,input_hash,actor_kind,actor_member_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[b,input.project_id,profile,JSON.stringify(sourceRefs),digest({profile,source_refs:sourceRefs}),a.kind,a.id])).rows[0];});
}
export async function brief(c,b,input){
 object(input,['project_id','idempotency_key','row_version','brief']);const payload=validateBrief(input.brief);if(payload.project_id!==input.project_id)fail('FIELD_INVALID');
 return receipt(c,b,input.project_id,'brief',input,async()=>{
  const row=await project(c,b,input.project_id,true);version(row,input);if(row.revision>=3)fail('REVISION_LIMIT',409);const a=actor(c);
  if(!(await c.query('SELECT id FROM visual_brand_profiles WHERE business_id=$1 AND project_id=$2 AND id=$3',[b,input.project_id,payload.brand_profile_id])).rowCount)fail('NOT_FOUND',404);
  const out=(await c.query('INSERT INTO visual_briefs(business_id,project_id,brand_profile_id,campaign_id,revision,payload,input_hash,actor_kind,actor_member_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[b,input.project_id,payload.brand_profile_id,payload.campaign_id,row.revision+1,payload,digest(payload),a.kind,a.id])).rows[0];
  const cancelled=(await c.query("UPDATE visual_jobs SET state='cancelled',lease_token=NULL,lease_expires_at=NULL WHERE business_id=$1 AND project_id=$2 AND state IN('queued','running') RETURNING run_id",[b,input.project_id])).rows;
  if(cancelled.length)await c.query("UPDATE visual_runs SET status='cancelled',completed_at=now() WHERE business_id=$1 AND project_id=$2 AND id=ANY($3::uuid[])",[b,input.project_id,cancelled.map(job=>job.run_id)]);
  await c.query('UPDATE visual_public_outputs SET active=false WHERE business_id=$1 AND project_id=$2',[b,input.project_id]);
  await c.query("UPDATE visual_projects SET current_brief_id=$3,revision=$4,stage='RESEARCH',strategy_approved=false WHERE business_id=$1 AND project_id=$2",[b,input.project_id,out.id,out.revision]);return out;
 });
}
export async function run(c,b,p,stage,inputHash,parent=null){
 const row=await project(c,b,p),a=actor(c),count=Number((await c.query('SELECT count(*) FROM visual_runs WHERE business_id=$1 AND project_id=$2 AND revision=$3',[b,p,row.revision])).rows[0].count);if(count>=16)fail('RUN_LIMIT',409);
 const id=randomUUID(),agent=parent?STAGE_AGENT[stage]:'VIS-MKT-01',tools=getAgentRegistry().find(a=>a.id===agent).allowedTools;
 if(parent)checkDelegation(parent,{id,project_id:p,root_run_id:parent.root_run_id,agent_id:agent,allowed_tools:tools.filter(t=>parent.allowed_tools.includes(t))});
 return (await c.query('INSERT INTO visual_runs(id,business_id,project_id,revision,root_run_id,parent_run_id,delegation_depth,agent_id,stage,status,allowed_tools,input_hash,actor_kind,actor_member_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',[id,b,p,row.revision,parent?.root_run_id||id,parent?.id||null,parent?parent.delegation_depth+1:0,agent,stage,'running',JSON.stringify(parent?tools.filter(t=>parent.allowed_tools.includes(t)):tools),inputHash,a.kind,a.id])).rows[0];
}
async function artifact(c,b,p,runId,revision,kind,payload,inputHash){return (await c.query('INSERT INTO visual_artifacts(business_id,project_id,run_id,revision,kind,payload,input_hash,content_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[b,p,runId,revision,kind,payload,inputHash,digest(payload)])).rows[0];}
export async function commitStage(c,b,p,input,parent=null){
 const row=await project(c,b,p,true);version(row,input);const ctx=await context(c,b,p);
 if(input.input_hash!==ctx.brief.input_hash||row.stage!==input.stage)fail('STALE',409);
 if(row.stage==='CONCEPT'&&row.strategy_approval_required&&!row.strategy_approved)fail('STRATEGY_APPROVAL_REQUIRED',409);
 const output=validateStage(input.stage,input.output),root=parent||await run(c,b,p,input.stage,input.input_hash),child=await run(c,b,p,input.stage,input.input_hash,root);
 const out=await artifact(c,b,p,child.id,row.revision,input.stage,output,input.input_hash);let next=STAGES[STAGES.indexOf(input.stage)+1]||'QA';
 if(next==='QA'){
  const designer=await run(c,b,p,'GENERATION',input.input_hash,root);
  await artifact(c,b,p,designer.id,row.revision,'GENERATION',{status:'skipped_optional',deliverable:'copy_and_visual_prompt',pixels_generated:false},input.input_hash);
  await c.query("UPDATE visual_runs SET status='skipped_optional',completed_at=now() WHERE id=$1",[designer.id]);
  const outputs={...ctx.outputs,[input.stage]:output},bundle=await artifact(c,b,p,child.id,row.revision,'BUNDLE',{copy:outputs.COPY.text,visual_prompt:output.text,outputs},input.input_hash);
  const metadata=validateAsset({mime_type:'text/plain',object_key:'artifact:'+bundle.id,checksum:assetChecksum(bundle.payload)});
  await c.query('INSERT INTO visual_assets(business_id,project_id,artifact_id,metadata) VALUES($1,$2,$3,$4)',[b,p,bundle.id,metadata]);
 }
 await c.query("UPDATE visual_runs SET status='succeeded',completed_at=now() WHERE business_id=$1 AND project_id=$2 AND id=ANY($3::uuid[])",[b,p,[child.id,...(parent?[]:[root.id])]]);
 await c.query('UPDATE visual_projects SET stage=$3 WHERE business_id=$1 AND project_id=$2',[b,p,next]);return out;
}
export async function manual(c,b,p,input){
 object(input,['row_version','idempotency_key','stage','input_hash','output']);return receipt(c,b,p,'stage:'+p,input,async()=>{
  await project(c,b,p,true);if((await c.query("SELECT id FROM visual_jobs WHERE business_id=$1 AND project_id=$2 AND state IN('queued','running','submission_unknown')",[b,p])).rowCount)fail('JOB_ACTIVE',409);
  return artifactDto(await commitStage(c,b,p,input));
 });
}
export async function review(c,b,id,input){
 object(input,['row_version','idempotency_key','assessment']);const assessment=input.assessment===undefined?{}:input.assessment;object(assessment,CHECKS);for(const value of Object.values(assessment))if(typeof value!=='boolean')fail('ASSESSMENT_INVALID');const item=(await c.query("SELECT * FROM visual_artifacts WHERE business_id=$1 AND id=$2 AND kind='BUNDLE'",[b,id])).rows[0];if(!item)fail('NOT_FOUND',404);
 return receipt(c,b,item.project_id,'review:'+id,input,async()=>{
  const row=await project(c,b,item.project_id,true);version(row,input);if(item.revision!==row.revision||!['QA','HUMAN_REVIEW'].includes(row.stage))fail('STALE',409);
  const root=await run(c,b,item.project_id,'QA',item.input_hash),reviewer=await run(c,b,item.project_id,'QA',item.input_hash,root);
  let out;try{out=(await c.query('SELECT * FROM zuri_go.visual_record_review($1::uuid,$2::uuid,$3::uuid,$4::jsonb)',[b,item.project_id,id,assessment])).rows[0];}catch(error){approvalBoundaryError(error);}
  await artifact(c,b,item.project_id,reviewer.id,row.revision,'QA',out.result,item.input_hash);
  await c.query("UPDATE visual_runs SET status='succeeded',completed_at=now() WHERE id=ANY($1::uuid[])",[[root.id,reviewer.id]]);
  await c.query('UPDATE visual_projects SET stage=$3 WHERE business_id=$1 AND project_id=$2',[b,item.project_id,out.result.status==='pass'?'HUMAN_REVIEW':'QA']);return out;
 });
}
export async function approve(c,b,id,input){
 object(input,['row_version','idempotency_key','artifact_hash','qa_revision','decision','reason']);if(!['approve','request_changes','reject'].includes(input.decision)||input.reason!=null&&(typeof input.reason!=='string'||input.reason.length>4000)||input.decision!=='approve'&&!input.reason?.trim())fail('FIELD_INVALID');
 const item=(await c.query("SELECT * FROM visual_artifacts WHERE business_id=$1 AND id=$2 AND kind='BUNDLE'",[b,id])).rows[0];if(!item)fail('NOT_FOUND',404);
 return receipt(c,b,item.project_id,'approve:'+id,input,async()=>{
  const row=await project(c,b,item.project_id,true);owner(c,row);version(row,input);
  if(item.revision!==row.revision||item.canonical_hash!==input.artifact_hash)fail('STALE',409);
  try{return (await c.query('SELECT * FROM zuri_go.visual_finalize_approval($1::uuid,$2::uuid,$3::uuid,$4::bigint,$5::text,$6::uuid,$7::text,$8::text)',[b,item.project_id,id,input.row_version,input.artifact_hash,input.qa_revision,input.decision,input.reason||null])).rows[0];}catch(error){approvalBoundaryError(error);}
 });
}
export async function publish(c,b,p,input){
 object(input,['row_version','idempotency_key','artifact_id']);if(!uuid(input.artifact_id))fail('FIELD_INVALID');
 return receipt(c,b,p,'publish:'+p,input,async()=>{
  const row=await project(c,b,p,true);version(row,input);actor(c);
  let output;try{output=(await c.query('SELECT * FROM zuri_go.visual_publish_approved($1::uuid,$2::uuid,$3::uuid)',[b,p,input.artifact_id])).rows[0];}
  catch(error){if(error?.code==='42501')fail('PUBLICATION_DENIED',403);throw error;}
  await audit(c,b,'visual_public_outputs',output.artifact_id,null,{project_id:p,artifact_id:output.artifact_id,decision_id:output.decision_id,active:output.active,trusted_publication:output.trusted_publication},'publish');
  return output;
 });
}
export async function strategy(c,b,p,input){
 object(input,['row_version','idempotency_key','input_hash','decision','reason']);if(input.decision!=='approve')fail('FIELD_INVALID');
 return receipt(c,b,p,'strategy:'+p,input,async()=>{const row=await project(c,b,p,true);owner(c,row);version(row,input);const ctx=await context(c,b,p);if(row.stage!=='CONCEPT'||ctx.brief.input_hash!==input.input_hash)fail('STALE',409);
  const root=await run(c,b,p,'STRATEGY_APPROVAL',input.input_hash);await artifact(c,b,p,root.id,row.revision,'STRATEGY_APPROVAL',{decision:'approve',actor:actor(c)},input.input_hash);await c.query("UPDATE visual_runs SET status='succeeded',completed_at=now() WHERE id=$1",[root.id]);
  return (await c.query('UPDATE visual_projects SET strategy_approved=true WHERE business_id=$1 AND project_id=$2 RETURNING *',[b,p])).rows[0];});
}
