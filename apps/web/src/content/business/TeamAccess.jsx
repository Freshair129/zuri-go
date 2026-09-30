import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {Button,useDataApp} from '../../data-app-public.jsx';
import {Modal} from '../dashboard/Forms.jsx';
import {ZuriGoLogo} from '../shared/ZuriGoLogo.jsx';
import {request} from './api.mjs';
import pair from '../assets/metrics-pair-clipboard_gen-80d72fb8.webp';
import './team-access.css';

const Access=createContext({canWrite:true,requestWrite:action=>action?.(),viewer:{kind:'operator',admin:false,teamIds:[]}});
export const useWriteAccess=()=>useContext(Access);
export function TeamAccess({children}){
 const shell=useDataApp();
 useEffect(()=>{if(shell.appTitle==='Campaign Mission Control')shell.setAppTitle('Zuri-Go');},[shell.appTitle,shell.setAppTitle]);
 const local=location.hostname==='127.0.0.1',pending=useRef(null),[session,setSession]=useState(local?{storage:'postgresql-local',authenticated:true}:null),[loading,setLoading]=useState(!local),[loginOpen,setLoginOpen]=useState(false),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const canWrite=local||!!session?.authenticated;
 // Who is reading (FR-011-003): the local operator, a signed-in Member or a Guest. The server decides what each one sees.
 const viewer=local?{kind:'operator',admin:false,teamIds:[]}:session?.authenticated?{kind:'member',memberId:session.member?.memberId,admin:!!session.admin,teamIds:session.teamIds||[]}:{kind:'guest',admin:false,teamIds:[]};
 async function check(){setLoading(true);try{setSession(await request('/session'));setError('');}catch(e){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{if(local)return;check();const expired=()=>{pending.current=null;setSession(old=>old?{...old,authenticated:false,admin:false,teamIds:[]}:old);window.dispatchEvent(new Event('zuri-go-viewer-changed'));setError('กรุณาใส่ รหัสระบุตัวตนเพื่อบันทึกการเปลี่ยนแปลง');setLoginOpen(true);};window.addEventListener('zuri-go-auth-required',expired);return()=>window.removeEventListener('zuri-go-auth-required',expired);},[]);
 useEffect(()=>{if(canWrite&&pending.current){const action=pending.current;pending.current=null;action();}},[canWrite]);
 function requestWrite(action){if(canWrite)return action?.();pending.current=action;setError('');setLoginOpen(true);}
 function close(){if(busy)return;pending.current=null;setLoginOpen(false);setPassword('');setError('');}
 async function login(e){e.preventDefault();setBusy(true);setError('');try{const signed=await request('/login','POST',{password});setSession({...signed,...await request('/session').catch(()=>({}))});setPassword('');setLoginOpen(false);window.dispatchEvent(new Event('zuri-go-viewer-changed'));}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function logout(){setBusy(true);try{await request('/logout','POST',{});pending.current=null;setSession(old=>({...old,authenticated:false,admin:false,teamIds:[]}));setError('');window.dispatchEvent(new Event('zuri-go-viewer-changed'));}catch(e){setError(e.message);}finally{setBusy(false);}}
 if(loading)return <section className="zg-team-login" aria-busy="true"><ZuriGoLogo/><p>กำลังเปิด workspace ของทีม…</p></section>;
 if(!session)return <section className="zg-team-login"><ZuriGoLogo/><p role="alert">{error||'เชื่อมต่อ workspace ไม่สำเร็จ'}</p><Button onClick={check}>ลองโหลดอีกครั้ง</Button></section>;
 return <Access.Provider value={{canWrite,requestWrite,viewer}}>{!local&&<div className="zg-team-bar"><span className={`zg-access-badge ${canWrite?'team':'guest'}`}>{canWrite?(session.member?.displayName+' · '+session.member?.pid):'Guest mode'}</span><span>{canWrite?'แก้ไขและบันทึกได้':'ดูได้อย่างเดียว'}</span><Button onClick={canWrite?logout:()=>requestWrite(null)} disabled={busy}>{canWrite?'ออกจากระบบ':'เข้าสู่ระบบเพื่อแก้ไข'}</Button>{error&&!loginOpen&&<span role="alert">{error}</span>}</div>}{children(session)}{loginOpen&&<Modal title="เข้าสู่ระบบเพื่อแก้ไข" onClose={close} wide={false}><section className="zg-team-login zg-team-dialog"><ZuriGoLogo/><img className="zg-team-pair" src={pair} alt="Zuri และน้องวางใจต้อนรับทีม"/><p>Guest ดูข้อมูลได้ทันที<br/>ใช้ รหัสระบุตัวตนเพื่อสร้าง แก้ไข ลบ หรือแนบไฟล์</p><form onSubmit={login}><label htmlFor="team-password">รหัสระบุตัวตน</label><input id="team-password" type="password" autoComplete="current-password" autoFocus required maxLength={256} value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<p role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy?'กำลังเข้าสู่ระบบ…':'เข้า Zuri-Go →'}</Button><Button type="button" onClick={close} disabled={busy}>ดูต่อใน Guest mode</Button></form></section></Modal>}</Access.Provider>;
}
