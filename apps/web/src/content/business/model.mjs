export const LIFECYCLE={unconfirmed:'รอยืนยัน',draft:'ฉบับร่าง',queued:'อยู่ในคิว',active:'กำลังรัน',paused:'พักไว้',completed:'จบแล้ว',cancelled:'ยกเลิก'};
export const APPROVAL={draft:'ร่าง',in_review:'รอตรวจ',changes_requested:'รอแก้ไข',approved:'พร้อมลง'};
export const PUBLICATION={draft:'ยังไม่ยืนยัน',scheduled:'รอลง',published:'ลงแล้ว',failed:'ติดขัด',cancelled:'ยกเลิก'};
export const METRICS={followers_net:'ผู้ติดตามเพิ่มสุทธิ',followers_total:'ผู้ติดตามสะสม',leads:'ผู้สนใจใหม่',net_revenue:'รายได้สุทธิ',published_posts:'รายการที่เผยแพร่'};
export const addDays=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
export function localDate(time=new Date(),zone='Asia/Bangkok'){return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time));}
export function periodFor(date,kind='weekly'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('วันที่ไม่ถูกต้อง');
 const d=new Date(date+'T12:00:00Z');
 if(kind==='monthly'){const start=date.slice(0,7)+'-01';d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);return {start,end:d.toISOString().slice(0,10)};}
 const start=addDays(date,-((d.getUTCDay()+6)%7));return {start,end:addDays(start,7)};
}
export function midnight(date,zone='Asia/Bangkok'){
 const wanted=Date.parse(date+'T00:00:00Z');let value=wanted;
 const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 for(let i=0;i<3;i++){const p=Object.fromEntries(formatter.formatToParts(new Date(value)).map(x=>[x.type,x.value]));const rendered=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);value+=wanted-rendered;}
 return new Date(value).toISOString();
}
const num=v=>v==null?null:Number(v);
export function goalProgress(goal,data,asOf=new Date().toISOString()){
 const zone=goal.timezone||data.business.timezone,start=Date.parse(midnight(goal.period_start,zone)),end=Date.parse(midnight(goal.period_end_exclusive,zone)),cutoff=Math.min(Date.parse(asOf),end),target=num(goal.target_value);
 const ids=(data.goal_series||[]).filter(x=>x.goal_id===goal.id).map(x=>x.series_id),series=ids.map(id=>data.metric_series.find(s=>s.id===id)).filter(Boolean),details=[];
 if(goal.metric_code==='published_posts'){
   const accounts=series.map(s=>s.channel_account_id),campaign=goal.campaign_id;
   const rows=data.publications.filter(p=>p.status==='published'&&Date.parse(p.published_at)>=start&&Date.parse(p.published_at)<Math.min(Date.parse(asOf)+1,end)&&accounts.includes(p.channel_account_id)&&(!campaign||data.content_items.find(c=>c.id===p.content_item_id)?.campaign_id===campaign));
   if(series.length)details.push({value:rows.length,stock:null,coverage:'complete',effectiveAt:new Date(cutoff).toISOString(),evidence:rows.map(p=>p.id)});
 }else for(const s of series){
   const rows=(data.metric_observations||[]).filter(o=>o.series_id===s.id&&o.is_current&&Date.parse(o.effective_at)<=cutoff).sort((a,b)=>Date.parse(a.effective_at)-Date.parse(b.effective_at));
   const label=data.channel_accounts.find(a=>a.id===s.channel_account_id)?.display_name||s.source_label;
   if(goal.metric_code==='followers_net'||goal.metric_code==='followers_total'){
     const latest=rows.filter(o=>Date.parse(o.effective_at)>=start).at(-1),baseline=rows.find(o=>Date.parse(o.effective_at)===start),requiresBaseline=goal.metric_code==='followers_net';
     const available=latest&&(!requiresBaseline||baseline);
     details.push({seriesId:s.id,label,value:available?num(latest.value)-(requiresBaseline?num(baseline.value):0):null,stock:latest?num(latest.value):null,effectiveAt:latest?.effective_at||null,evidence:[baseline?.id,latest?.id].filter(Boolean),coverage:!available?'missing':latest.coverage!=='complete'||(requiresBaseline&&baseline.coverage!=='complete')?'partial':cutoff-Date.parse(latest.effective_at)>s.freshness_hours*3600000?'stale':'complete',reason:!baseline&&requiresBaseline?'ยังไม่มียอดต้นรอบ':!latest?'ยังไม่มีผลล่าสุด':null});
   }else{
     const flow=rows.filter(o=>o.period_start&&Date.parse(o.period_start)>=start&&Date.parse(o.effective_at)<=cutoff);
     let cursor=start,complete=true;for(const o of flow){if(Date.parse(o.period_start)!==cursor||o.coverage!=='complete')complete=false;cursor=Date.parse(o.effective_at);}
     const value=flow.length?flow.reduce((a,o)=>a+num(o.value),0):null;
     details.push({seriesId:s.id,label,value,stock:null,effectiveAt:flow.at(-1)?.effective_at||null,evidence:flow.map(o=>o.id),coverage:value===null?'missing':!complete||cursor<cutoff?'partial':'complete',reason:value===null?'ยังไม่มีผลจริง':cursor<cutoff?'ข้อมูลยังไม่ครบถึงเวลาที่เลือก':null});
   }
 }
 const missing=!details.length||details.some(x=>x.value==null),times=new Set(details.map(x=>x.effectiveAt));
 const quality=missing?'missing':details.some(x=>x.coverage==='stale')?'stale':details.some(x=>x.coverage!=='complete')||times.size>1?'partial':'complete';
 const actual=missing?null:details.reduce((a,x)=>a+x.value,0),percent=actual===null?null:actual/target*100;
 const stock=details.length&&details.every(x=>x.stock!==null)?details.reduce((a,x)=>a+x.stock,0):null;
 return {...goal,actual,stock,quality,percent,barPercent:percent===null?0:Math.max(0,Math.min(100,percent)),remaining:actual===null?null:Math.max(0,target-actual),details,asOf:details.map(x=>x.effectiveAt).filter(Boolean).sort()[0]||null,expected:quality==='complete'?target*Math.max(0,Math.min(1,(cutoff-start)/(end-start))):null};
}
export function overview(data,{date=localDate(),kind='weekly',asOf=new Date().toISOString()}={}){
 const zone=data.business.timezone,period=periodFor(date,kind),end=Date.parse(midnight(period.end,zone)),now=Date.parse(asOf),month=date.slice(0,7)+'-01';
 const campaigns=data.campaigns.filter(c=>!c.archived_at),contents=data.content_items.filter(c=>!c.archived_at&&c.planning_month===month);
 const upcoming=data.publications.filter(p=>p.status==='scheduled'&&Date.parse(p.scheduled_at)>=Math.max(now,Date.parse(midnight(period.start,zone)))&&Date.parse(p.scheduled_at)<end).sort((a,b)=>a.scheduled_at.localeCompare(b.scheduled_at));
 const overdue=data.publications.filter(p=>p.status==='scheduled'&&Date.parse(p.scheduled_at)<now);
 const goals=data.goals.filter(g=>g.status!=='archived'&&g.period_start<=date&&g.period_end_exclusive>date).map(g=>goalProgress(g,data,asOf));
 const pending=data.content_items.filter(c=>!c.archived_at&&c.approval_status==='in_review');
 const taskAttention=(data.tasks||[]).filter(t=>!t.archived_at&&t.status!=='done'&&(t.status==='blocked'||(t.due_date&&t.due_date<date)));
 return {period,kind,date,asOf,counts:{active:campaigns.filter(c=>c.lifecycle==='active').length,queued:campaigns.filter(c=>c.lifecycle==='queued').length,unconfirmed:campaigns.filter(c=>c.lifecycle==='unconfirmed').length,scheduled:upcoming.length,scheduledContents:new Set(upcoming.map(p=>p.content_item_id)).size,contentMonth:contents.length,publishedContents:contents.filter(c=>data.publications.some(p=>p.content_item_id===c.id&&p.status==='published')).length},campaigns,contents,upcoming,overdue,goals,pending,taskAttention};
}
export function summaryFacts(view){
 const facts=[{id:'campaigns',text:`กำลังรัน ${view.counts.active} แคมเปญ และอยู่ในคิว ${view.counts.queued} แคมเปญ`,action:'campaigns'}];
 for(const g of view.goals){facts.push({id:'goal:'+g.id,text:g.actual===null?`${g.name}: ${g.details.find(x=>x.reason)?.reason||'ยังไม่มีข้อมูลครบขอบเขต'}`:`${g.name}: ${g.actual.toLocaleString('th-TH')} / ${Number(g.target_value).toLocaleString('th-TH')} ${g.quality!=='complete'?'· ข้อมูลยังไม่ครบหรือไม่สด':'· เหลือ '+g.remaining.toLocaleString('th-TH')+' ถึงเป้า'}`,action:'goals'});}
 if(view.overdue.length)facts.push({id:'overdue',text:`มี ${view.overdue.length} รายการเลยเวลาลง แนะนำตรวจรายการก่อนเพิ่มคิวใหม่`,action:'content'});
 if(view.pending.length)facts.push({id:'approval',text:`มี ${view.pending.length} ชิ้นงานรอตรวจ เพื่อให้พร้อมลงตามแผน`,action:'content'});
 if(view.counts.unconfirmed)facts.push({id:'unconfirmed',text:`ยืนยันสถานะ ${view.counts.unconfirmed} แคมเปญ เพื่อให้ภาพรวมตรงกับงานที่กำลังทำ`,action:'campaigns'});
 if(view.taskAttention.length)facts.push({id:'tasks',text:`มี ${view.taskAttention.length} งานเลยกำหนดหรือติดขัด`,action:'meeting-task-manager'});
 return facts;
}
export function validateSummarySelection(value,facts){
 if(!Array.isArray(value?.factIds)||value.factIds.length>3||!value.factIds.length||new Set(value.factIds).size!==value.factIds.length||value.factIds.some(id=>!facts.some(f=>f.id===id)))throw Error('AI อ้างอิงข้อมูลที่ไม่มีในชุดหลักฐาน');
 return value.factIds.map(id=>facts.find(f=>f.id===id));
}
