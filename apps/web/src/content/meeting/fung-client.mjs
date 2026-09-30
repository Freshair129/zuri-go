import {hash} from './model.mjs';
const PREFIX='/integrations/meeting-task-manager/v1';
export function parseConnection(value){let url;try{url=new URL(value.trim());}catch{throw Error('วาง Connect URL จาก FUNG › Settings › Runtime');}
  if(!['http:','https:'].includes(url.protocol)||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.username||url.password||url.search||!['','/'].includes(url.pathname))throw Error('เชื่อมต่อได้เฉพาะ FUNG บนเครื่องนี้');
  const token=url.hash.slice(1);if(!token||token.length>512||/\s/.test(token))throw Error('Connect URL ต้องมี token ของรอบที่เปิด FUNG');return {origin:url.origin,token};
}
export function createFungClient(connectUrl,{fetchImpl=fetch,legacySourceInstanceId}={}){
  const connection=parseConnection(connectUrl);let disconnected=false;
  async function request(path,init={},blob=false){
    if(disconnected)throw Error('ยกเลิกการเชื่อมต่อแล้ว');if(!path.startsWith('/')||path.startsWith('//'))throw Error('เส้นทาง API ไม่ถูกต้อง');
    const target=new URL(path,connection.origin);if(target.origin!==connection.origin)throw Error('ปลายทางไม่ใช่ FUNG เครื่องนี้');
    let response;try{response=await fetchImpl(target.href,{...init,headers:{...init.headers,Authorization:`Bearer ${connection.token}`},redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(init.body instanceof Blob?300000:180000)});}catch{throw Error('ติดต่อ FUNG ไม่ได้ ตรวจว่าเปิดแอปและอนุญาต origin ของ Mission Control แล้ว');}
    if(disconnected)throw Error('ยกเลิกการเชื่อมต่อแล้ว');
    if(!response.ok){const e=Error(response.status===401?'Token หมดอายุหรือไม่ถูกต้อง กรุณาคัดลอก Connect URL ใหม่':`FUNG ตอบ HTTP ${response.status}`);e.status=response.status;try{const body=await response.json();if(body.error)e.message+=` · ${String(body.error).slice(0,160)}`;}catch{}throw e;}
    return blob?response.blob():response.json();
  }
  return {
    origin:connection.origin,
    disconnect(){disconnected=true;connection.token='';},
    async connect(){const data=await request('/recordings');if(!Array.isArray(data.recordings))throw Error('FUNG ส่งรายการ recordings ไม่ถูกต้อง');let capabilities=null;try{capabilities=await request(`${PREFIX}/capabilities`);}catch(e){if(e.status!==404)throw e;}if(capabilities&&capabilities.protocolVersion!==1)throw Error('Protocol ตัวเชื่อม FUNG ยังไม่รองรับ');return {recordings:data.recordings,capabilities};},
    async recordings(){const data=await request('/recordings');if(!Array.isArray(data.recordings))throw Error('รายการ recordings ไม่ถูกต้อง');return data.recordings;},
    async snapshot(recording,capabilities){
      if(capabilities?.snapshot?.available)return request(`${PREFIX}/recordings/${encodeURIComponent(recording.id)}/snapshot`);
      if(!legacySourceInstanceId)throw Error('กรุณายืนยัน instance ของ FUNG ก่อนใช้ legacy transcript');
      const result=await request(`/recordings/${encodeURIComponent(recording.id)}/transcript`),raw=result.transcript?.segments;if(!Array.isArray(raw))throw Error('ไม่พบ transcript');
      const segments=raw.map(seg=>({segmentId:seg.id,nativeRevisionId:null,startMs:seg.startMs,endMs:seg.endMs,text:seg.text,speakerLabel:seg.speakerName??null,reviewState:'unknown',sourceRef:recording.id}));
      return {schemaVersion:1,sourceInstanceId:legacySourceInstanceId,projectId:recording.projectId,recordingId:recording.id,sourceMode:'legacy',sourceRevision:null,sourceCursor:null,contentHash:await hash([recording.projectId,recording.id,'legacy',segments]),capturedAt:new Date().toISOString(),meetingStartedAt:null,timezone:'Asia/Bangkok',segments,coverage:{status:'unknown',returnedSegments:segments.length}};
    },
    draft:body=>request(`${PREFIX}/action-drafts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
    async upload(file){if(!file||!file.size||file.size>512*1024*1024)throw Error('เลือกไฟล์เสียง/วิดีโอขนาดมากกว่า 0 และไม่เกิน 512 MiB');if(!/\.(wav|mp3|m4a|mp4|webm|ogg|flac|aac|mpeg|mov)$/i.test(file.name))throw Error('ชนิดไฟล์นี้ยังไม่รองรับ');const receipt=await request('/recordings/import',{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream','X-Fung-Filename':/^[\x20-\x7E]+$/.test(file.name)?file.name:`meeting-upload.${file.name.split('.').pop().toLowerCase()}`},body:file});if(!receipt.jobId||!receipt.recordingId||!receipt.projectId)throw Error('FUNG ไม่ส่ง receipt ของการนำเข้า');return receipt;},
    async job(id){const data=await request(`/jobs/${encodeURIComponent(id)}`);if(!data.job)throw Error('ไม่พบสถานะ job');return data.job;},
    audio:(id,channel='')=>request(`/recordings/${encodeURIComponent(id)}/audio${channel?'?channel='+encodeURIComponent(channel):''}`,{},true)
  };
}
