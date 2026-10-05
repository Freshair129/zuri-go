import {authorizeWrite} from './member-auth.mjs';
import {attachmentAction,sendAttachment} from './attachments.mjs';
import {body} from './http.mjs';
import {transaction} from './db.mjs';
import {snapshot,save,observe,brief,fail,audit,archiveRecord} from './service.mjs';
import {overview} from '../web/src/content/business/model.mjs';
import {importPreview,importCommit,readLegacy,saveLegacy,uploadTranscript} from './workspace.mjs';
import {listTeams,saveTeam,archiveTeam} from './teams.mjs';
import {listTasks,readTask,createTask,updateTask,archiveTask} from './tasks.mjs';
import {listProjects,readProject,createProject,updateProject,archiveProject} from './projects.mjs';
import {archiveMeeting,archiveWeeklyPlan} from './workspace.mjs';
import {saveCampaignTask} from './campaign-tasks.mjs';
import {commitMeeting} from './meeting-commit.mjs';
import {visualApi} from './visual-marketing/api.mjs';
import {readPreviewRequest,readMarketingReportSource,previewMarketingReport} from './marketing-report.mjs';
import {readLedgerRequest,prepareMarketingReport,freezeMarketingReport,readMarketingReport,ledgerRetry} from './marketing-report-ledger.mjs';
export function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
export function sendError(res,e){const status=e.status||(['23502','23503','23505','23514','22P02','22007','22008'].includes(e.code)?422:e.code==='40001'?409:e.code==='ENOENT'?404:500);send(res,status,{error:e.status?e.message:status===422?'ข้อมูลขัดกับข้อกำหนดหรือรายการที่อ้างอิง กรุณาตรวจอีกครั้ง':status===409?'ข้อมูลถูกแก้จากอีกหน้าต่าง กรุณาโหลดใหม่':status===404?'ไม่พบรายการ':'บันทึกไม่สำเร็จ กรุณาลองใหม่',code:e.code||null});if(status===500)console.error('Request failed',e.code||e.name);}
// principal: OPERATOR on the local server, session(claims) on the hosted API; nothing else selects the viewer (FR-011-003).
export async function handleApi(req,res,url,{businessId,storage,principal=null,requireMember=false}){
   const route=url.pathname.slice('/api/zuri-go/v1'.length),method=req.method;
   const scopedTransaction=(b,fn)=>transaction(b,principal,async c=>{if(requireMember&&method!=='GET')await authorizeWrite(c,b);return fn(c);});
   if(!['GET','POST','PATCH','PUT','DELETE'].includes(method))fail('Method not allowed',405);
   if(method!=='GET'&&(req.headers['x-zuri-go']!=='1'||(['POST','PATCH','PUT'].includes(method)&&!req.headers['content-type']?.startsWith('application/json'))))fail('Use the same-origin application',403);
   if(route==='/session'&&method==='GET'){send(res,200,{authenticated:true,storage,businessId});return;}
   if(route==='/bootstrap'&&method==='GET'){const data=await transaction(businessId,principal,c=>snapshot(c,businessId));send(res,200,{business:data.business,storage,apiVersion:1});return;}
   // @trace implements FR-015-001 — local read-only preview, separate from hosted writes.
   const reportPreview=route.match(/^\/businesses\/([a-f0-9-]{36})\/campaigns\/([a-f0-9-]{36})\/marketing-report-preview$/);
   if(reportPreview){
    const [,b,campaign]=reportPreview;
    if(b!==businessId||storage!=='postgresql-local'||requireMember||principal?.kind!=='operator'||process.env.VERCEL==='1')fail('Local operator preview only',403);
    if(method!=='POST')fail('Method not allowed',405);
    const window=await readPreviewRequest(req);
    send(res,200,await scopedTransaction(b,async c=>previewMarketingReport(await readMarketingReportSource(c,b,campaign),window)));return;
   }
   // @trace implements FR-015-001, FR-015-003 — private local ledger; no send operation.
   const ledgerWrite=route.match(/^\/businesses\/([a-f0-9-]{36})\/campaigns\/([a-f0-9-]{36})\/(marketing-report-preparations|marketing-reports)$/);
   const ledgerRead=route.match(/^\/businesses\/([a-f0-9-]{36})\/marketing-reports\/([a-f0-9-]{36})$/);
   if(ledgerWrite||ledgerRead){
    const match=ledgerWrite||ledgerRead,[,b,id]=match;
    if(b!==businessId||storage!=='postgresql-local'||requireMember||principal?.kind!=='operator'||process.env.VERCEL==='1')fail('Local operator report only',403);
    if(method!==(ledgerWrite?'POST':'GET'))fail('Method not allowed',405);
    if(ledgerRead){if(req.headers['transfer-encoding']||Number(req.headers['content-length']||0)>0||req.body!==undefined&&(typeof req.body!=='object'||Object.keys(req.body).length))fail('GET body not allowed',422);send(res,200,await scopedTransaction(b,c=>readMarketingReport(c,b,id)));return;}
    const preparing=match[3]==='marketing-report-preparations',input=await readLedgerRequest(req,preparing?'prepare':'freeze');let result;
    for(let attempt=0;;attempt++){try{result=await scopedTransaction(b,c=>(preparing?prepareMarketingReport:freezeMarketingReport)(c,b,id,input));break;}catch(e){if(!ledgerRetry(e)||attempt>=2)throw e;}}
    send(res,result.replayed?200:201,result);return;
   }
   const visual=route.match(/^\/businesses\/([a-f0-9-]{36})\/visual-marketing(\/.*)?$/);
   if(visual){const [,b,path='']=visual;if(b!==businessId)fail('Business access denied',403);const input=['POST','PATCH','PUT'].includes(method)?await body(req):null;let result;for(let attempt=0;;attempt++){try{result=await scopedTransaction(b,c=>visualApi(c,b,path,method,input,url.searchParams));break;}catch(e){const retry=e.code==='40001'||e.code==='23505'&&['visual_one_active','visual_receipts_pkey'].includes(e.constraint);if(!retry||attempt>=2)throw e;}}send(res,method==='POST'&&(path.endsWith('/run')||path.endsWith('/retry'))?202:200,result);return;}
   const fileRoute=route.match(/^\/businesses\/([a-f0-9-]{36})\/tasks\/([A-Za-z0-9_-]{1,160})\/attachments(?:\/([a-f0-9-]{36}))?$/);
   if(fileRoute){
    const [,b,task,id]=fileRoute;if(b!==businessId)fail('Business access denied',403);
    const input=['POST','PATCH','PUT'].includes(method)?await body(req):null;
    const result=await scopedTransaction(b,c=>attachmentAction(c,b,task,id,method,input));
    if(method==='GET'&&id)sendAttachment(res,result,url.searchParams.get('preview')==='1');else send(res,200,result);
    return;
   }
   // Campaign tasks: the task and its campaign details in one transaction (FR-010-012, FR-010-014).
   const campaignTask=route.match(/^\/businesses\/([a-f0-9-]{36})\/campaigns\/([a-f0-9-]{36})\/tasks(?:\/([a-f0-9-]{36}))?$/);
   if(campaignTask){
    const [,b,campaign,task]=campaignTask;if(b!==businessId)fail('Business access denied',403);
    if(method==='DELETE'&&task){const result=await scopedTransaction(b,c=>archiveTask(c,b,task,c.zuriViewer));send(res,200,result);return;}
    if(!(method==='POST'&&!task||method==='PATCH'&&task))fail('Not found',404);
    const input=await body(req);send(res,200,await scopedTransaction(b,c=>saveCampaignTask(c,b,campaign,input,c.zuriViewer,task||null)));return;
   }
   const match=route.match(/^\/businesses\/([a-f0-9-]{36})(?:\/([a-z-]+))?(?:\/([a-f0-9-]{36}))?(?:\/(commit|transcript))?$/);
   if(!match||match[1]!==businessId)fail('Business access denied',403);
   const [,b,resource,id,action]=match,input=['POST','PATCH','PUT'].includes(method)?await body(req):null;
   // The meeting commit is one transaction. A request that raced an identical one fails to serialize (40001) and is retried, so it finds the receipt and replays (WI-09).
   if(resource==='meeting-commits'&&method==='POST'&&!id&&!action){let answer;for(let attempt=0;;attempt++){try{answer=await scopedTransaction(b,c=>commitMeeting(c,b,input,c.zuriViewer));break;}catch(e){if(e.code!=='40001'||attempt>=2)throw e;}}send(res,200,answer);return;}
   const result=await scopedTransaction(b,async c=>{
    if(!resource&&method==='PATCH'){if(!input.name?.trim())fail('ระบุชื่อธุรกิจ');const old=(await c.query('SELECT * FROM businesses WHERE id=$1 FOR UPDATE',[b])).rows[0];if(Number(input.row_version)!==Number(old.row_version))fail('ข้อมูลเปลี่ยนแล้ว โหลดใหม่',409);const row=(await c.query('UPDATE businesses SET name=$2 WHERE id=$1 RETURNING *',[b,input.name.trim()])).rows[0];await audit(c,b,'businesses',b,old,row);return row;}
    if(resource==='state'&&method==='GET'){const data=await snapshot(c,b);data.campaign_channels=(await c.query('SELECT * FROM campaign_channels WHERE business_id=$1',[b])).rows;return data;}
    if(resource==='overview'&&method==='GET')return overview(await snapshot(c,b),{date:url.searchParams.get('date')||undefined,kind:url.searchParams.get('period')==='month'?'monthly':'weekly'});
    if(resource==='briefs'&&method==='POST')return brief(c,b,input);
    if(resource==='observations'&&method==='POST')return observe(c,b,input);
    if(resource==='imports'&&method==='POST')return action==='commit'?importCommit(c,b,id,input):importPreview(c,b,input);
    if(resource==='teams'&&method==='GET'&&!id)return listTeams(c,b,c.zuriViewer);
    if(resource==='teams'&&(method==='POST'&&!id||method==='PATCH'&&id))return saveTeam(c,b,c.zuriViewer,input,id);
    if(resource==='teams'&&method==='DELETE'&&id)return archiveTeam(c,b,c.zuriViewer,id);
    if(resource==='meetings'&&method==='DELETE'&&id&&!action)return archiveMeeting(c,b,id,c.zuriViewer);
    if(resource==='weekly-plans'&&method==='DELETE'&&id)return archiveWeeklyPlan(c,b,id,c.zuriViewer);
    if(resource==='meetings'&&action==='transcript'&&method==='POST'&&id)return uploadTranscript(c,b,id,input);
    // Task Manager for every department (FR-010-003, FR-010-005, FR-010-009); every read is for the viewer's audience.
    if(resource==='tasks'&&method==='GET')return id?readTask(c,b,id,c.zuriViewer):listTasks(c,b,Object.fromEntries(url.searchParams),c.zuriViewer);
    if(resource==='tasks'&&method==='POST'&&!id)return createTask(c,b,input,c.zuriViewer);
    if(resource==='tasks'&&method==='PATCH'&&id)return updateTask(c,b,id,input,c.zuriViewer);
    if(resource==='tasks'&&method==='DELETE'&&id)return archiveTask(c,b,id,c.zuriViewer);
    if(resource==='projects'&&method==='GET')return id?readProject(c,b,id,c.zuriViewer):listProjects(c,b,c.zuriViewer);
    if(resource==='projects'&&method==='POST'&&!id)return createProject(c,b,input,c.zuriViewer);
    if(resource==='projects'&&method==='PATCH'&&id)return updateProject(c,b,id,input,c.zuriViewer);
    if(resource==='projects'&&method==='DELETE'&&id)return archiveProject(c,b,id,c.zuriViewer);
    if(resource==='workspace'&&method==='GET')return readLegacy(c,b);
    if(resource==='workspace'&&method==='PUT')return saveLegacy(c,b,input);
    if(method==='DELETE'&&id&&!action)return archiveRecord(c,b,resource,id,c.zuriViewer);
    if(method==='POST'&&!id||method==='PATCH'&&id)return save(c,b,resource,input,id);
    fail('Not found',404);
   });send(res,200,result);return;
}
