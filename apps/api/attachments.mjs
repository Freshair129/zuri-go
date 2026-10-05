import {createHash} from 'node:crypto';
import {fail,audit} from './service.mjs';
import {canRead} from '../web/src/content/shared/visibility.mjs';
import {viewerOf,taskNames} from './audience.mjs';
export const MAX_ATTACHMENT_BYTES=2*1024*1024;
const columns='id,task_id,filename,media_type,byte_size,sha256,created_at,uploaded_by_member_id,deleted_by_member_id,deleted_at';
export function decodeAttachment(input){
 const filename=typeof input?.filename==='string'?input.filename.trim():'';
 if(!filename||filename.length>180||/[\x00-\x1f\x7f\\/]/.test(filename))fail('ชื่อไฟล์ไม่ถูกต้อง');
 const encoded=input.base64;
 if(typeof encoded!=='string'||encoded.length>Math.ceil(MAX_ATTACHMENT_BYTES/3)*4)fail('ไฟล์ต้องไม่เกิน 2 MB',413);
 if(!encoded||encoded.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))fail('ข้อมูลไฟล์ไม่ถูกต้อง');
 const payload=Buffer.from(encoded,'base64');
 if(!payload.length||payload.toString('base64')!==encoded)fail('ข้อมูลไฟล์ไม่ถูกต้อง');
 if(payload.length>MAX_ATTACHMENT_BYTES)fail('ไฟล์ต้องไม่เกิน 2 MB',413);
 const hex=payload.subarray(0,12).toString('hex');let media_type='application/octet-stream';
 if(hex.startsWith('89504e470d0a1a0a'))media_type='image/png';
 else if(hex.startsWith('ffd8ff'))media_type='image/jpeg';
 else if(['GIF87a','GIF89a'].includes(payload.subarray(0,6).toString()))media_type='image/gif';
 else if(payload.subarray(0,4).toString()==='RIFF'&&payload.subarray(8,12).toString()==='WEBP')media_type='image/webp';
 return {filename,payload,media_type,byte_size:payload.length,sha256:createHash('sha256').update(payload).digest('hex')};
}
export async function attachmentAction(c,b,task,id,method,input){
 const owner=(await c.query("SELECT id,visibility,team_id,archived_at FROM tasks WHERE business_id=$1 AND (id::text=$2 OR legacy_metadata->>'id'=$2) ORDER BY (id::text=$2) DESC LIMIT 1",[b,task])).rows[0];
 // An unseen task answers exactly like a missing one (FR-011-007, FR-011-008).
 if(!owner||!canRead(viewerOf(c),owner,(await taskNames(c,b)).get(owner.id)||[]))fail('ไม่พบงาน',404);task=owner.id;
 if(method==='GET'){
  if(!id)return (await c.query(`SELECT ${columns} FROM task_attachments WHERE business_id=$1 AND task_id=$2 ORDER BY created_at,id`,[b,task])).rows;
  const file=(await c.query('SELECT * FROM task_attachments WHERE business_id=$1 AND task_id=$2 AND id=$3',[b,task,id])).rows[0];
  if(!file)fail('ไม่พบไฟล์',404);return file;
 }
 // Updating the Business serializes concurrent uploads under repeatable-read;
 // a stale transaction receives 409 before it can exceed the per-task limit.
 await c.query('UPDATE businesses SET domain_revision=domain_revision+1 WHERE id=$1',[b]);
 if(method==='POST'&&!id){
  if(owner.archived_at)fail('งานถูกเก็บถาวรแล้ว',409);
  const file=decodeAttachment(input);
  const count=(await c.query('SELECT count(*)::int AS n FROM task_attachments WHERE business_id=$1 AND task_id=$2 AND deleted_at IS NULL',[b,task])).rows[0].n;
  if(count>=5)fail('แนบได้สูงสุด 5 ไฟล์ต่องาน');
  const row=(await c.query(`INSERT INTO task_attachments(business_id,task_id,filename,media_type,byte_size,sha256,payload,uploaded_by_member_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${columns}`,[b,task,file.filename,file.media_type,file.byte_size,file.sha256,file.payload,c.zuriActor?.memberId||null])).rows[0];
  await audit(c,b,'task_attachments',row.id,null,row);return row;
 }
 if((method==='PATCH'&&id&&input?.deleted===true)||(method==='DELETE'&&id)){
  const row=(await c.query(`UPDATE task_attachments SET deleted_at=now(),deleted_by_member_id=$4 WHERE business_id=$1 AND task_id=$2 AND id=$3 AND deleted_at IS NULL RETURNING ${columns},deleted_at`,[b,task,id,c.zuriActor?.memberId||null])).rows[0];
  if(!row)fail('ไม่พบไฟล์',404);await audit(c,b,'task_attachments',row.id,null,row);return {id:row.id,deleted:true};
 }
 fail('Not found',404);
}
export function sendAttachment(res,file,preview){
 const inline=preview&&file.media_type.startsWith('image/');
 res.writeHead(200,{'Content-Type':inline?file.media_type:'application/octet-stream','Content-Length':file.byte_size,'Content-Disposition':`${inline?'inline':'attachment'}; filename="download"; filename*=UTF-8''${encodeURIComponent(file.filename).replace(/['()]/g,c=>'%'+c.charCodeAt(0).toString(16))}`,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'",'Cache-Control':'no-store'});
 res.end(file.payload);
}
