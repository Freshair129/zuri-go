// ADR-008 delete routes dispatch only to reversible lifecycle changes; history and references remain.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {config} from '../config.mjs';
import {pool,transaction} from '../db.mjs';
import {OPERATOR,session} from '../viewer.mjs';
import {authorizeWrite} from '../member-auth.mjs';
import {passwordHash} from '../team-auth.mjs';
import {handleApi,sendError} from '../api.mjs';
import {save} from '../service.mjs';
import {createTask} from '../tasks.mjs';
import {createProject} from '../projects.mjs';
import {saveTeam} from '../teams.mjs';
import {attachmentAction} from '../attachments.mjs';

const admin=new pg.Client({connectionString:config().adminUrl});await admin.connect();await admin.query('SET search_path TO zuri_go,public');
after(async()=>{await admin.end();await pool.end();});
const b=randomUUID(),run=fn=>transaction(b,OPERATOR,fn);
await run(c=>c.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[b,'QA ONLY · DELETE lifecycle',b]));
const actor=await run(c=>save(c,b,'members',{display_name:'Lifecycle actor'}));
const retired=await run(c=>save(c,b,'members',{display_name:'Lifecycle retired Member'}));
for(const member of [actor,retired])await admin.query('INSERT INTO zuri_go.member_credentials(business_id,member_id,password_hash) VALUES($1,$2,$3)',[b,member.id,await passwordHash(randomUUID())]);
const principal=session({m:actor.id,cv:1});
async function request(method,path,input=null,who=principal){
 const response={};const res={setHeader(){},writeHead(status){response.status=status;},end(value){response.body=value?JSON.parse(value):null;}};
 try{await handleApi({method,headers:{'x-zuri-go':'1','content-type':'application/json'},body:input},res,new URL('http://127.0.0.1/api/zuri-go/v1/businesses/'+b+'/'+path),{businessId:b,storage:'qa',principal:who,requireMember:true});}
 catch(error){sendError(res,error);}
 return response;
}
async function row(sql,params){return (await admin.query(sql,[b,...params])).rows[0];}

