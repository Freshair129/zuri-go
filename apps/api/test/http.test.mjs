import test from 'node:test';
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
const rawStatus=(path,headers)=>new Promise((resolve,reject)=>{const req=httpRequest(path,{headers},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});
// Read-only probes against the running user server. Rejected mutations cannot reach a Business.
const root='http://127.0.0.1:4319';
test('same-origin local API is available and cross-origin requests fail closed',async()=>{
 const ok=await fetch(root+'/api/zuri-go/v1/bootstrap');assert.equal(ok.status,200);assert.equal((await ok.json()).storage,'postgresql-local');
 for(const headers of [{Origin:'https://example.com'},{Host:'evil.example:4319'},{'Sec-Fetch-Site':'cross-site'}])assert.equal(await rawStatus(root+'/api/zuri-go/v1/bootstrap',headers),403,JSON.stringify(headers));
 const bad=await fetch(root+'/api/zuri-go/v1/businesses/00000000-0000-4000-a000-000000000000/members',{method:'POST',headers:{'Content-Type':'application/json','X-Zuri-Go':'1'},body:'{"display_name":"must never be saved"}'});assert.equal(bad.status,403);
});
test('static site serves guide and graph without exposing private files',async()=>{
 assert.equal((await fetch(root+'/')).status,200);const guide=await fetch(root+'/metrics/');assert.equal(guide.status,200);assert.match(await guide.text(),/Zuri-Go — Marketing Metrics Map/);
 for(const path of ['/projects/zuri-go/.local/config.json','/.local/config.json','/api/zuri-go/v1/bootstrap/extra'])assert.ok([403,404].includes((await fetch(root+path)).status));
});

import {Readable} from 'node:stream';
import {body} from '../http.mjs';
test('Thai JSON survives arbitrary HTTP byte chunk boundaries',async()=>{const value={text:'ประชุม อาหวัง Zuri-Go'},bytes=Buffer.from(JSON.stringify(value));assert.deepEqual(await body(Readable.from([...bytes].map(x=>Buffer.from([x])))),value);await assert.rejects(body(Readable.from(['not JSON'])),e=>e.status===400);});
