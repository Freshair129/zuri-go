// @trace verifies AC-015-001-01, AC-015-001-02, AC-015-002-04 — configured local PostgreSQL only.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {config} from '../config.mjs';
import {pool,transaction} from '../db.mjs';
import {OPERATOR} from '../viewer.mjs';
import {createCampaign} from '../../web/src/content/shared/model.mjs';
import {canonicalHash,readMarketingReportSource,previewMarketingReport} from '../marketing-report.mjs';

const configured=config().databaseUrl;
const local=configured&&['localhost','127.0.0.1','[::1]'].includes(new URL(configured).hostname)&&process.env.VERCEL!=='1';
after(()=>pool.end());

test('real repeatable-read snapshot stays scoped and preview leaves rows unchanged; all synthetic data rolls back',{skip:local?false:'NOT_RUN: configured local PostgreSQL required'},async()=>{
 const b=randomUUID(),id=randomUUID(),rollback=Error('synthetic QA rollback');
 await assert.rejects(transaction(b,OPERATOR,async c=>{
  assert.equal((await c.query('SHOW transaction_isolation')).rows[0].transaction_isolation,'repeatable read');
  await c.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[b,'QA ONLY · marketing preview',b]);
  await c.query("INSERT INTO campaigns(business_id,id,code,name,objective) VALUES($1,$2,'CAM-0001','QA ONLY','leads')",[b,id]);
  const state=createCampaign('QA ONLY','leads',false),hash=canonicalHash(state);
  await c.query('INSERT INTO campaign_states(business_id,campaign_id,state_json,payload_hash) VALUES($1,$2,$3,$4)',[b,id,state,hash]);
  const before=await readMarketingReportSource(c,b,id);
  const p=previewMarketingReport(before,{start:'2026-09-21',endExclusive:'2026-09-28',timezone:'Asia/Bangkok',asOf:'2026-09-28T00:00:00+07:00'});
  assert.equal(p.sourceRevision.statePayloadHash,hash);assert.equal(p.campaign.sourceCampaignId,id);assert.equal(p.readiness,'HELD');
  assert.deepEqual(await readMarketingReportSource(c,b,id),before);
  await assert.rejects(readMarketingReportSource(c,randomUUID(),id),e=>e.status===404);
  const events=(await c.query('SELECT count(*)::int AS n FROM change_events WHERE business_id=$1',[b])).rows[0].n;assert.equal(events,0);
  throw rollback;
 }),e=>e===rollback);
});