test('active Member DELETE routes preserve every supported lifecycle and deny Guest mutation',async()=>{
 const campaign=await run(c=>save(c,b,'campaigns',{name:'Campaign lifecycle',objective:'awareness',owner_member_id:retired.id}));
 const channel=await run(c=>save(c,b,'channels',{display_name:'Lifecycle channel',platform:'other'}));
 const content=await run(c=>save(c,b,'content',{title:'Content lifecycle',planning_month:'2026-10-01',campaign_id:campaign.id}));
 const contentForPublication=await run(c=>save(c,b,'content',{title:'Publication lifecycle',planning_month:'2026-10-01',campaign_id:campaign.id}));
 const draftPublication=await run(c=>save(c,b,'publications',{content_item_id:contentForPublication.id,channel_account_id:channel.id,idempotency_key:randomUUID(),status:'draft'}));
 const published=await run(c=>save(c,b,'publications',{content_item_id:contentForPublication.id,channel_account_id:channel.id,idempotency_key:randomUUID(),status:'published',published_at:new Date(Date.now()-1000).toISOString(),confirmation_note:'QA lifecycle evidence'}));
 const series=(await row("SELECT id FROM metric_series WHERE business_id=$1 AND metric_code='followers_total' AND channel_account_id=$2",[channel.id]));
 const goal=await run(c=>save(c,b,'goals',{name:'Goal lifecycle',metric_code:'followers_total',period_kind:'weekly',period_start:'2026-10-05',period_end_exclusive:'2026-10-12',target_value:10,series_ids:[series.id]}));
 const team=await run(c=>saveTeam(c,b,c.zuriViewer,{name:'Team lifecycle',memberIds:[actor.id]}));
 const project=await run(c=>createProject(c,b,{name:'Project lifecycle',owner_member_id:actor.id}));
 const task=await run(c=>createTask(c,b,{title:'Task lifecycle',idempotency_key:randomUUID()},c.zuriViewer));
 await admin.query('BEGIN');await admin.query("SELECT set_config('zuri_go.business_id',$1,true)",[b]);
 const meeting=(await admin.query("INSERT INTO zuri_go.meetings(business_id,title,source_instance_id,source_project_id,source_recording_id,legacy_metadata) VALUES($1,'Meeting lifecycle',$2,$3,$4,'{}') RETURNING id",[b,randomUUID(),randomUUID(),randomUUID()])).rows[0];
 const weekly=(await admin.query("INSERT INTO zuri_go.weekly_plans(business_id,week_start) VALUES($1,'2026-10-05') RETURNING id",[b])).rows[0];
 const revision=(await admin.query("INSERT INTO zuri_go.meeting_revisions(business_id,meeting_id,kind,content_hash,segments,captured_at) VALUES($1,$2,'source','qa-hash','[]',now()) RETURNING id",[b,meeting.id])).rows[0];
 const attachment=await attachmentAction({query:(...args)=>admin.query(...args),zuriViewer:{kind:'member',memberId:actor.id}},b,task.id,null,'POST',{filename:'lifecycle.txt',base64:'YQ=='});
 await admin.query('INSERT INTO zuri_go.weekly_plan_tasks(business_id,weekly_plan_id,task_id,priority) VALUES($1,$2,$3,$4)',[b,weekly.id,task.id,'should']);await admin.query('COMMIT');

 const guestDelete=await request('DELETE',`campaigns/${campaign.id}`,null,null);assert.equal(guestDelete.status,401);
 assert.equal((await row('SELECT archived_at FROM campaigns WHERE business_id=$1 AND id=$2',[campaign.id])).archived_at,null,'Guest denial leaves the row unchanged');
 for(const [resource,item,field,value] of [
  ['campaigns',campaign,'archived_at',true],['content',content,'archived_at',true],['channels',channel,'status','inactive'],
  ['goals',goal,'status','archived'],['publications',draftPublication,'status','cancelled'],['metric-series',series,'status','inactive'],['members',retired,'status','inactive']
 ]){
  const response=await request('DELETE',`${resource}/${item.id}`);assert.equal(response.status,200,`${resource}: ${JSON.stringify(response.body)}`);
  const stored=await row(`SELECT ${field} FROM ${resource==='channels'?'channel_accounts':resource==='content'?'content_items':resource==='metric-series'?'metric_series':resource} WHERE business_id=$1 AND id=$2`,[item.id]);
  if(value===true)assert.ok(stored[field],resource+' uses archive timestamp');else assert.equal(stored[field],value,resource+' uses existing lifecycle state');
 }
 assert.equal((await request('DELETE',`publications/${published.id}`)).status,409,'published external history cannot be deleted');
 assert.equal((await row('SELECT status FROM publications WHERE business_id=$1 AND id=$2',[published.id])).status,'published');
 for(const [resource,id] of [['teams',team.id],['projects',project.id],['tasks',task.id],['meetings',meeting.id],['weekly-plans',weekly.id]])assert.equal((await request('DELETE',`${resource}/${id}`)).status,200,resource+' DELETE route');
 assert.ok((await row('SELECT archived_at FROM teams WHERE business_id=$1 AND id=$2',[team.id])).archived_at);
 assert.equal((await row('SELECT status FROM projects WHERE business_id=$1 AND id=$2',[project.id])).status,'archived');
 assert.ok((await row('SELECT archived_at FROM tasks WHERE business_id=$1 AND id=$2',[task.id])).archived_at);
 assert.ok((await row('SELECT archived_at FROM meetings WHERE business_id=$1 AND id=$2',[meeting.id])).archived_at);
 assert.ok((await row('SELECT archived_at FROM weekly_plans WHERE business_id=$1 AND id=$2',[weekly.id])).archived_at);
 assert.equal((await row('SELECT id FROM meeting_revisions WHERE business_id=$1 AND id=$2',[revision.id])).id,revision.id,'meeting history remains after archive');
 assert.equal((await row('SELECT task_id FROM weekly_plan_tasks WHERE business_id=$1 AND weekly_plan_id=$2',[weekly.id])).task_id,task.id,'weekly-plan association remains after archive');
 assert.equal((await row('SELECT deleted_at FROM task_attachments WHERE business_id=$1 AND id=$2',[attachment.id])).deleted_at,null,'task archive does not hard-delete its attachment history');
 assert.equal((await request('DELETE',`tasks/${task.id}/attachments/${attachment.id}`)).status,200,'attachment route keeps its soft-delete lifecycle');
 assert.ok((await row('SELECT deleted_at FROM task_attachments WHERE business_id=$1 AND id=$2',[attachment.id])).deleted_at);
 assert.equal((await request('DELETE',`observations/${randomUUID()}`)).status,409,'immutable observation family has no DELETE lifecycle');
 assert.equal((await request('DELETE',`change-events/${randomUUID()}`)).status,409,'append-only audit family has no DELETE lifecycle');
 assert.equal((await request('DELETE',`visual-marketing/artifacts/${randomUUID()}`)).status,409,'immutable Visual history explicitly rejects DELETE');
});
