// Trusted operator CLI: the reviewed Workboard backfill (FR-010-016, PLAN-002 WI-10). Never packaged for Vercel.
// Dry run (default): read-only transaction, counts and the field mapping, writes nothing.
// Run: writes campaign_task_details, owner_label, the Done marker and empty mapped columns of existing campaign-legacy rows;
// it never creates, deletes or renumbers a task, and never touches legacy_metadata or stored snapshots.
// @trace implements FR-010-016
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {config} from './config.mjs';
import {workboardFields} from './campaign-tasks.mjs';
import {WORKBOARD_STATUSES} from '../web/src/content/shared/task-rules.mjs';

const COUNTED=['tasks','task_roles','weekly_plan_tasks','task_attachments','change_events','campaign_states','members'];
const MAPPED_COLUMNS=['dependency_note','acceptance','evidence','recheck_date'];
const DATE=/^\d{4}-\d{2}-\d{2}$/;

export async function counts(c,b){
  const out={};for(const t of COUNTED)out[t]=(await c.query(`SELECT count(*)::int n FROM ${t} WHERE business_id=$1`,[b])).rows[0].n;
  return out;
}
// Per campaign and Workboard status, as the Workboard shows them today (AC-010-016-01, -03).
function tally(rows){
  const t={};for(const r of rows){const k=r.campaign_code||r.campaign_id;t[k]??={};const s=r.legacy_metadata?.status||'?';t[k][s]=(t[k][s]||0)+1;}return t;
}
export async function backfillWorkboard(c,b,{dryRun=true,schema}){
  const hasDetails=schema>=7;
  const rows=(await c.query(`SELECT t.*,cp.code AS campaign_code FROM tasks t LEFT JOIN campaigns cp ON cp.business_id=t.business_id AND cp.id=t.campaign_id WHERE t.business_id=$1 AND t.source_kind='campaign-legacy' ORDER BY cp.code,t.code`,[b])).rows;
  const details=hasDetails?new Map((await c.query('SELECT task_id FROM campaign_task_details WHERE business_id=$1',[b])).rows.map(r=>[r.task_id,true])):new Map();
  const memberNames=new Set((await c.query('SELECT display_name FROM members WHERE business_id=$1',[b])).rows.map(r=>r.display_name));
  const fields=['title','description','status','owner','due','priority','offer','gate','hypothesis','action','dependencies','estimate','acceptance','evidence','recheck','outcome'];
  const mapping=Object.fromEntries(fields.map(f=>[f,{present:0}])),anomalies=[],plan=[];
  for(const r of rows){
    const w=r.legacy_metadata||{},{task,details:d}=workboardFields(w);
    for(const f of fields)if(w[f]!=null&&w[f]!=='')mapping[f].present++;
    const issue=m=>anomalies.push({code:r.code,issue:m});
    if(!w.id)issue('no Workboard id in legacy_metadata');
    if(!WORKBOARD_STATUSES.includes(w.status))issue(`unknown Workboard status (${w.status??'none'}) → planned, no badge`);
    if(w.priority&&!['Low','Medium','High'].includes(w.priority))issue('priority outside Low/Medium/High → not stored');
    if(w.estimate!=null&&w.estimate!==''&&!Number.isFinite(Number(w.estimate)))issue('estimate is not a number');
    for(const k of ['due','recheck'])if(w[k]&&!DATE.test(w[k]))issue(`${k} is not a date`);
    if(task.status!==r.status)issue(`record status ${r.status} differs from Workboard ${w.status} (record kept)`);
    if(w.owner&&memberNames.has(w.owner.trim()))issue('owner text equals a Member name; kept as a label, not bound (FR-010-008)');
    if(details.has(r.id)){plan.push({code:r.code,action:'skip: has details'});continue;}
    const set={};
    if(r.owner_label==null&&task.owner_label)set.owner_label=task.owner_label;
    for(const k of MAPPED_COLUMNS)if(r[k]==null&&task[k]!=null&&(k!=='recheck_date'||DATE.test(task[k])))set[k]=task[k];
    if(r.status==='done'&&w.status==='Done'&&r.completion_rule!=='workboard')set.completion_rule='workboard';
    plan.push({code:r.code,action:'write details',columns:Object.keys(set)});
    if(!dryRun){
      const keys=Object.keys(set);
      if(keys.length)await c.query(`UPDATE tasks SET ${keys.map((k,i)=>`${k}=$${i+3}`).join(',')} WHERE business_id=$1 AND id=$2`,[b,r.id,...Object.values(set)]);
      const dk=Object.keys(d),dv=Object.values(d).map((v,i)=>dk[i]==='estimate'&&!Number.isFinite(v)?null:v);
      await c.query(`INSERT INTO campaign_task_details(business_id,task_id,${dk.join(',')}) VALUES($1,$2,${dk.map((_,i)=>'$'+(i+3)).join(',')}) ON CONFLICT(business_id,task_id) DO NOTHING`,[b,r.id,...dv]);
    }
  }
  return {workboardTasks:rows.length,campaigns:new Set(rows.map(r=>r.campaign_id)).size,perCampaignAndStatus:tally(rows),alreadyDetailed:plan.filter(p=>p.action.startsWith('skip')).length,toWrite:plan.filter(p=>p.action==='write details').length,fieldMapping:mapping,mappingTargets:{title:'tasks.title (kept)',description:'tasks.description (kept)',status:'tasks.status (kept) + details.original_status',owner:'tasks.owner_label',due:'tasks.due_date (kept)',priority:'details.priority',offer:'details.offer',gate:'details.gate',hypothesis:'details.hypothesis',action:'details.action',dependencies:'tasks.dependency_note',estimate:'details.estimate',acceptance:'tasks.acceptance',evidence:'tasks.evidence',recheck:'tasks.recheck_date',outcome:'details.outcome','Done':"tasks.completion_rule='workboard'",'*':'legacy_metadata unchanged'},anomalies,plan};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),cloud=args.includes('--cloud'),run=args.includes('--run');
  if(run&&cloud&&!args.includes('--production-authorized'))throw Error('A production backfill needs the owner’s specific authorization (--production-authorized) and a backup first (FR-010-016 AC-06).');
  const cfg=cloud?JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../../.local/cloud-config.json',import.meta.url),'utf8')):config();
  const business=args.includes('--business')?args[args.indexOf('--business')+1]:cfg.businessId;
  const c=new pg.Client({connectionString:cfg.adminUrl});await c.connect();
  let report;
  try{
    const schema=(await c.query('SELECT max(version) v FROM public.zuri_go_migrations')).rows[0].v;
    if(run&&schema<7)throw Error(`Schema ${schema}: the backfill needs schema 7 (migration 007) first.`);
    await c.query(run?'BEGIN':'BEGIN READ ONLY');await c.query('SET LOCAL search_path TO zuri_go,public');
    await c.query("SELECT set_config('zuri_go.business_id',$1,true),set_config('zuri_go.viewer_kind','operator',true)",[business]);
    const before=await counts(c,business);
    report={environment:cloud?'production':'local',schema,dryRun:!run,...await backfillWorkboard(c,business,{dryRun:!run,schema}),countsBefore:before};
    if(run){
      await c.query("INSERT INTO change_events(business_id,entity_type,entity_id,event_type,after_data,actor_kind,actor_subject,request_id) VALUES($1,'workspace',$1,'workboard_backfill',$2,'local_operator','backfill-workboard',$3)",[business,{written:report.toWrite,skipped:report.alreadyDetailed},randomUUID()]);
      const after=await counts(c,business),expected={...before,change_events:before.change_events+1};
      report.countsAfter=after;report.reconciled=JSON.stringify(after)===JSON.stringify(expected);
      if(!report.reconciled)throw Object.assign(Error('Counts differ after the backfill; rolled back.'),{report});
      await c.query('COMMIT');
    }else await c.query('ROLLBACK');
  }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{await c.end();}
  // The full report (task codes, no titles or text) stays private under .local/.
  const dir=new URL('../../.local/backfill/',import.meta.url);await mkdir(dir,{recursive:true});
  const file=new URL(`${report.environment}-${report.dryRun?'dry-run':'run'}-${new Date().toISOString().replace(/[:.]/g,'-')}.json`,dir);
  await writeFile(file,JSON.stringify(report,null,2),{mode:0o600});
  console.log(JSON.stringify({environment:report.environment,schema:report.schema,dryRun:report.dryRun,workboardTasks:report.workboardTasks,campaigns:report.campaigns,perCampaignAndStatus:report.perCampaignAndStatus,alreadyDetailed:report.alreadyDetailed,toWrite:report.toWrite,anomalies:report.anomalies.length,countsBefore:report.countsBefore,...(report.countsAfter?{countsAfter:report.countsAfter,reconciled:report.reconciled}:{}),privateReport:fileURLToPath(file)},null,1));
}
