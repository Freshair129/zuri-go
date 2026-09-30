import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {verifyPassword} from './team-auth.mjs';
const COOKIE='__Host-zuri-go-member',LIFETIME=43200,DUMMY='0'.repeat(32)+':'+'0'.repeat(128);
const sign=(p,s)=>createHmac('sha256',s).update(p).digest('base64url');
export function memberToken(b,member,secret,now=Date.now()){
 const p=Buffer.from(JSON.stringify({v:2,b,m:member.memberId,cv:member.credentialVersion,exp:Math.floor(now/1000)+LIFETIME,n:randomBytes(16).toString('hex')})).toString('base64url');return p+'.'+sign(p,secret);
}
export function readMemberSession(cookie,business,secret,now=Date.now()){
 try{const token=(cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token||token.length>768)return null;const [p,s,...rest]=token.split('.'),expected=sign(p,secret);if(rest.length||!s||s.length!==expected.length||!timingSafeEqual(Buffer.from(s),Buffer.from(expected)))return null;const v=JSON.parse(Buffer.from(p,'base64url'));return v.v===2&&v.b===business&&/^[a-f0-9-]{36}$/.test(v.m)&&Number.isSafeInteger(v.cv)&&v.cv>0&&Number.isInteger(v.exp)&&v.exp>Math.floor(now/1000)&&v.exp<=Math.floor(now/1000)+LIFETIME?v:null;}catch{return null;}
}
export const memberCookie=t=>`${COOKIE}=${t}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${t?LIFETIME:0}`;
const identity=r=>({memberId:r.id,pid:r.pid,displayName:r.display_name,credentialVersion:Number(r.credential_version)});
export const publicIdentity=m=>m?{memberId:m.memberId,pid:m.pid,displayName:m.displayName}:null;
export async function loginMember(c,b,password){
 if(typeof password!=='string'||!password.length||password.length>256)return null;
 const candidates=(await c.query('SELECT m.id,m.pid,m.display_name,m.status,a.password_hash,a.credential_version,a.enabled FROM members m JOIN member_credentials a ON (a.business_id,a.member_id)=(m.business_id,m.id) WHERE m.business_id=$1',[b])).rows;
 const matched=[];for(const r of candidates)if(await verifyPassword(password,r.password_hash))matched.push(r);
 if(!candidates.length)await verifyPassword(password,DUMMY);
 const r=matched.length===1?matched[0]:null;return r?.enabled&&r.status==='active'?identity(r):null;
}
export async function resolveMember(c,b,claims){
 if(!claims)return null;
 const r=(await c.query('SELECT m.id,m.pid,m.display_name,m.status,a.credential_version,a.enabled FROM members m JOIN member_credentials a ON (a.business_id,a.member_id)=(m.business_id,m.id) WHERE m.business_id=$1 AND m.id=$2',[b,claims.m])).rows[0];
 return r?.enabled&&r.status==='active'&&Number(r.credential_version)===claims.cv?identity(r):null;
}
export async function authorizeWrite(c,b,claims){
 await c.query('SELECT id FROM businesses WHERE id=$1 FOR UPDATE',[b]);
 const member=await resolveMember(c,b,claims);
 if(!member)throw Object.assign(Error('กรุณาเข้าสู่ระบบด้วย รหัสระบุตัวตน'),{status:401,code:'AUTH_REQUIRED'});
 c.zuriActor=member;return member;
}
