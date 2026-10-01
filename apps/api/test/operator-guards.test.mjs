// Operator-script guards (PLAN-003 R3, gate G1): deploy always stages, promote needs a project deployment URL, migrate refuses a non-local target without --cloud.
// Pure functions only: no database, network or Vercel call.
import test from 'node:test';
import assert from 'node:assert/strict';
import {deployCommand,promoteCommand,promoteUrlProblem,deploymentUrl} from '../../../scripts/run.mjs';
import {localTargetProblem,localConfigHosts,cloudTarget} from '../migrate.mjs';
const staged='https://zuri-metrics-abc123xyz-pornpons-projects.vercel.app';

test('deploy always stages with --skip-domain on the pinned CLI, project scope and package directory',()=>{
 const c=deployCommand();
 for(const part of ['vercel@61.1.0','deploy','--prod','--skip-domain','--yes','--scope pornpons-projects','--cwd ./build/vercel'])assert.ok(c.includes(part),part);
 assert.ok(!c.includes('promote'));
});
test('promote builds the exact command for a matching deployment URL',()=>{
 assert.equal(promoteUrlProblem(staged),null);
 assert.equal(promoteCommand(staged),`npx --yes vercel@61.1.0 promote ${staged} --yes --scope pornpons-projects --cwd ./build/vercel`);
});
test('promote refuses a missing URL and every URL outside https://zuri-metrics-*-pornpons-projects.vercel.app',()=>{
 for(const bad of [undefined,'',null])assert.match(promoteUrlProblem(bad),/needs the staged deployment URL/);
 for(const bad of ['https://zuri-metrics-map.vercel.app','http://zuri-metrics-abc-pornpons-projects.vercel.app','https://other-abc-pornpons-projects.vercel.app','https://zuri-metrics--pornpons-projects.vercel.app','https://zuri-metrics-abc-pornpons-projects.vercel.app/path','https://zuri-metrics-abc-pornpons-projects.vercel.app.evil.com','https://evil.com/https://zuri-metrics-abc-pornpons-projects.vercel.app','https://zuri-metrics-a.b-pornpons-projects.vercel.app','https://zuri-metrics-abc-pornpons-projects.vercel.app; rm -rf /']){
  assert.match(promoteUrlProblem(bad),/Refusing to promote/,bad);assert.throws(()=>promoteCommand(bad),/Refusing to promote/,bad);
 }
 assert.throws(()=>promoteCommand(undefined),/needs the staged deployment URL/);
});
test('the staged deployment URL is read from the Vercel output',()=>{
 assert.equal(deploymentUrl(`Vercel CLI 61.1.0\n${staged}\n`),staged);
 assert.equal(deploymentUrl('no url here'),null);
});

test('migrate without --cloud allows local hosts and refuses everything else, without a connection',()=>{
 for(const ok of ['postgres://u:p@127.0.0.1:5432/zuri_go','postgres://u:p@localhost/zuri_go','postgres://u:p@[::1]:5432/zuri_go'])assert.equal(localTargetProblem(ok),null,ok);
 for(const bad of ['postgres://u:p@ep-cool-1.ap-southeast-1.aws.neon.tech/neondb?sslmode=require','postgres://u:p@db.example.com/zuri_go','postgres://u:p@10.0.0.5/zuri_go','postgres://u:p@127.0.0.1.evil.com/zuri_go','not a url',''])assert.match(localTargetProblem(bad),/not a local host|not a valid/,bad);
});
test('a Docker host name named by the local config counts as local; a dotted name from it does not',()=>{
 const cfg={adminUrl:'postgres://u:p@zuri-postgres:5432/zuri_go',databaseUrl:'postgres://u:p@prod.neon.tech/zuri_go'};
 assert.deepEqual(localConfigHosts(cfg),['zuri-postgres']);
 assert.equal(localTargetProblem('postgres://u:p@zuri-postgres/zuri_go',localConfigHosts(cfg)),null);
 assert.match(localTargetProblem('postgres://u:p@zuri-postgres/zuri_go',[]),/not a local host/);
 assert.match(localTargetProblem('postgres://u:p@prod.neon.tech/zuri_go',localConfigHosts(cfg)),/not a local host/);
 assert.deepEqual(localConfigHosts(undefined),[]);
});
test('migrate --cloud names only the last two host labels and the database',()=>{
 const t=cloudTarget('postgres://u:secret@ep-cool-1.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
 assert.deepEqual(t,{domain:'neon.tech',database:'neondb'});
 assert.ok(!JSON.stringify(t).includes('secret')&&!JSON.stringify(t).includes('ep-cool'));
 assert.throws(()=>cloudTarget('nope'),/not a valid connection URL/);
});
