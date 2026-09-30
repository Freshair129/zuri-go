import pg from 'pg';
import {config} from './config.mjs';
import {resolveViewer,viewerSettings} from './viewer.mjs';
pg.types.setTypeParser(1082,value=>value);
export const pool=new pg.Pool({connectionString:config().databaseUrl,max:5,options:process.env.VERCEL==='1'?undefined:'-c search_path=zuri_go,public',connectionTimeoutMillis:4000});
// transaction(businessId,fn) runs as a Guest; transaction(businessId,principal,fn) resolves the viewer first (SDD-011).
export async function transaction(businessId,principal,fn){
 if(typeof principal==='function'){fn=principal;principal=null;}
 const client=await pool.connect();client.zuriActor=null;client.zuriViewer=null;try{await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');await client.query('SET LOCAL search_path TO zuri_go,public');await client.query("SELECT set_config('zuri_go.business_id',$1,true)",[businessId]);
  client.zuriViewer=await resolveViewer(client,businessId,principal);const s=viewerSettings(client.zuriViewer);await client.query("SELECT set_config('zuri_go.viewer_kind',$1,true),set_config('zuri_go.viewer_member',$2,true)",[s.kind,s.member]);
  const result=await fn(client);await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.zuriActor=null;client.zuriViewer=null;client.release();}
}
export const hashable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export async function rows(client,table,businessId){return (await client.query(`SELECT * FROM zuri_go.${table} WHERE business_id=$1`,[businessId])).rows;}
