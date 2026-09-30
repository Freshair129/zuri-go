// Synthetic browser-verification workspace. Never uses the configured user Business ID.
import {randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {transaction,pool} from '../db.mjs';
import {save,snapshot,observe} from '../service.mjs';
import {saveLegacy} from '../workspace.mjs';
import {empty,seedWorkspace} from '../../web/src/content/meeting/model.mjs';
import {localDate,periodFor,midnight} from '../../web/src/content/business/model.mjs';
const b=randomUUID(),date=localDate(),week=periodFor(date),month=periodFor(date,'monthly');
try{await transaction(b,async c=>{
 await c.query('INSERT INTO businesses(id,name,slug) VALUES($1,$2,$3)',[b,'ข้อมูลตัวอย่าง · Zuri-Go QA',b]);
 const domain=empty();seedWorkspace(domain,JSON.parse(await readFile(new URL('../../web/src/content/meeting/seed.json',import.meta.url),'utf8')));await saveLegacy(c,b,{version:0,meetingTaskManager:domain});
 const a=await save(c,b,'channels',{platform:'facebook',display_name:'QA · Facebook'}),t=await save(c,b,'channels',{platform:'tiktok',display_name:'QA · TikTok'});
 const owner=(await snapshot(c,b)).members[0].id;
 const campaign=await save(c,b,'campaigns',{name:'เปิดตัวคอลเลกชัน · ข้อมูลตัวอย่าง',objective:'commerce',lifecycle:'active',planned_start:month.start,planned_end:date,owner_member_id:owner,channel_ids:[a.id,t.id]});
 await save(c,b,'campaigns',{name:'เพื่อนใหม่ 500 · ข้อมูลตัวอย่าง',objective:'awareness',lifecycle:'active',channel_ids:[a.id]});
 await save(c,b,'campaigns',{name:'ของขวัญเดือนหน้า · ข้อมูลตัวอย่าง',objective:'commerce',lifecycle:'queued',planned_start:month.end,channel_ids:[a.id,t.id]});
 const content=await save(c,b,'content',{title:'ไอเดียของขวัญที่เลือกให้กัน',description:'ข้อมูลตัวอย่างสำหรับตรวจหน้าจอเท่านั้น',planning_month:month.start,campaign_id:campaign.id,owner_member_id:owner,format:'carousel',approval_status:'approved'});
 await save(c,b,'content',{title:'เบื้องหลังหนึ่งชิ้นงาน',planning_month:month.start,approval_status:'in_review',format:'video'});
 for(let i=0;i<3;i++)await save(c,b,'publications',{content_item_id:content.id,channel_account_id:i===1?t.id:a.id,status:'scheduled',scheduled_at:new Date(Date.now()+(i+1)*3600000).toISOString(),idempotency_key:randomUUID()});
 const series=(await snapshot(c,b)).metric_series.find(s=>s.channel_account_id===a.id&&s.metric_code==='followers_total');
 for(const [kind,p,target] of [['weekly',week,500],['monthly',month,2000]])await save(c,b,'goals',{name:kind==='weekly'?'ผู้ติดตามเพิ่มสุทธิในสัปดาห์':'ผู้ติดตามเพิ่มสุทธิเดือนนี้',metric_code:'followers_net',period_kind:kind,period_start:p.start,period_end_exclusive:p.end,target_value:target,series_ids:[series.id],owner_member_id:owner});
 await observe(c,b,{series_id:series.id,effective_at:midnight(month.start),value:700,source_ref:'QA synthetic month baseline'});
 if(week.start!==month.start)await observe(c,b,{series_id:series.id,effective_at:midnight(week.start),value:1000,source_ref:'QA synthetic week baseline'});
 await observe(c,b,{series_id:series.id,effective_at:new Date().toISOString(),value:1320,source_ref:'QA synthetic latest snapshot'});
 });await writeFile(new URL('../../../.local/ui-business.json',import.meta.url),JSON.stringify({businessId:b}));console.log('Created separate synthetic QA Business:',b);
}finally{await pool.end();}
