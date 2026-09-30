import {authorizeWrite} from './member-auth.mjs';
import {attachmentAction,sendAttachment} from './attachments.mjs';
import {body} from './http.mjs';
import {transaction} from './db.mjs';
import {snapshot,save,observe,brief,fail,audit} from './service.mjs';
import {overview} from '../web/src/content/business/model.mjs';
import {importPreview,importCommit,readLegacy,saveLegacy} from './workspace.mjs';
import {listTeams,saveTeam} from './teams.mjs';
export function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
export function sendError(res,e){const status=e.status||(['23502','23503','23505','23514','22P02','22007','22008'].includes(e.code)?422:e.code==='40001'?409:e.code==='ENOENT'?404:500);send(res,status,{error:e.status?e.message:status===422?'ข้อมูลขัดกับข้อกำหนดหรือรายการที่อ้างอิง กรุณาตรวจอีกครั้ง':status===409?'ข้อมูลถูกแก้จากอีกหน้าต่าง กรุณาโหลดใหม่':status===404?'ไม่พบรายการ':'บันทึกไม่สำเร็จ กรุณาลองใหม่',code:e.code||null});if(status===500)console.error('Request failed',e.code||e.name);}
// principal: OPERATOR on the local server, session(claims) on the hosted API; nothing else selects the viewer (FR-011-003).
export async function handleApi(req,res,url,{businessId,storage,principal=null,requireMember=false}){
   const route=url.pathname.slice('/api/zuri-go/v1'.length),method=req.method;
   const scopedTransaction=(b,fn)=>transaction(b,principal,async c=>{if(requireMember&&method!=='GET')await authorizeWrite(c,b);return fn(c);});
   if(!['GET','POST','PATCH','PUT'].includes(method))fail('Method not allowed',405);
   if(method!=='GET'&&(req.headers['x-zuri-go']!=='1'||!req.headers['content-type']?.startsWith('application/json')))fail('Use the same-origin application',403);
   if(route==='/session'&&method==='GET'){send(res,200,{authenticated:true,storage,businessId});return;}
   if(route==='/bootstrap'&&method==='GET'){const data=await transaction(businessId,principal,c=>snapshot(c,businessId));send(res,200,{business:data.business,storage,apiVersion:1});return;}
   const fileRoute=route.match(/^\/businesses\/([a-f0-9-]{36})\/tasks\/([A-Za-z0-9_-]{1,160})\/attachments(?:\/([a-f0-9-]{36}))?$/);
   if(fileRoute){
    const [,b,task,id]=fileRoute;if(b!==businessId)fail('Business access denied',403);
    const input=method==='GET'?null:await body(req);
    const result=await scopedTransaction(b,c=>attachmentAction(c,b,task,id,method,input));
    if(method==='GET'&&id)sendAttachment(res,result,url.searchParams.get('preview')==='1');else send(res,200,result);
    return;
   }
   const match=route.match(/^\/businesses\/([a-f0-9-]{36})(?:\/([a-z-]+))?(?:\/([a-f0-9-]{36}))?(?:\/(commit))?$/);
   if(!match||match[1]!==businessId)fail('Business access denied',403);
   const [,b,resource,id,action]=match,input=method==='GET'?null:await body(req);
   const result=await scopedTransaction(b,async c=>{
    if(!resource&&method==='PATCH'){if(!input.name?.trim())fail('ระบุชื่อธุรกิจ');const old=(await c.query('SELECT * FROM businesses WHERE id=$1 FOR UPDATE',[b])).rows[0];if(Number(input.row_version)!==Number(old.row_version))fail('ข้อมูลเปลี่ยนแล้ว โหลดใหม่',409);const row=(await c.query('UPDATE businesses SET name=$2 WHERE id=$1 RETURNING *',[b,input.name.trim()])).rows[0];await audit(c,b,'businesses',b,old,row);return row;}
    if(resource==='state'&&method==='GET'){const data=await snapshot(c,b);data.campaign_channels=(await c.query('SELECT * FROM campaign_channels WHERE business_id=$1',[b])).rows;return data;}
    if(resource==='overview'&&method==='GET')return overview(await snapshot(c,b),{date:url.searchParams.get('date')||undefined,kind:url.searchParams.get('period')==='month'?'monthly':'weekly'});
    if(resource==='briefs'&&method==='POST')return brief(c,b,input);
    if(resource==='observations'&&method==='POST')return observe(c,b,input);
    if(resource==='imports'&&method==='POST')return action==='commit'?importCommit(c,b,id,input):importPreview(c,b,input);
    if(resource==='teams'&&method==='GET'&&!id)return listTeams(c,b,c.zuriViewer);
    if(resource==='teams'&&(method==='POST'&&!id||method==='PATCH'&&id))return saveTeam(c,b,c.zuriViewer,input,id);
    if(resource==='workspace'&&method==='GET')return readLegacy(c,b);
    if(resource==='workspace'&&method==='PUT')return saveLegacy(c,b,input);
    if(method==='POST'&&!id||method==='PATCH'&&id)return save(c,b,resource,input,id);
    fail('Not found',404);
   });send(res,200,result);return;
}
