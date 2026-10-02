import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {hostedEmarSource} from '../../../../../scripts/run.mjs';

const meeting=await readFile(new URL('./MeetingWorkspace.jsx',import.meta.url),'utf8');
const metrics=await readFile(new URL('../../../../metrics/index.html',import.meta.url),'utf8');
const origins=[
  ['http://127.0.0.1:4319',true],
  ['http://localhost:4319',false],
  ['http://127.0.0.1:4321',false],
  ['https://127.0.0.1:4319',false],
  ['http://192.168.1.10:4319',false],
  ['https://zuri-go.example',false],
];
const noRequest=()=>assert.fail('Launcher must not request another service');
const decodeScripts=html=>html+'\n'+[...html.matchAll(/data:text\/javascript;charset=utf-8;base64,([^"\s]+)/g)].map(match=>Buffer.from(match[1],'base64').toString('utf8')).join('\n');

test('Meeting workspace has a passive, fixed Emar link behind the exact local origin gate',()=>{
  assert.ok(meeting.includes("window.location.origin==='http://127.0.0.1:4319'"));
  assert.ok(meeting.includes('<nav className="mt-domain" aria-label="บริการ / Services"><span>บริการ / Services</span><a href="http://localhost:8788/" target="_blank" rel="noopener noreferrer">Emar (local)</a></nav>'));
  const gate=meeting.match(/\{(typeof window[^{}]*?)&&<nav className="mt-domain" aria-label="บริการ \/ Services"/)?.[1];
  assert.ok(gate);
  assert.equal(runInNewContext(gate,{}),false,'No browser window');
  for(const [origin,visible] of origins){
    assert.equal(runInNewContext(gate,{window:{location:{origin}},fetch:noRequest,XMLHttpRequest:noRequest}),visible,origin);
  }
  const launcher=meeting.match(/<nav className="mt-domain" aria-label="บริการ \/ Services">[\s\S]*?<\/nav>/)?.[0];
  assert.doesNotMatch(launcher,/\bon[A-Z]|\b(?:fetch|XMLHttpRequest|sendBeacon)\b/);
  assert.equal((launcher.match(/<a /g)||[]).length,1);
});

test('Metrics Services launcher is visible only on the exact local origin',()=>{
  const launcher=metrics.match(/<nav class="services-nav" id="services-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  const gate=metrics.match(/<script id="services-origin-gate">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(launcher?.includes('hidden'));
  assert.match(launcher, /href="http:\/\/localhost:8788\/" target="_blank" rel="noopener noreferrer"/);
  assert.ok(gate);

  for(const [origin,visible] of origins){
    const services={hidden:true};
    runInNewContext(gate,{document:{getElementById:id=>id==='services-nav'?services:null},location:{origin},fetch:noRequest,XMLHttpRequest:noRequest,navigator:{sendBeacon:noRequest}});
    assert.equal(services.hidden,!visible,origin);
  }
  assert.doesNotMatch(gate,/\b(?:fetch|XMLHttpRequest|open)\s*\(/);
});

test('Served local app and Metrics retain one Emar launcher each',async()=>{
  for(const path of ['index.html','metrics/index.html']){
    const html=decodeScripts(await readFile(new URL(`../../../../../build/site/${path}`,import.meta.url),'utf8'));
    assert.equal((html.match(/localhost:8788/g)||[]).length,1,path);
    assert.ok(html.includes('http://127.0.0.1:4319'),path);
    assert.ok(html.includes('Emar (local)'),path);
  }
});

test('Hosted and Vercel HTML plus encoded scripts contain no Emar launcher or origin gate',async()=>{
  for(const root of ['build/hosted-site','build/vercel/public']){
    for(const path of ['index.html','metrics/index.html']){
      const html=decodeScripts(await readFile(new URL(`../../../../../${root}/${path}`,import.meta.url),'utf8'));
      assert.ok(!/localhost:8788|Emar \(local\)|http:\/\/127\.0\.0\.1:4319|services-origin-gate|emar-local-launcher/.test(html),`${root}/${path}`);
    }
  }
});

test('Local and hosted verified builds preserve snapshot, app identity and protected runtime',async()=>{
  const load=async root=>JSON.parse(await readFile(new URL(`../../../../../${root}/data-app-build.json`,import.meta.url),'utf8'));
  const local=await load('build/site'),hosted=await load('build/hosted-site');
  assert.deepEqual(hosted.snapshot,local.snapshot);
  assert.equal(hosted.runtimeSha256,local.runtimeSha256);
  assert.notEqual(hosted.html.sha256,local.html.sha256);
  const localHtml=await readFile(new URL('../../../../../build/site/index.html',import.meta.url),'utf8');
  const hostedHtml=await readFile(new URL('../../../../../build/hosted-site/index.html',import.meta.url),'utf8');
  assert.equal(hostedHtml.match(/<meta name="data-app-local-thread"[^>]+>/)?.[0],localHtml.match(/<meta name="data-app-local-thread"[^>]+>/)?.[0]);
});

test('Hosted authored projection omits only the marked launcher and fails on marker drift',()=>{
  const projected=hostedEmarSource(meeting);
  const start=meeting.indexOf('{/* BEGIN LOCAL: emar-launcher */}'),end=meeting.indexOf('{/* END LOCAL: emar-launcher */}')+'{/* END LOCAL: emar-launcher */}'.length;
  assert.equal(projected,meeting.slice(0,start)+meeting.slice(end));
  assert.ok(!projected.includes('localhost:8788'));
  for(const source of [meeting.replace('BEGIN LOCAL','MISSING'),meeting+meeting,meeting.replace('END LOCAL','MISSING')]){
    assert.throws(()=>hostedEmarSource(source),/Expected one marked/);
  }
});
