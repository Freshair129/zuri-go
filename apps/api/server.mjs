import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {allowedRequest} from './http.mjs';
import {handleApi,sendError} from './api.mjs';
import {config} from './config.mjs';
import {pool,transaction} from './db.mjs';
import {OPERATOR} from './viewer.mjs';
import {fail} from './service.mjs';
import {startWorker} from './visual-marketing/jobs.mjs';
const cfg=config(),publicRoot=resolve(fileURLToPath(new URL('../../build/site/',import.meta.url))),businessId=cfg.businessId;
if(!businessId||!cfg.databaseUrl)throw Error('Configure a local Business and PostgreSQL before starting.');
await transaction(businessId,OPERATOR,async c=>{await c.query("INSERT INTO businesses(id,name,slug) VALUES($1,'ธุรกิจของฉัน',$2) ON CONFLICT(id) DO NOTHING",[businessId,'local-'+businessId]);});
const media={'.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
 try{
  if(!allowedRequest(req,cfg.port))fail('Local access only',403);
  const url=new URL(req.url,`http://127.0.0.1:${cfg.port}`),path=url.pathname;
  if(path.startsWith('/api/zuri-go/v1')){await handleApi(req,res,url,{businessId,storage:'postgresql-local',principal:OPERATOR});return;}
  if(req.method!=='GET'&&req.method!=='HEAD')fail('Method not allowed',405);
  const decoded=decodeURIComponent(path);if(decoded.includes('\0')||decoded.split('/').some(s=>s.startsWith('.')))fail('Not found',404);
  const candidate=resolve(publicRoot,'.'+decoded,decoded.endsWith('/')?'index.html':'');
  if(candidate!==publicRoot&&!candidate.startsWith(publicRoot+sep))fail('Not found',404);
  const file=await realpath(candidate);if(!file.startsWith(publicRoot+sep))fail('Not found',404);
  const bytes=await readFile(file);res.writeHead(200,{'Content-Type':media[extname(file)]||'application/octet-stream','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=60'});res.end(req.method==='HEAD'?undefined:bytes);
 }catch(e){sendError(res,e);}
});
server.listen(cfg.port,'127.0.0.1',()=>console.log(`Zuri-Go local PostgreSQL workspace http://127.0.0.1:${cfg.port}`));
const stopWorker=startWorker(businessId);
for(const event of ['SIGINT','SIGTERM'])process.on(event,()=>server.close(async()=>{await stopWorker();await pool.end();process.exit(0);}));
