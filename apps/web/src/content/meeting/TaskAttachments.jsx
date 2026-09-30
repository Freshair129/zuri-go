import React,{useEffect,useRef,useState} from 'react';
import {Button} from '../../data-app-public.jsx';
import {ROOT,scoped} from '../business/api.mjs';
import {useWriteAccess} from '../business/TeamAccess.jsx';

export function TaskAttachments({businessId,taskId,onEvidence}){
 const {canWrite,requestWrite}=useWriteAccess(),input=useRef(null),[files,setFiles]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[removing,setRemoving]=useState(null);
 const path=`/tasks/${taskId}/attachments`,href=id=>`${ROOT}/businesses/${businessId}${path}/${id}`;
 useEffect(()=>{let live=true;setLoading(true);if(!businessId||!taskId){setLoading(false);return;}scoped(businessId,path).then(value=>{if(live)setFiles(value);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[businessId,taskId]);
 async function upload(file){
  if(!file)return;setError('');if(file.size>2*1024*1024||!file.size){setError('เลือกไฟล์ขนาด 1 byte ถึง 2 MB');return;}setBusy(true);
  try{
   const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('อ่านไฟล์ไม่สำเร็จ'));reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.readAsDataURL(file);});
   const row=await scoped(businessId,path,'POST',{filename:file.name,base64});setFiles(old=>[...old,row]);onEvidence?.(location.origin+href(row.id));
  }catch(e){setError(e.message);}finally{setBusy(false);if(input.current)input.current.value='';}
 }
 async function remove(file){setBusy(true);setError('');try{await scoped(businessId,`${path}/${file.id}`,'PATCH',{deleted:true});setFiles(old=>old.filter(x=>x.id!==file.id));setRemoving(null);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="mt-attachments"><div className="mt-attachment-heading"><h3>ไฟล์และรูปหลักฐาน</h3><span>{files.length} / 5 ไฟล์</span></div><p className="mc-note">ไฟล์ละไม่เกิน 2 MB · ไฟล์ใหญ่ใส่ลิงก์ผลงานได้ · Guest ดูและดาวน์โหลดได้</p>{!businessId?<p>เปิด workspace PostgreSQL เพื่อแนบไฟล์</p>:!taskId?<p>บันทึกงานก่อน แล้วเปิดรายละเอียดงานเพื่อแนบไฟล์</p>:<>{loading?<p role="status">กำลังโหลดไฟล์แนบ…</p>:<div className="mt-attachment-grid">{files.map(file=><article key={file.id}>{file.media_type.startsWith('image/')&&<a href={href(file.id)} target="_blank" rel="noreferrer"><img src={href(file.id)+'?preview=1'} alt={file.filename} loading="lazy"/></a>}<a href={href(file.id)} download={file.filename}>{file.filename} ↓</a><small>{Math.ceil(file.byte_size/1024)} KB</small>{removing===file.id&&canWrite?<div><span>ลบไฟล์นี้จากงาน?</span><Button type="button" disabled={busy} onClick={()=>remove(file)}>ยืนยันลบไฟล์</Button><Button type="button" onClick={()=>setRemoving(null)}>ยกเลิก</Button></div>:<Button type="button" disabled={busy} onClick={()=>requestWrite(()=>setRemoving(file.id))}>ลบไฟล์ {file.filename}</Button>}</article>)}</div>}{!loading&&!files.length&&<p>ยังไม่มีไฟล์แนบ</p>}<Button type="button" disabled={busy||loading||files.length>=5} onClick={()=>requestWrite(()=>input.current?.click())}>{busy?'กำลังบันทึกไฟล์…':'＋ แนบไฟล์ / รูปภาพ'}</Button><input ref={input} type="file" hidden aria-label="เลือกไฟล์หลักฐาน" onChange={e=>upload(e.target.files?.[0])}/><small>อัปโหลดและลบจะบันทึกทันที แยกจากปุ่มบันทึกงาน</small></>}{error&&<p role="alert" className="mc-errors">{error}</p>}</section>;
}
