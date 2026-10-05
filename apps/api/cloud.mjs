import {memberToken,readMemberSession,memberCookie,loginMember,publicIdentity} from './member-auth.mjs';
import {config} from './config.mjs';
import {transaction} from './db.mjs';
import {session} from './viewer.mjs';
import {body} from './http.mjs';
import {handleApi,send,sendError} from './api.mjs';
import {cloudOriginAllowed,consumeLoginAttempt,sessionCookie} from './team-auth.mjs';

export default async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Cache-Control','no-store');
 try{
  const cfg=config(),secret=process.env.ZURI_GO_SESSION_SECRET,base=process.env.ZURI_GO_PUBLIC_ORIGIN;
  if(!cfg.businessId||!cfg.databaseUrl||!secret||secret.length<32||!base?.startsWith('https://')){send(res,503,{error:'Workspace ยังตั้งค่าไม่ครบ'});return;}
  const origins=[base,...(process.env.VERCEL_URL?['https://'+process.env.VERCEL_URL]:[])];
  if(!cloudOriginAllowed(req,origins)){send(res,403,{error:'เปิดผ่านเว็บไซต์ Zuri-Go เท่านั้น'});return;}
  const url=new URL(req.url,base),route=url.searchParams.has('route')?'/'+url.searchParams.get('route'):url.pathname.replace(/^\/api\/zuri-go\/v1/,'');
  if(!['GET','POST','PATCH','PUT','DELETE'].includes(req.method)){send(res,405,{error:'Method not allowed'});return;}
  if(req.method!=='GET'&&(req.headers['x-zuri-go']!=='1'||!req.headers['content-type']?.startsWith('application/json'))){send(res,403,{error:'ใช้แบบฟอร์มจากเว็บไซต์'});return;}
  if(route==='/login'&&req.method==='POST'){
   const input=await body(req);const allowed=await transaction(cfg.businessId,c=>consumeLoginAttempt(c,cfg.businessId,req.headers['x-vercel-forwarded-for']||req.headers['x-real-ip'],secret));
   if(!allowed){res.setHeader('Retry-After','900');send(res,429,{error:'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาที'});return;}
   const member=await transaction(cfg.businessId,c=>loginMember(c,cfg.businessId,input?.password));
   if(!member){send(res,401,{error:'รหัสระบุตัวตนไม่ถูกต้อง'});return;}
   res.setHeader('Set-Cookie',[memberCookie(memberToken(cfg.businessId,member,secret)),sessionCookie('')]);send(res,200,{authenticated:true,member:publicIdentity(member),businessId:cfg.businessId,storage:'postgresql-cloud'});return;
  }
  if(route==='/logout'&&req.method==='POST'){res.setHeader('Set-Cookie',[memberCookie(''),sessionCookie('')]);send(res,200,{authenticated:false});return;}
  const claims=readMemberSession(req.headers.cookie,cfg.businessId,secret);
  if(req.method!=='GET'&&!claims){send(res,401,{error:'เข้าสู่ระบบด้วย รหัสระบุตัวตนก่อนแก้ไข',code:'AUTH_REQUIRED'});return;}
  if(route==='/session'&&req.method==='GET'){const viewer=await transaction(cfg.businessId,session(claims),c=>c.zuriViewer);const member=viewer.kind==='member'?viewer.member:null;send(res,200,{authenticated:!!member,member:publicIdentity(member),admin:!!member&&viewer.admin,teamIds:member?viewer.teamIds:[],businessId:cfg.businessId,storage:'postgresql-cloud'});return;}
  // Import staging is an operator-only local task, never serverless filesystem state.
  if(/^\/businesses\/[^/]+\/imports(?:\/|$)/.test(route)){send(res,403,{error:'นำเข้า backup ผ่านผู้ดูแลระบบ'});return;}
  url.pathname='/api/zuri-go/v1'+route;
  await handleApi(req,res,url,{businessId:cfg.businessId,storage:'postgresql-cloud',principal:session(claims),requireMember:true});
 }catch(e){sendError(res,e);}
}
