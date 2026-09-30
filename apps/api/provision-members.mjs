// Trusted operator CLI. Never included in the Vercel package.
import {readFile,writeFile,mkdir,rename,readdir} from 'node:fs/promises';
import {randomBytes,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import pg from 'pg';
import {config} from './config.mjs';
import {passwordHash,verifyPassword} from './team-auth.mjs';

export async function provisionMembers(cfg,folder,{resetPid,disablePid,enablePid,adminPid,revokeAdminPid}={}){
 const c=new pg.Client({connectionString:cfg.adminUrl});await c.connect();await mkdir(folder,{recursive:true});
 const issued=[];
 try{
  const adminTarget=adminPid||revokeAdminPid,target=resetPid||disablePid||enablePid||adminTarget;
  await c.query('BEGIN');await c.query('SET LOCAL search_path TO zuri_go,public');await c.query("SELECT set_config('zuri_go.business_id',$1,true)",[cfg.businessId]);
  // Shared lock order with authenticated writes also invalidates stale snapshots.
  await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[cfg.businessId]);
  const members=(await c.query('SELECT m.id,m.pid,m.display_name,m.status,a.password_hash,a.credential_version,a.enabled FROM members m LEFT JOIN member_credentials a ON (a.business_id,a.member_id)=(m.business_id,m.id) WHERE m.business_id=$1 AND ($2::text IS NULL OR m.pid=$2) ORDER BY m.pid',[cfg.businessId,target||null])).rows;
  if(target&&!members.length)throw Error('PID not found');
  for(const m of members){
   // Business admin (FR-011-002) is set only here, by the table owner; the database refuses it from the runtime role.
   if(adminTarget){const before=(await c.query('SELECT is_business_admin FROM members WHERE business_id=$1 AND id=$2',[cfg.businessId,m.id])).rows[0].is_business_admin;await c.query('UPDATE members SET is_business_admin=$3 WHERE business_id=$1 AND id=$2',[cfg.businessId,m.id,!!adminPid]);
    await c.query("INSERT INTO change_events(business_id,entity_type,entity_id,event_type,before_data,after_data,actor_kind,actor_subject,request_id) VALUES($1,'members',$2,$3,$4,$5,'local_operator','provision-members',$6)",[cfg.businessId,m.id,adminPid?'admin_granted':'admin_revoked',{is_business_admin:before},{is_business_admin:!!adminPid},randomUUID()]);continue;}
   if(disablePid||enablePid){if(!m.password_hash)throw Error('No credential to enable/disable');await c.query('UPDATE member_credentials SET enabled=$3,credential_version=credential_version+1,updated_at=now() WHERE business_id=$1 AND member_id=$2',[cfg.businessId,m.id,!!enablePid]);continue;}
   if(m.status!=='active')continue;
   const path=resolve(folder,m.pid+'.json');let saved;
   try{saved=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
   if(m.password_hash&&!resetPid){
    if(!saved||saved.memberId!==m.id||saved.businessId!==cfg.businessId||!await verifyPassword(saved.password,m.password_hash))throw Error('Existing credential handover unavailable for '+m.pid+'; explicit --reset required.');
    issued.push({pid:m.pid,name:m.display_name,path,created:false});continue;
   }
   const password=randomBytes(18).toString('base64url'),version=Number(m.credential_version||0)+1;
   const hashes=(await c.query('SELECT password_hash FROM member_credentials WHERE business_id=$1',[cfg.businessId])).rows;
   for(const other of hashes)if(await verifyPassword(password,other.password_hash))throw Error('Generated identity code collision; retry provisioning.');
   const handover={businessId:cfg.businessId,memberId:m.id,pid:m.pid,name:m.display_name,url:cfg.origin||'https://zuri-metrics-map.vercel.app/',password,credentialVersion:version,issuedAt:new Date().toISOString()};
   // A private pending handover survives an uncertain commit without logging secrets.
   await writeFile(path+'.pending',JSON.stringify(handover,null,2),{mode:0o600});
   await c.query('INSERT INTO member_credentials(business_id,member_id,password_hash,credential_version,enabled) VALUES($1,$2,$3,$4,true) ON CONFLICT(business_id,member_id) DO UPDATE SET password_hash=EXCLUDED.password_hash,credential_version=EXCLUDED.credential_version,enabled=true,updated_at=now()',[cfg.businessId,m.id,await passwordHash(password),version]);
   issued.push({pid:m.pid,name:m.display_name,path,created:true});
  }
  await c.query('COMMIT');
  for(const item of issued)if(item.created)await rename(item.path+'.pending',item.path);
  const handovers=await Promise.all((await readdir(folder)).filter(x=>/^ZGO-P\d+\.json$/.test(x)).map(async name=>JSON.parse(await readFile(resolve(folder,name),'utf8'))));
  if(issued.length)await writeFile(resolve(folder,'index.md'),'# Private member access\n\nEach JSON file contains one member password. Do not deploy or share this index publicly.\n\n'+handovers.map(x=>`- ${x.name} · ${x.pid}: ${x.pid}.json`).join('\n')+'\n',{mode:0o600});
  return issued;
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{await c.end();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),cloud=args.includes('--cloud');
 const cfg=cloud?JSON.parse(await readFile(new URL('../../.local/cloud-config.json',import.meta.url),'utf8')):config();
 const value=k=>args.includes(k)?args[args.indexOf(k)+1]:undefined;
 const ops=['--reset','--disable','--enable','--admin','--no-admin'];
 for(const key of ops)if(args.includes(key)&&!/^ZGO-P\d{4,}$/.test(value(key)||''))throw Error('Specify a PID after '+key);
 if(ops.filter(x=>args.includes(x)).length>1)throw Error('Choose one credential operation');
 const folder=fileURLToPath(new URL('../../.local/member-access/'+(cloud?'production/':'local/'),import.meta.url));
 const result=await provisionMembers(cfg,folder,{resetPid:value('--reset'),disablePid:value('--disable'),enablePid:value('--enable'),adminPid:value('--admin'),revokeAdminPid:value('--no-admin')});
 console.log(JSON.stringify({members:result.map(x=>({pid:x.pid,name:x.name,created:x.created})),privateHandover:folder}));
}
