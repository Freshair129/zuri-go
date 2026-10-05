// @trace implements FR-014-002, FR-014-009, FR-014-010, FR-014-012, FR-014-013
import {fail,uuid,assetText} from './contracts.mjs';
import {getAgentRegistry} from './registry.mjs';
import {localProvider} from './providers.mjs';
import {actor,initialize,brand,brief,detail,manual,review,approve,strategy,publish} from './service.mjs';
import {enqueue,jobAction} from './jobs.mjs';
export async function visualApi(c,b,path,method,input,params=new URLSearchParams()){
 const ready=(await c.query(`SELECT
  to_regclass('zuri_go.visual_projects') IS NOT NULL
  AND EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('zuri_go.visual_artifacts') AND attname='canonical_hash' AND NOT attisdropped)
  AND has_function_privilege(current_user,to_regprocedure('zuri_go.visual_record_review(uuid,uuid,uuid,jsonb)'),'EXECUTE')
  AND has_function_privilege(current_user,to_regprocedure('zuri_go.visual_finalize_approval(uuid,uuid,uuid,bigint,text,uuid,text,text)'),'EXECUTE')
  AND has_function_privilege(current_user,to_regprocedure('zuri_go.visual_publish_approved(uuid,uuid,uuid)'),'EXECUTE') AS ready`)).rows[0].ready;
 if(!ready)fail('FEATURE_UNAVAILABLE',503,'Visual Studio ต้องใช้ schema 11 โดย operator เป็นผู้ติดตั้ง');
 if(method==='DELETE')fail('Visual approval and history records are retained',409,'รายการอนุมัติและประวัติ Visual เก็บไว้ถาวร');
 if(method!=='GET')actor(c);
 const parts=path.split('/').filter(Boolean),[resource,id,action]=parts;if(parts.length>3||id&&!uuid(id))fail('NOT_FOUND',404);
 if(resource==='team'&&method==='GET'&&!id){let available=false;try{available=c.zuriViewer.kind==='operator'&&process.env.VERCEL!=='1'&&!!localProvider();}catch{/* Invalid optional configuration must not block manual work. */}return {agents:getAgentRegistry(),local_model_available:available,image_generation_available:false};}
 if(resource==='projects'&&method==='POST'&&!id)return initialize(c,b,input);
 if(resource==='brand-profiles'&&method==='POST'&&!id)return brand(c,b,input);
 if(resource==='briefs'&&method==='POST'&&!id)return brief(c,b,input);
 if(resource==='projects'&&method==='GET'&&!id){
  const limit=Math.min(50,Math.max(1,Number(params.get('limit'))||20)),cursor=params.get('cursor');if(cursor&&!uuid(cursor))fail('FIELD_INVALID');
  const rows=(await c.query(`SELECT v.project_id,v.stage,v.revision,v.row_version,p.name,p.owner_member_id,p.visibility,m.display_name AS owner_name,campaign.name AS campaign_name,
   brief.payload->>'objective' AS objective,brief.payload->>'channel' AS channel,brief.payload->>'due_date' AS due_date,
   (SELECT payload->>'text' FROM visual_artifacts a WHERE a.business_id=v.business_id AND a.project_id=v.project_id AND a.revision=v.revision ORDER BY created_at DESC LIMIT 1) AS preview
   FROM visual_projects v JOIN projects p ON p.business_id=v.business_id AND p.id=v.project_id
   LEFT JOIN members m ON m.business_id=p.business_id AND m.id=p.owner_member_id
   LEFT JOIN visual_briefs brief ON brief.business_id=v.business_id AND brief.id=v.current_brief_id
   LEFT JOIN campaigns campaign ON campaign.business_id=brief.business_id AND campaign.id=brief.campaign_id
   WHERE v.business_id=$1 AND ($2::uuid IS NULL OR v.project_id>$2) ORDER BY v.project_id LIMIT $3`,[b,cursor,limit+1])).rows;
  const outputs=(await c.query('SELECT project_id,artifact_id,payload FROM visual_public_outputs WHERE business_id=$1 AND active AND ($2::uuid IS NULL OR project_id>$2) ORDER BY project_id LIMIT $3',[b,cursor,limit])).rows;
  return {projects:rows.slice(0,limit),next_cursor:rows.length>limit?rows[limit-1].project_id:null,public_outputs:outputs};
 }
 if(resource==='projects'&&method==='GET'&&id&&!action)return detail(c,b,id);
 if(resource==='projects'&&method==='POST'&&id){if(action==='stages')return manual(c,b,id,input);if(action==='strategy-decision')return strategy(c,b,id,input);if(action==='run')return enqueue(c,b,id,input);if(action==='publish')return publish(c,b,id,input);}
 if(resource==='artifacts'&&method==='POST'&&id){if(action==='review')return review(c,b,id,input);if(action==='approve')return approve(c,b,id,input);if(action==='variants')fail('FEATURE_UNAVAILABLE',409);}
 if(resource==='jobs'&&method==='POST'&&id&&['cancel','retry'].includes(action))return jobAction(c,b,id,action,input);
 if(method==='GET'&&id){
  const table={briefs:'visual_briefs',runs:'visual_runs',jobs:'visual_jobs',assets:'visual_assets'}[resource];if(!table)fail('NOT_FOUND',404);
  const row=(await c.query(`SELECT * FROM ${table} WHERE business_id=$1 AND id=$2`,[b,id])).rows[0];if(!row)fail('NOT_FOUND',404);
  if(resource==='jobs'){const {grant_data,lease_token,lease_expires_at,...safe}=row;return {...safe,retry_after_ms:1500};}
  if(resource==='assets'&&action==='download'){const item=(await c.query('SELECT payload FROM visual_artifacts WHERE business_id=$1 AND project_id=$2 AND id=$3',[b,row.project_id,row.artifact_id])).rows[0];if(!item)fail('NOT_FOUND',404);return {filename:'visual-prompt.txt',mime_type:'text/plain',text:assetText(item.payload)};}
  if(action)fail('NOT_FOUND',404);return row;
 }
 fail('NOT_FOUND',404);
}
