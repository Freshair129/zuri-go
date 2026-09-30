import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {memberToken,memberCookie,readMemberSession,loginMember,resolveMember} from '../member-auth.mjs';
import {provisionMembers} from '../provision-members.mjs';
import {pool,transaction} from '../db.mjs';
import {config} from '../config.mjs';
const secret='isolated-member-test-key-at-least-32-bytes',b=randomUUID(),m={memberId:randomUUID(),credentialVersion:1};
after(()=>pool.end());
test('member session is versioned, signed, bounded and distinct from team cookie',()=>{
 const now=1700000000000,t=memberToken(b,m,secret,now),cookie=memberCookie(t),claims=readMemberSession(cookie,b,secret,now);
 assert.equal(claims.m,m.memberId);assert.equal(claims.cv,1);assert.equal(claims.v,2);assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);
 for(const [c,business,key,time] of [[memberCookie(t+'x'),b,secret,now],[cookie,randomUUID(),secret,now],[cookie,b,'wrong',now],[cookie,b,secret,now+43200000],[cookie,b,secret,now-1000],['__Host-zuri-go-team='+t,b,secret,now]])assert.equal(readMemberSession(c,business,key,time),null);
 assert.equal(readMemberSession(memberCookie(''),b,secret,now),null);
});
test('PID creation is unique and immutable; operator provisioning is idempotent and reset revokes sessions',async()=>{
 await transaction(b,c=>c.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[b,'QA ONLY member provisioning',b]));
 const make=async name=>transaction(b,async c=>(await c.query('INSERT INTO members(business_id,display_name) VALUES($1,$2) RETURNING *',[b,name])).rows[0]);
 const a=await make('QA A'),d=await make('QA B');assert.notEqual(a.pid,d.pid);
 const contenders=await Promise.allSettled([make('QA concurrent 1'),make('QA concurrent 2')]);
 for(const r of contenders)if(r.status==='rejected')assert.equal(r.reason.code,'40001');
 const rows=(await transaction(b,c=>c.query('SELECT id,pid FROM members WHERE business_id=$1',[b]))).rows;assert.equal(new Set(rows.map(x=>x.pid)).size,rows.length);
 await transaction(b,c=>c.query("UPDATE members SET display_name='QA renamed' WHERE id=$1",[a.id]));assert.equal((await transaction(b,c=>c.query('SELECT pid FROM members WHERE id=$1',[a.id]))).rows[0].pid,a.pid);
 const cfg={...config(),businessId:b},folder=await mkdtemp(new URL('../../../.local/qa-members-',import.meta.url));
 const first=await provisionMembers(cfg,folder),again=await provisionMembers(cfg,folder);assert.equal(first.length,rows.length);assert.ok(again.every(x=>!x.created));
 const files=await Promise.all(first.map(x=>readFile(x.path,'utf8').then(JSON.parse)));assert.equal(new Set(files.map(x=>x.password)).size,files.length);assert.ok(files.every(x=>x.password.length===24));
 const initial=files.find(x=>x.memberId===a.id),login=await transaction(b,c=>loginMember(c,b,initial.password));assert.equal(login.memberId,a.id);
 const claims=readMemberSession(memberCookie(memberToken(b,login,secret)),b,secret);
 await provisionMembers(cfg,folder,{resetPid:a.pid});const updated=JSON.parse(await readFile(initial.pid?resolve(folder,initial.pid+'.json'):'','utf8'));assert.notEqual(updated.password,initial.password);
 assert.equal(await transaction(b,c=>resolveMember(c,b,claims)),null);assert.equal(await transaction(b,c=>loginMember(c,b,initial.password)),null);
 await provisionMembers(cfg,folder,{disablePid:a.pid});assert.equal(await transaction(b,c=>loginMember(c,b,updated.password)),null);
 await provisionMembers(cfg,folder,{enablePid:a.pid});assert.ok(await transaction(b,c=>loginMember(c,b,updated.password)));
 await transaction(b,c=>c.query("UPDATE members SET status='inactive' WHERE id=$1",[a.id]));assert.equal(await transaction(b,c=>loginMember(c,b,updated.password)),null);
});

test('single code rejects ambiguity even with a disabled duplicate and validates input',async()=>{
 const {passwordHash}=await import('../team-auth.mjs'),code='isolated-identity-code';
 const a={id:randomUUID(),pid:'QA-1',display_name:'QA A',status:'active',enabled:true,credential_version:1,password_hash:await passwordHash(code)};
 const d={...a,id:randomUUID(),pid:'QA-2',password_hash:await passwordHash(code)};
 let rows=[a];const c={query:async(sql,args)=>{assert.deepEqual(args,[b]);return {rows};}};
 assert.equal((await loginMember(c,b,code)).memberId,a.id);
 for(const disabled of [false,true]){rows=[a,{...d,enabled:!disabled}];assert.equal(await loginMember(c,b,code),null);rows.reverse();assert.equal(await loginMember(c,b,code),null);}
 rows=[{...a,status:'inactive'}];assert.equal(await loginMember(c,b,code),null);
 rows=[a];assert.equal(await loginMember(c,b,'wrong-code'),null);
 const neverQuery={query:()=>assert.fail('invalid inputs must not query credentials')};
 for(const value of [undefined,null,42,{},[], '', 'x'.repeat(257)])assert.equal(await loginMember(neverQuery,b,value),null);
 rows=[];assert.equal(await loginMember(c,b,code),null);
});
