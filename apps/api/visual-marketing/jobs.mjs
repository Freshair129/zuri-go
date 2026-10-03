// @trace implements FR-014-005, FR-014-006, NFR-014-001
import {randomUUID} from 'node:crypto';
import {fail,object,STAGES} from './contracts.mjs';
import {actor,project,version,context,receipt,run,commitStage} from './service.mjs';
import {localProvider,executeProvider} from './providers.mjs';
import {transaction} from '../db.mjs';
import {OPERATOR} from '../viewer.mjs';
export async function enqueue(c,b,p,input){
 object(input,['row_version','idempotency_key','input_hash','authorize_local_model']);
 if(process.env.VERCEL==='1'||actor(c).kind!=='operator')fail('EXECUTOR_UNAVAILABLE',503);
 if(input.authorize_local_model!==true)fail('PROVIDER_DENIED',403);
 if(!localProvider())fail('PROVIDER_UNAVAILABLE',503);
 return receipt(c,b,p,'enqueue:'+p,input,async()=>{
  const row=await project(c,b,p,true);version(row,input);const ctx=await context(c,b,p);
  if(!STAGES.includes(row.stage)||ctx.brief.input_hash!==input.input_hash)fail('STALE',409);
  if(row.stage==='CONCEPT'&&row.strategy_approval_required&&!row.strategy_approved)fail('STRATEGY_APPROVAL_REQUIRED',409);
  if((await c.query("SELECT id FROM visual_jobs WHERE business_id=$1 AND project_id=$2 AND state IN('queued','running','submission_unknown')",[b,p])).rowCount)fail('JOB_ACTIVE',409);
  const root=await run(c,b,p,row.stage,input.input_hash),grant={providers:['local_ollama'],actor_kind:'operator',input_hash:input.input_hash,expires_at:new Date(Date.now()+600000).toISOString()};
  const job=(await c.query('INSERT INTO visual_jobs(business_id,project_id,run_id,revision,input_hash,stage,grant_data) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[b,p,root.id,row.revision,input.input_hash,row.stage,grant])).rows[0];
  return {job_id:job.id,run_id:root.id,status:'queued',status_url:`/api/zuri-go/v1/businesses/${b}/visual-marketing/jobs/${job.id}`};
 });
}
export async function jobAction(c,b,id,action,input){
 object(input,['row_version','idempotency_key',...(action==='retry'?['authorize_local_model']:[])]);actor(c);
 const job=(await c.query('SELECT * FROM visual_jobs WHERE business_id=$1 AND id=$2',[b,id])).rows[0];if(!job)fail('NOT_FOUND',404);
 return receipt(c,b,job.project_id,action+':'+id,input,async()=>{
  const row=await project(c,b,job.project_id,true);const current=(await c.query('SELECT * FROM visual_jobs WHERE business_id=$1 AND id=$2 FOR UPDATE',[b,id])).rows[0];version(current,input);
  if(action==='retry'){
   if(!['failed','cancelled'].includes(current.state)||current.revision!==row.revision||current.stage!==row.stage)fail('RETRY_DENIED',409);
   return enqueue(c,b,job.project_id,{row_version:row.row_version,idempotency_key:input.idempotency_key,input_hash:current.input_hash,authorize_local_model:input.authorize_local_model});
  }
  if(!['queued','running'].includes(current.state))fail('JOB_TERMINAL',409);
  await c.query("UPDATE visual_runs SET status='cancelled',completed_at=now() WHERE id=$1",[current.run_id]);
  return (await c.query("UPDATE visual_jobs SET state='cancelled',lease_token=NULL,lease_expires_at=NULL WHERE id=$1 RETURNING id,state,row_version",[id])).rows[0];
 });
}
// One project lock ordering for enqueue/cancel/claim/commit; a stale lease cannot publish output.
export async function claim(c,b){
 const next=(await c.query("SELECT project_id FROM visual_jobs WHERE business_id=$1 AND (state='queued' OR state='running' AND lease_expires_at<now()) ORDER BY created_at LIMIT 1",[b])).rows[0];if(!next)return null;
 await project(c,b,next.project_id,true);
 const job=(await c.query("SELECT * FROM visual_jobs WHERE business_id=$1 AND project_id=$2 AND (state='queued' OR state='running' AND lease_expires_at<now()) FOR UPDATE SKIP LOCKED",[b,next.project_id])).rows[0];if(!job)return null;
 const ctx=await context(c,b,job.project_id);
 if(job.attempt>=2||job.revision!==ctx.row.revision||job.input_hash!==ctx.brief.input_hash||Date.parse(job.grant_data.expires_at)<=Date.now()||job.grant_data.actor_kind!=='operator'){
  await c.query("UPDATE visual_jobs SET state='failed',error_class='STALE_OR_LIMIT',lease_token=NULL,lease_expires_at=NULL WHERE id=$1",[job.id]);
  await c.query("UPDATE visual_runs SET status='failed',completed_at=now() WHERE id=$1",[job.run_id]);return null;
 }
 const token=randomUUID();await c.query("UPDATE visual_jobs SET state='running',attempt=attempt+1,lease_token=$2,lease_expires_at=now()+interval '60 seconds' WHERE id=$1",[job.id,token]);
 return {...job,attempt:job.attempt+1,lease_token:token,request:{stage:job.stage,brief:ctx.brief.payload,brand:ctx.brand.profile,previous:ctx.outputs}};
}
export async function finish(c,b,job,result,error=null){
 const row=await project(c,b,job.project_id,true),current=(await c.query('SELECT * FROM visual_jobs WHERE business_id=$1 AND id=$2 FOR UPDATE',[b,job.id])).rows[0];
 if(!current||current.state!=='running'||current.lease_token!==job.lease_token||Date.parse(current.lease_expires_at)<=Date.now()||row.revision!==job.revision)return false;
 const ctx=await context(c,b,job.project_id);if(ctx.brief.input_hash!==job.input_hash)return false;
 const safeErrors=['TIMEOUT','UNAVAILABLE','DENIED','CANCELLED','GRANT_EXPIRED','PROVIDER_OUTPUT_INVALID','FIELD_UNKNOWN','FIELD_INVALID','OUTPUT_REQUIRED'];
 if(Date.parse(current.grant_data.expires_at)<=Date.now())error={code:'GRANT_EXPIRED'};
 const code=error?(safeErrors.includes(error.code)?error.code:'PROVIDER_FAILED'):null;
 await c.query('INSERT INTO visual_provider_runs(business_id,project_id,job_id,provider,model,attempt,status,usage,estimated_cost,error_class) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[b,job.project_id,job.id,'local_ollama',result?.model||null,job.attempt,error?'failed':'succeeded',result?.usage||null,result?.estimatedCost||null,code]);
 if(error){await c.query("UPDATE visual_jobs SET state='failed',error_class=$2,lease_token=NULL,lease_expires_at=NULL WHERE id=$1",[job.id,code]);await c.query("UPDATE visual_runs SET status='failed',completed_at=now() WHERE id=$1",[job.run_id]);return true;}
 const parent=(await c.query('SELECT * FROM visual_runs WHERE id=$1',[job.run_id])).rows[0];
 await commitStage(c,b,job.project_id,{row_version:row.row_version,input_hash:job.input_hash,stage:job.stage,output:result.output},parent);
 const after=await project(c,b,job.project_id),done=!STAGES.includes(after.stage)||after.stage==='CONCEPT'&&after.strategy_approval_required&&!after.strategy_approved;
 await c.query('UPDATE visual_jobs SET state=$2,stage=$3,attempt=0,lease_token=NULL,lease_expires_at=NULL WHERE id=$1',[job.id,done?'succeeded':'queued',after.stage]);
 if(done)await c.query("UPDATE visual_runs SET status='succeeded',completed_at=now() WHERE id=$1",[job.run_id]);return true;
}
export function startWorker(b){
 const controller=new AbortController();let timer,working=false,pending=Promise.resolve();
 async function tick(){if(working||controller.signal.aborted)return;working=true;try{
  const available=await transaction(b,OPERATOR,async c=>(await c.query("SELECT to_regclass('zuri_go.visual_jobs') AS name")).rows[0].name);if(!available)return;
  const job=await transaction(b,OPERATOR,c=>claim(c,b));if(!job)return;
  let result,error;try{const adapter=localProvider();if(!adapter)fail('PROVIDER_UNAVAILABLE',503);result=await executeProvider(job.request,{primaryModel:'local_ollama',maxRetries:0,timeoutMs:25000},job.grant_data,controller.signal,{local_ollama:adapter});}catch(e){error=e;}
  await transaction(b,OPERATOR,c=>finish(c,b,job,result,error));
 }catch(e){console.error('Visual worker failed',e.code||e.name);}finally{working=false;if(!controller.signal.aborted)timer=setTimeout(()=>{pending=tick();},1500);}}
 timer=setTimeout(()=>{pending=tick();},1500);
 return async()=>{controller.abort();clearTimeout(timer);await pending;};
}
