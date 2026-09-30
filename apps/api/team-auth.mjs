import {createHmac,randomBytes,scrypt as derive,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive),COOKIE='__Host-zuri-go-team',LIFETIME=12*60*60;
const equal=(a,b)=>a.length===b.length&&timingSafeEqual(a,b);
export async function passwordHash(password){const salt=randomBytes(16).toString('hex');return salt+':'+(await scrypt(password,salt,64)).toString('hex');}
export async function verifyPassword(password,encoded){
 if(typeof password!=='string'||password.length>256||!/^\w{32}:[a-f0-9]{128}$/.test(encoded||''))return false;
 const [salt,expected]=encoded.split(':');return equal(await scrypt(password,salt,64),Buffer.from(expected,'hex'));
}
const sign=(payload,secret)=>createHmac('sha256',secret).update(payload).digest('base64url');
export function sessionToken(businessId,secret,now=Date.now()){
 const payload=Buffer.from(JSON.stringify({b:businessId,exp:Math.floor(now/1000)+LIFETIME,n:randomBytes(16).toString('hex')})).toString('base64url');return payload+'.'+sign(payload,secret);
}
export function validSession(cookie,businessId,secret,now=Date.now()){
 try{const token=(cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token||token.length>512)return false;const parts=token.split('.');if(parts.length!==2||!equal(Buffer.from(parts[1]),Buffer.from(sign(parts[0],secret))))return false;const value=JSON.parse(Buffer.from(parts[0],'base64url'));return value.b===businessId&&Number.isInteger(value.exp)&&value.exp>Math.floor(now/1000)&&value.exp<=Math.floor(now/1000)+LIFETIME;}catch{return false;}
}
export const sessionCookie=token=>`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${token?LIFETIME:0}`;
export function cloudOriginAllowed(req,origins){
 const host=req.headers.host,origin=req.headers.origin;if(!origins.includes('https://'+host)||req.headers['sec-fetch-site']==='cross-site')return false;
 return req.method==='GET'?(!origin||origin==='https://'+host):origin==='https://'+host;
}
export async function consumeLoginAttempt(client,businessId,ip,secret){
 const digest=createHmac('sha256',secret).update(ip||'unknown').digest('hex');
 // Fixed buckets cap row growth and avoid storing IP addresses.
 const buckets=[['global',400],['ip-'+parseInt(digest.slice(0,4),16)%1024,20]];
 let allowed=true;
 for(const [bucket,limit] of buckets){const row=(await client.query(`INSERT INTO team_login_limits(business_id,bucket,attempts,resets_at) VALUES($1,$2,1,now()+interval '15 minutes') ON CONFLICT(business_id,bucket) DO UPDATE SET attempts=CASE WHEN team_login_limits.resets_at<=now() THEN 1 ELSE team_login_limits.attempts+1 END,resets_at=CASE WHEN team_login_limits.resets_at<=now() THEN now()+interval '15 minutes' ELSE team_login_limits.resets_at END RETURNING attempts`,[businessId,bucket])).rows[0];allowed=allowed&&row.attempts<=limit;}
 return allowed;
}
