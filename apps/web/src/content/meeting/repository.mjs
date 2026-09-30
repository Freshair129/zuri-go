import {empty,seedWorkspace,validateState} from './model.mjs';

// One IndexedDB record contains the domain entities, so commits cannot expose half a batch.
export function openRepository(appId,seed){
  const name=`zuri-meeting-task-manager:${appId}:v1`;let dbPromise;
  const listeners=new Set();const channel=typeof BroadcastChannel==='function'?new BroadcastChannel(name):null;
  const signal=()=>listeners.forEach(fn=>fn());if(channel)channel.onmessage=signal;
  const open=()=>dbPromise||(dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open(name,1);request.onupgradeneeded=()=>request.result.createObjectStore('workspace');request.onerror=()=>reject(Error('เปิดข้อมูลในเครื่องไม่ได้: '+request.error?.message));request.onblocked=()=>reject(Error('กรุณาปิดแท็บเก่าที่เปิดฐานข้อมูลนี้แล้วลองใหม่'));request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result);};}));
  async function transact(fn,mode='readwrite'){
    const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('workspace',mode),store=tx.objectStore('workspace'),request=store.get('state');let result,error;
      tx.oncomplete=()=>{if(mode==='readwrite'){signal();channel?.postMessage('changed');}resolve(result);};tx.onabort=()=>reject(error||Error('บันทึกไม่สำเร็จ: '+(tx.error?.message||'transaction aborted')));tx.onerror=()=>{};
      request.onsuccess=()=>{try{const current=request.result||empty();result=fn(current,store);if(result&&typeof result.then==='function')throw Error('Repository mutations must be synchronous');}catch(e){error=e;tx.abort();}};
    });
  }
  return {
    async init(){return transact((s,store)=>{const prior=JSON.stringify(s);seedWorkspace(s,seed);validateState(s);if(JSON.stringify(s)!==prior)store.put(s,'state');return s;});},
    read:()=>transact(s=>validateState(s),'readonly'),
    mutate:fn=>transact((s,store)=>{if(s.restoreJournal)throw Error('กำลังกู้คืนข้อมูล กรุณารอให้เสร็จก่อน');const result=fn(s);s.revision++;validateState(s);store.put(s,'state');return {state:s,result};}),
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    stageRestore:journal=>transact((s,store)=>{if(s.restoreJournal)throw Error('มีการกู้คืนค้างอยู่');validateState(journal.nextDomain);s.restoreJournal=structuredClone(journal);store.put(s,'state');}),
    finishRestore:()=>transact((s,store)=>{if(!s.restoreJournal)return s;const next=validateState(s.restoreJournal.nextDomain);delete next.restoreJournal;next.revision=Math.max(next.revision,s.revision)+1;store.put(next,'state');return next;}),
    cancelRestore:()=>transact((s,store)=>{delete s.restoreJournal;store.put(s,'state');return s;}),
    close(){channel?.close();dbPromise?.then(db=>db.close());listeners.clear();}
  };
}

export async function recoverRestore(repo,campaignKey,storage=localStorage){const s=await repo.read();if(!s.restoreJournal)return false;storage.setItem(campaignKey,JSON.stringify(s.restoreJournal.nextCampaign));await repo.finishRestore();return true;}
export async function restoreBoth(repo,campaignKey,nextDomain,nextCampaign,storage=localStorage){
  const previousCampaign=storage.getItem(campaignKey);await repo.stageRestore({nextDomain,nextCampaign,previousCampaign});
  try{storage.setItem(campaignKey,JSON.stringify(nextCampaign));await repo.finishRestore();}
  catch(error){try{if(previousCampaign===null)storage.removeItem(campaignKey);else storage.setItem(campaignKey,previousCampaign);await repo.cancelRestore();}catch{throw Error('กู้คืนยังไม่ครบ เก็บ journal ไว้แล้ว กรุณาโหลดใหม่เพื่อทำต่อ');}throw error;}
}
