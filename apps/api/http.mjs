import {fail} from './service.mjs';
export function allowedRequest(req,port){const host=req.headers.host,origin=req.headers.origin;return host===`127.0.0.1:${port}`&&(!origin||origin===`http://${host}`)&&req.headers['sec-fetch-site']!=='cross-site';}
export async function body(req){
 if(req.body!==undefined){const raw=Buffer.isBuffer(req.body)?req.body.toString('utf8'):typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>26*1024*1024)fail('ข้อมูลเกิน 26 MB',413);try{return JSON.parse(raw);}catch{fail('JSON ไม่ถูกต้อง',400);}}
 const chunks=[];let size=0;
 for await(const chunk of req){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>26*1024*1024)fail('ข้อมูลเกิน 26 MB',413);chunks.push(bytes);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail('JSON ไม่ถูกต้อง',400);}
}
