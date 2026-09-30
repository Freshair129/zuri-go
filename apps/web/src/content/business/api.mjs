export const ROOT='/api/zuri-go/v1';
export async function request(path,method='GET',data){
 let response;try{response=await fetch(ROOT+path,{method,headers:{'Content-Type':'application/json','X-Zuri-Go':'1'},body:data===undefined?undefined:JSON.stringify(data),cache:'no-store'});}catch{throw Error('เชื่อมต่อ workspace ไม่ได้ ตรวจการเชื่อมต่อแล้วลองใหม่');}
 let value;try{value=await response.json();}catch{throw Error('ยังเชื่อม workspace ไม่ได้ กรุณาลองใหม่');}
 if(!response.ok){if(value.code==='AUTH_REQUIRED'&&path!=='/session')window.dispatchEvent(new Event('zuri-go-auth-required'));throw Object.assign(Error(value.error||'บันทึกไม่สำเร็จ'),{code:value.code,status:response.status});}return value;
}
export const scoped=(business,path,method='GET',data)=>request(`/businesses/${business}${path}`,method,data);
export const modeKey=appId=>`zuri-go:${appId}:server-business`;
export function openServerRepository(business){
 let workspace,closed=false;const listeners=new Set(),channel=typeof BroadcastChannel==='function'?new BroadcastChannel('zuri-go:'+business):null;
 const notify=()=>{if(!closed)listeners.forEach(fn=>fn());};if(channel)channel.onmessage=notify;
 async function readAll(){workspace=await scoped(business,'/workspace');return workspace;}
 return {server:true,business,init:async()=>{await readAll();return workspace.meetingTaskManager;},read:async()=>{await readAll();return workspace.meetingTaskManager;},campaign:()=>workspace?{...workspace.campaignWorkspace,serverVersion:workspace.version}:null,
  async mutate(fn){await readAll();const next=structuredClone(workspace.meetingTaskManager),result=fn(next);if(result&&typeof result.then==='function')throw Error('Mutation must be synchronous');workspace=await scoped(business,'/workspace','PUT',{version:workspace.version,meetingTaskManager:next});notify();channel?.postMessage('changed');return {state:workspace.meetingTaskManager,result};},
  // The meeting commit runs on the server (PLAN-002 WI-09); the client sends choices and takes the workspace it returns.
  async commit(input){const out=await scoped(business,'/meeting-commits','POST',input);workspace=out.workspace;notify();channel?.postMessage('changed');return {state:workspace.meetingTaskManager,result:out};},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},close(){closed=true;channel?.close();listeners.clear();}
 };
}
