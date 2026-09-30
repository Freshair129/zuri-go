export const VERSION = 1;
export const OFFERS = [{id:'normal',name:'Normal',price:5900,units:1},{id:'destiny',name:'DESTINY',price:5555,units:1},{id:'pair',name:'LUCKY PAIR',price:8888,units:2},{id:'complete',name:'COMPLETE 4',price:15900,units:4}];
export const OBJECTIVES = {inventory:'Inventory clearance',commerce:'Revenue / Commerce',leads:'Lead generation',awareness:'Awareness / Consideration'};
export const PRIMARY = {inventory:['units','Net fulfilled units','units'],commerce:['revenue','Net revenue','บาท'],leads:['sql','Sales-qualified leads','leads'],awareness:['qualifiedVisits','Qualified visits','sessions']};
export const COSTS = ['cogs','packaging','shipping','fees','commission','other'];
export const COLLECTIONS = ['ads','leads','orders','inventory','tasks','decisions','releases','history','reviews','alertActions'];
export const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const num = value => value === '' || value == null ? null : Number(value);
export const validDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
export const dayDiff = (a,b) => validDate(a)&&validDate(b) ? Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000) : null;
export const plusDays = (value,n) => validDate(value)?new Date(Date.parse(value+'T00:00:00Z')+n*86400000).toISOString().slice(0,10):'';
export const ratio = (a,b) => a!=null&&b>0?a/b:null;
export const sum = (rows,key) => rows.reduce((s,r)=>s+(Number(r[key])||0),0);
const refundTo = (order,asOf) => order.refundAt&&order.refundAt<=asOf?order.refund:0;
export const eligibleOrder = (order,asOf=today()) => order.status!=='void' && order.date<=asOf && !(order.cancelledAt&&order.cancelledAt<=asOf) && order.amount>refundTo(order,asOf);
export const netRevenue = (order,asOf=today()) => order.status!=='void'&&order.date<=asOf?order.amount-refundTo(order,asOf):0;
export const netUnits = (order,asOf=today()) => order.status==='void'?0:(order.fulfilledAt&&order.fulfilledAt<=asOf?order.fulfilled:0)-(order.returnedAt&&order.returnedAt<=asOf?order.returned:0);
export const costComplete = order => COSTS.every(key=>order[key]!=null&&Number.isFinite(Number(order[key])));
export function createCampaign(name='MUJEEN M1',objective='inventory',seed=true){
  return {id:uid(),name,objective,currency:'THB',start:'',end:'',owner:'',targets:{low:null,mid:seed&&objective==='inventory'?108:null,high:null},cap:null,committed:null,marginFloor:null,minSample:null,windowDays:null,maxDataAgeDays:null,responseSLA:null,normalLow:null,normalMid:null,normalHigh:null,definition:'',accounting:'',sources:{ads:'',leads:'',orders:'',inventory:''},boms:{pair:'',complete:''},forecast:{normal:null,destiny:null,pair:null,complete:null},version:1,createdAt:new Date().toISOString(),...Object.fromEntries(COLLECTIONS.map(key=>[key,[]]))};
}
export function createWorkspace(){const c=createCampaign();return {schemaVersion:VERSION,selected:c.id,campaigns:[c]};}
export function validateSettings(c){
  const errors=[];
  if(!c.name?.trim()||!OBJECTIVES[c.objective])errors.push('ระบุชื่อและ objective');
  if(c.start&&!validDate(c.start)||c.end&&!validDate(c.end))errors.push('วันที่ไม่ถูกต้อง');
  if(c.start&&c.end&&(c.start>c.end||dayDiff(c.start,c.end)>366))errors.push('ช่วงแคมเปญต้องเรียงวันที่และไม่เกิน 366 วัน');
  for(const key of ['cap','committed','minSample','windowDays','maxDataAgeDays','responseSLA','normalLow','normalMid','normalHigh'])if(c[key]!=null&&(!Number.isFinite(c[key])||c[key]<0))errors.push(`${key} ต้องเป็นค่าที่ไม่ติดลบ`);
  for(const key of ['minSample','windowDays','maxDataAgeDays'])if(c[key]!=null&&(!Number.isInteger(c[key])||(key!=='maxDataAgeDays'&&c[key]<1)))errors.push(`${key} ต้องเป็นจำนวนเต็ม${key!=='maxDataAgeDays'?'มากกว่า 0':''}`);
  if(c.marginFloor!=null&&(!Number.isFinite(c.marginFloor)||c.marginFloor < -100||c.marginFloor>100))errors.push('Margin floor ต้องอยู่ระหว่าง -100 ถึง 100%');
  const t=c.targets;if(!t)errors.push('ไม่มี target set');else {for(const k of ['low','mid','high'])if(t[k]!=null&&(!Number.isFinite(t[k])||t[k]<=0))errors.push('เป้าต้องมากกว่า 0');if(t.low!=null&&t.mid!=null&&t.low>t.mid||t.mid!=null&&t.high!=null&&t.mid>t.high||t.low!=null&&t.high!=null&&t.low>t.high)errors.push('เป้าต้องเรียง Low ≤ Mid ≤ High');}
  const b=[c.normalLow,c.normalMid,c.normalHigh];if(b.some(v=>v!=null&&v>100)||b[0]!=null&&b[1]!=null&&b[0]>=b[1]||b[1]!=null&&b[2]!=null&&b[1]>=b[2])errors.push('Normal CVR ต้องเรียง Low < Mid < High และไม่เกิน 100%');
  for(const v of Object.values(c.sources||{}))if(v&&(!validDate(v)||v>today()))errors.push('Source watermark ไม่ถูกต้องหรืออยู่ในอนาคต');
  for(const value of Object.values(c.boms||{}))if(value&&!parseBom(value))errors.push('BOM ใช้รูปแบบ SKU:จำนวน คั่นด้วย comma');
  return errors;
}
export function parseBom(text){
  if(!text?.trim())return null;
  const rows=text.split(',').map(x=>x.trim().split(':'));
  if(rows.some(r=>r.length!==2||!r[0]||!Number.isInteger(Number(r[1]))||Number(r[1])<=0)||new Set(rows.map(r=>r[0])).size!==rows.length)return null;
  return rows.map(([sku,q])=>({sku,quantity:Number(q)}));
}
export function validateRecord(type,r,c){
  const errors=[];if(!r||typeof r!=='object')return ['Record ไม่ถูกต้อง'];if(typeof r.id!=='string'||!r.id.trim())errors.push('ต้องมี ID');
  if(['ads','leads','orders','inventory'].includes(type)){
    if(!validDate(r.date)||r.date>today())errors.push('ระบุวันที่เกิดจริงที่ไม่อยู่ในอนาคต');
    if(c.start&&r.date<c.start||c.end&&r.date>c.end)errors.push('วันที่ record ต้องอยู่ในช่วงแคมเปญ');
    if(type!=='inventory'&&!OFFERS.some(o=>o.id===r.offer))errors.push('เลือก offer');
    for(const [key,value] of Object.entries(r))if(typeof value==='number'&&(!Number.isFinite(value)||value<0))errors.push(`${key} ต้องเป็นตัวเลขที่ไม่ติดลบ`);
  }
  if(type==='ads'){
    if(!r.channel?.trim())errors.push('ระบุ channel');
    for(const k of ['spend','impressions','clicks','qualifiedVisits'])if(r[k]!=null&&typeof r[k]!=='number')errors.push(`${k} ไม่ถูกต้อง`);
    if(r.spend==null)errors.push('ระบุ spend รวมถึง 0 หากยืนยันว่าไม่ได้ใช้');
    if(r.clicks!=null&&r.impressions!=null&&r.clicks>r.impressions)errors.push('Clicks ต้องไม่เกิน impressions');
    for(const k of ['impressions','clicks','qualifiedVisits'])if(r[k]!=null&&!Number.isInteger(r[k]))errors.push(`${k} ต้องเป็นจำนวนเต็ม`);
  }
  if(type==='leads'){
    if(!r.channel?.trim())errors.push('ระบุ channel');
    for(const key of ['mqlAt','sqlAt'])if(r[key]&&(!validDate(r[key])||r[key]<r.date||r[key]>today()))errors.push('วันที่ qualification ต้องไม่ก่อน lead หรืออยู่ในอนาคต');
    if(r.mqlAt&&r.sqlAt&&r.sqlAt<r.mqlAt)errors.push('SQL ต้องไม่ก่อน MQL');
    if(r.responseMinutes!=null&&(!Number.isFinite(r.responseMinutes)||r.responseMinutes<0))errors.push('Response time ต้องเป็นตัวเลขที่ไม่ติดลบ');
    if(c.orders.some(o=>o.leadId===r.id&&o.date<r.date))errors.push('วันได้ lead ใหม่ต้องไม่หลัง order ที่เชื่อมอยู่');
  }
  if(type==='orders'){
    if(!['paid','fulfilled','cancelled','void'].includes(r.status))errors.push('เลือก order status');
    for(const k of ['amount','refund','units','fulfilled','returned'])if(r[k]==null||!Number.isFinite(r[k]))errors.push(`ระบุ ${k}`);
    if(r.refund>r.amount)errors.push('Refund ต้องไม่เกินยอดหลังส่วนลด');
    if(r.returned>r.fulfilled||r.fulfilled>r.units)errors.push('Units ต้องเป็น ordered ≥ fulfilled ≥ returned');
    if(['units','fulfilled','returned'].some(k=>!Number.isInteger(r[k])))errors.push('จำนวน units ต้องเป็นจำนวนเต็ม');
    for(const [value,key] of [['fulfilled','fulfilledAt'],['returned','returnedAt'],['refund','refundAt']])if(r[value]>0&&(!validDate(r[key])||r[key]<r.date||r[key]>today()))errors.push(`ระบุ ${key} ตามวันที่เกิดจริง`);
    if(r.returnedAt&&(!r.fulfilledAt||r.returnedAt<r.fulfilledAt))errors.push('วันคืนต้องไม่ก่อนส่งมอบ');
    if(r.status==='fulfilled'&&(!r.fulfilledAt||r.fulfilled<=0))errors.push('Fulfilled ต้องมีวันและจำนวนส่งมอบ');
    if(r.status==='cancelled'&&(!validDate(r.cancelledAt)||r.cancelledAt<r.date||r.cancelledAt>today()||r.refund!==r.amount))errors.push('Cancelled ต้องมีวันยกเลิกและคืนยอดชำระครบ');
    if(r.leadId&&!c.leads.some(l=>l.id===r.leadId))errors.push('ไม่พบ Lead ID ที่อ้างถึง');
    if(r.leadId&&c.leads.find(l=>l.id===r.leadId)?.date>r.date)errors.push('Order ต้องไม่ก่อน lead acquisition');
    if(r.newCustomer&&!r.customerId?.trim())errors.push('ลูกค้าใหม่ต้องมี Customer ID');
    for(const k of COSTS)if(r[k]!=null&&(!Number.isFinite(r[k])||r[k]<0))errors.push(`${k} ต้องเป็นจำนวนจริงที่ไม่ติดลบ`);
  }
  if(type==='inventory'){
    if(!r.sku?.trim()||r.sellable==null||r.reserved==null)errors.push('ระบุ SKU, sellable และ reserved');
    if(r.reserved>r.sellable)errors.push('Reserved ต้องไม่เกิน sellable');
    if([r.sellable,r.reserved].some(v=>!Number.isInteger(v)))errors.push('จำนวน stock ต้องเป็นจำนวนเต็ม');
  }
  if(type==='tasks'){
    if(!r.title?.trim())errors.push('ระบุชื่องาน');
    if(!['Backlog','Ready','Doing','Blocked','Review','Done'].includes(r.status))errors.push('สถานะงานไม่ถูกต้อง');
    if(r.status==='Done'&&(!r.evidence?.trim()||!r.acceptance?.trim()))errors.push('ปิดงานต้องมีเกณฑ์รับงานและหลักฐาน');
    if(r.status==='Done'&&(!r.owner?.trim()||!r.due||!r.recheck))errors.push('ปิดงานต้องมี owner, วันส่ง และวันตรวจผล KPI ซ้ำ');
    for(const key of ['due','recheck'])if(r[key]&&!validDate(r[key]))errors.push('วันที่งานไม่ถูกต้อง');
  }
  return errors;
}
export function restoreWorkspace(input){
  if(!input||input.schemaVersion!==VERSION||!Array.isArray(input.campaigns)||!input.campaigns.length||input.campaigns.length>100)throw Error('ไฟล์สำรองไม่ตรง schema ของ Mission Control');
  const ids=new Set();
  for(const c of input.campaigns){
    if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id))throw Error('Campaign ID ซ้ำหรือหายไป');ids.add(c.id);
    if(typeof c.name!=='string'||typeof c.definition!=='string'||typeof c.owner!=='string'||!c.sources||!c.boms||!Number.isInteger(c.version)||c.version<1)throw Error('ข้อมูลตั้งค่าไม่ครบ');
    if(['ads','leads','orders','inventory'].some(k=>typeof c.sources[k]!=='string'))throw Error('Source coverage ไม่ครบ');
    if(validateSettings(c).length)throw Error('Campaign settings ในไฟล์ไม่ถูกต้อง');
    for(const key of COLLECTIONS)if(!Array.isArray(c[key])||c[key].length>10000)throw Error(`ข้อมูล ${key} ไม่ถูกต้องหรือเกินขนาด`);
    for(const type of ['ads','leads','orders','inventory','tasks']){const keys=new Set();for(const r of c[type]){if(keys.has(r.id)||validateRecord(type,r,c).length)throw Error(`${type}: record ไม่ถูกต้องหรือ ID ซ้ำ`);keys.add(r.id);}}
    for(const r of c.releases)if(!OFFERS.some(o=>o.id===r.offer)||!validDate(r.date))throw Error('Release ไม่ถูกต้อง');
    if(c.history.some(h=>!h||typeof h!=='object')||c.decisions.some(d=>!d||!d.id||!validDate(d.date)||typeof d.reason!=='string'||!d.snapshot?.metrics||!d.snapshot?.gate))throw Error('ประวัติไม่ถูกต้อง');
    if(c.reviews.some(r=>!r||!r.id||!validDate(r.date)||typeof r.text!=='string'||!r.snapshot?.metrics||!r.snapshot?.gate))throw Error('Review snapshot ไม่ถูกต้อง');
    if(c.alertActions.some(a=>!a||typeof a.ruleId!=='string'||a.action!=='ack'||typeof a.owner!=='string'))throw Error('Alert action ไม่ถูกต้อง');
  }
  if(!ids.has(input.selected))input.selected=input.campaigns[0].id;
  return input;
}
export function currentPhase(c,asOf=today()){
  return c.releases.filter(r=>r.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)||{offer:'normal',date:c.start};
}
export function stockAt(c,asOf=today()){
  const latest=new Map();for(const r of c.inventory.filter(r=>r.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date)))latest.set(r.sku,r);
  return [...latest.values()].map(r=>({...r,available:r.sellable-r.reserved,overstock:r.target==null?null:Math.max(0,r.sellable-r.reserved-r.target)}));
}
export function capacity(c,offer,asOf=today()){
  const stock=stockAt(c,asOf);if(!stock.length)return null;
  if(['normal','destiny'].includes(offer))return sum(stock,'available');
  const bom=parseBom(c.boms[offer]);if(!bom)return null;
  return Math.min(...bom.map(b=>Math.floor((stock.find(s=>s.sku===b.sku)?.available||0)/b.quantity)));
}
const matches = (r,s,dateKey='date') => (!s.from||r[dateKey]>=s.from)&&(!s.to||r[dateKey]<=s.to)&&(!s.offer||s.offer==='all'||r.offer===s.offer)&&(!s.channel||s.channel==='all'||r.channel===s.channel);
const covered = (c,key,to) => !!c.sources[key]&&!!c.start&&c.sources[key]>=to;
export function measure(c,scope={}){
  const asOf=scope.to||today(),s={...scope,to:asOf};
  const ads=c.ads.filter(r=>matches(r,s));
  const leads=c.leads.filter(r=>matches(r,s));
  const allPaid=c.orders.filter(r=>eligibleOrder(r,asOf));
  const dimensionOrders=c.orders.filter(r=>r.status!=='void'&&matches({...r,date:asOf,channel:r.channel||c.leads.find(l=>l.id===r.leadId)?.channel||'unknown'},{...s,from:null}));
  const inPeriod=date=>date&&(!s.from||date>=s.from)&&date<=asOf;
  const purchaseRows=dimensionOrders.filter(r=>inPeriod(r.date));
  const eventRows=dimensionOrders.filter(r=>['date','refundAt','fulfilledAt','returnedAt'].some(k=>inPeriod(r[k])));
  const orders=purchaseRows.filter(r=>eligibleOrder(r,asOf));
  const hasOrders=eventRows.length>0||covered(c,'orders',asOf),hasAds=ads.length>0||covered(c,'ads',asOf),hasLeads=leads.length>0||covered(c,'leads',asOf);
  const window=c.windowDays;
  const mature=window==null?[]:leads.filter(l=>dayDiff(l.date,asOf)>=window);
  const won=lead=>allPaid.some(o=>o.leadId===lead.id&&o.date>=lead.date&&dayDiff(lead.date,o.date)<=window);
  const converted=mature.filter(won).length;
  const costKnown=hasOrders&&purchaseRows.every(costComplete)&&hasAds&&ads.every(a=>a.spend!=null);
  const revenue=hasOrders?dimensionOrders.reduce((n,o)=>n+(inPeriod(o.date)?o.amount:0)-(inPeriod(o.refundAt)?o.refund:0),0):null;
  const spend=hasAds?sum(ads,'spend'):null;
  const costs=costKnown?purchaseRows.reduce((n,o)=>n+COSTS.reduce((v,k)=>v+o[k],0),0):null;
  const contribution=costKnown?revenue-costs-spend:null;
  const acquisitions=c.leads.filter(l=>(!s.offer||s.offer==='all'||l.offer===s.offer)&&(!s.channel||s.channel==='all'||l.channel===s.channel));
  const mql=acquisitions.filter(l=>l.mqlAt&&(!s.from||l.mqlAt>=s.from)&&l.mqlAt<=asOf).length;
  const sql=acquisitions.filter(l=>l.sqlAt&&(!s.from||l.sqlAt>=s.from)&&l.sqlAt<=asOf).length;
  const replies=leads.filter(l=>l.responseMinutes!=null);
  const slaEligible=c.responseSLA==null?[]:leads.filter(l=>l.responseMinutes!=null||dayDiff(l.date,asOf)>0);
  const newCustomers=new Set(orders.filter(o=>o.newCustomer&&o.customerId).map(o=>o.customerId)).size;
  const countsKnown=key=>hasAds&&ads.every(a=>a[key]!=null)?sum(ads,key):null;
  const impressions=countsKnown('impressions'),clicks=countsKnown('clicks');
  const units=hasOrders?dimensionOrders.reduce((v,o)=>v+(inPeriod(o.fulfilledAt)?o.fulfilled:0)-(inPeriod(o.returnedAt)?o.returned:0),0):null;
  const stageRows=acquisitions.filter(l=>inPeriod(l.mqlAt)||inPeriod(l.sqlAt));
  return {ads,leads,stageRows,orderRows:eventRows,purchaseRows,spend,revenue,costs,contribution,margin:ratio(contribution,revenue),units,orders:hasOrders?orders.length:null,unfulfilled:hasOrders?orders.reduce((v,o)=>v+Math.max(0,o.units-(o.fulfilledAt&&o.fulfilledAt<=asOf?o.fulfilled:0)),0):null,leadCount:hasLeads?leads.length:null,mql:hasLeads||stageRows.length?mql:null,sql:hasLeads||stageRows.length?sql:null,mature:mature.length,pending:window==null?leads.length:leads.length-mature.length,converted,cvr:ratio(converted,mature.length),impressions,clicks,qualifiedVisits:countsKnown('qualifiedVisits'),ctr:ratio(clicks,impressions),cpl:ratio(spend,leads.length),cpo:ratio(spend,orders.length),mediaCAC:ratio(spend,newCustomers),aov:ratio(orders.reduce((v,o)=>v+netRevenue(o,asOf),0),orders.length),upo:ratio(orders.reduce((v,o)=>v+netUnits(o,asOf),0),orders.length),costKnown,qualifiedCPL:ratio(spend,mql),sqlCPL:ratio(spend,sql),responseCoverage:ratio(replies.length,leads.length),sla:ratio(slaEligible.filter(l=>l.responseMinutes!=null&&l.responseMinutes<=c.responseSLA).length,slaEligible.length)};
}
export function targetBand(value,t){if(value==null||t.mid==null)return 'ยังประเมินไม่ได้';if(t.high!=null&&value>=t.high)return 'HIGH';if(value>=t.mid)return 'MID';if(t.low!=null&&value>=t.low)return 'LOW';return t.low==null?'ต่ำกว่า Mid':'ต่ำกว่า Low';}
export function evaluate(c,asOf=today()){
  const phase=currentPhase(c,asOf), all=measure(c,{from:c.start,to:asOf}),m=measure(c,{from:phase.date,to:asOf,offer:phase.offer});
  const hard=[],missing=[],cautions=[];const elapsed=dayDiff(phase.date,asOf),total=dayDiff(c.start,c.end),daysLeft=dayDiff(asOf,c.end);
  const primaryKey=PRIMARY[c.objective][0];const progress=total==null?null:Math.max(0,Math.min(1,(dayDiff(c.start,asOf)+1)/(total+1)));
  const lowToDate=c.targets.low!=null&&progress!=null?c.targets.low*progress:null;
  const midToDate=c.targets.mid!=null&&progress!=null?c.targets.mid*progress:null;
  const highToDate=c.targets.high!=null&&progress!=null?c.targets.high*progress:null;
  if(c.cap!=null&&all.spend!=null&&all.spend+(c.committed||0)>=c.cap)hard.push('งบใช้จริงและภาระที่ยืนยันถึง released cap แล้ว');
  if(c.marginFloor!=null&&all.margin!=null&&all.margin*100<c.marginFloor)hard.push('Contribution margin ต่ำกว่า floor');
  if(c.objective==='inventory'&&capacity(c,phase.offer,asOf)===0)hard.push('Stock ไม่พอสำหรับ offer ปัจจุบัน');
  if(!c.start||!c.end)missing.push('วันเริ่มและวันสิ้นสุด');
  if(c.targets.mid==null||c.targets.low==null)missing.push('Low และ Mid ของ KPI หลัก');
  if(c.cap==null||c.committed==null)missing.push('Released cap และ committed spend');
  if(c.minSample==null||c.windowDays==null&&c.objective!=='awareness')missing.push('ขั้นต่ำตัวอย่าง / conversion window');
  if(c.maxDataAgeDays==null)missing.push('อายุข้อมูลสูงสุดที่ยอมรับ');
  const needed=c.objective==='awareness'?['ads']:c.objective==='leads'?['ads','leads']:['ads','leads','orders'];if(c.objective==='inventory')needed.push('inventory');
  for(const key of needed){const age=dayDiff(c.sources[key],asOf);if(age==null||c.maxDataAgeDays==null||age>c.maxDataAgeDays)missing.push(`ข้อมูล ${key} ครบถึงวัน review`);}
  if(!c.definition.trim())missing.push('นิยาม qualified / MQL / SQL ที่ใช้ในแคมเปญ');
  if(['inventory','commerce'].includes(c.objective)&&!c.accounting?.trim())missing.push('ขอบเขตรายได้ / VAT / ค่าขนส่ง / ต้นทุน');
  if(['inventory','commerce'].includes(c.objective)&&(!all.costKnown||c.marginFloor==null||all.margin==null))missing.push('ต้นทุนจริงครบและ margin floor');
  if(['inventory','commerce'].includes(c.objective)&&all.purchaseRows.some(o=>eligibleOrder(o,asOf)&&(!o.leadId||!c.leads.some(l=>l.id===o.leadId))))missing.push('เชื่อม Order กับ Lead ID ก่อนตัดสิน Lead-to-Sale');
  if(c.objective==='inventory'&&capacity(c,phase.offer,asOf)==null)missing.push('Stock snapshot / BOM ของ offer ปัจจุบัน');
  if(c.objective!=='awareness'&&c.responseSLA==null)missing.push('Response SLA ของทีมขาย');
  const sample=c.objective==='awareness'?(m.impressions||0):m.mature;
  const enough=c.minSample!=null&&sample>=c.minSample;
  const fullWeek=elapsed!=null&&elapsed>=7;
  const below=lowToDate!=null&&all[primaryKey]!=null&&all[primaryKey]<lowToDate;
  let status='ON_TRACK',tone='good',message='ติดตามผลตามแผน และรักษา guardrails';
  if(hard.length){status='BLOCK';tone='bad';message='พักการเพิ่มงบ/เปิด offer และแก้เงื่อนไขที่ติดก่อน';}
  else if(missing.length){status='DATA_HOLD';tone='neutral';message='ยังตัดสิน cutoff ไม่ได้ — เติมข้อกำหนดและข้อมูลที่ค้าง';}
  else if(!fullWeek||!enough){status='LEARNING';tone='warn';message='กำลังเก็บหลักฐาน — review ได้ แต่ยังไม่ฟันธงผลของ offer';}
  else if(['awareness','leads'].includes(c.objective)){if(below){status='FIX';tone='warn';message=c.objective==='leads'?'SQL ต่ำกว่า Low pace — ตรวจ qualification และการติดตาม':'Qualified visits ต่ำกว่า Low pace — ตรวจ traffic และ creative';}}
  else {
    const low=phase.offer==='normal'?c.normalLow:2,mid=phase.offer==='normal'?c.normalMid:5,high=phase.offer==='normal'?c.normalHigh:10;
    if(low!=null&&m.cvr!=null&&m.cvr*100<=low){status='FIX';tone='bad';message='Conversion เข้าเกณฑ์แก้ funnel — หยุดเพิ่มงบ';}
    else if(mid!=null&&m.cvr!=null&&m.cvr*100<mid){status='LEARNING';tone='warn';message='Conversion อยู่ใน Learning zone — ปรับแล้ววัดซ้ำ';}
    else if(high!=null&&m.cvr!=null&&m.cvr*100>=high){status='HIGH';message='ผลเข้า High band — พิจารณาขยายผลหลังตรวจความพร้อม';}
    else if(mid!=null&&m.cvr!=null&&m.cvr*100>=mid){status='BASE';message='ผลเข้า Base band — พิจารณาเพิ่มงบอย่างมีเงื่อนไข';}
    if(below){status='FIX';tone='warn';message='KPI หลักต่ำกว่า Low pace — ตรวจสาเหตุก่อนเลือก offer ถัดไป';}
  }
  if(daysLeft!=null&&daysLeft<7)cautions.push('เหลือเวลาไม่ครบ 7 วันสำหรับการทดสอบใหม่');
  if(m.pending)cautions.push(`${m.pending} leads ยังไม่ครบ conversion window`);
  if(phase.offer==='normal'&&c.normalMid==null)cautions.push('Normal CVR ยังไม่มี cutoff ของตัวเอง; ประเมินจาก KPI pace เท่านั้น');
  if(c.responseSLA!=null&&m.sla!=null&&m.sla<1)cautions.push('มี lead ที่ไม่ผ่าน response SLA — ตรวจ backlog ก่อนเพิ่มงบ');
  const serviceHold=c.objective!=='awareness'&&c.responseSLA!=null&&m.sla!=null&&m.sla<1;
  if(serviceHold&&!hard.length&&!missing.length&&fullWeek&&enough){status='HOLD_SCALE';tone='warn';message='แก้ response SLA ก่อนเพิ่มงบหรือเปิด offer';}
  const ready=!hard.length&&!missing.length&&!serviceHold&&fullWeek&&enough;
  return {phase,all,m,hard,missing,cautions,status,tone,message,elapsed,daysLeft,lowToDate,midToDate,highToDate,primaryKey,below,enough,fullWeek,serviceHold,reviewDate:plusDays(phase.date,7),canRelease:ready&&daysLeft>=7,canScale:ready&&['BASE','HIGH','ON_TRACK'].includes(status),remainingBudget:c.cap!=null&&all.spend!=null&&c.committed!=null?c.cap-all.spend-c.committed:null};
}
export function validateRelease(c,offer,date,decisionId,readiness){
  const errors=[];if(!validDate(date)||date>today()||c.end&&date>c.end)errors.push('วันเปิดจริงต้องไม่อยู่ในอนาคตหรือหลังจบแคมเปญ');
  if(c.releases.some(r=>r.offer===offer))errors.push('Offer นี้มีบันทึกการเปิดแล้ว');
  if(!OFFERS.some(o=>o.id===offer)||offer==='normal')errors.push('เลือกแพ็กเกจที่ยังไม่เปิด');
  const decision=c.decisions.find(d=>d.id===decisionId&&d.action==='release'&&d.offer===offer);
  if(!decision||!decision.owner||!decision.reason)errors.push('ต้องมีคำตัดสิน release ที่มี owner และเหตุผล');
  if(decision&&decision.date>date)errors.push('วันเปิดต้องไม่ก่อนวันตัดสินใจ');
  const gate=evaluate(c,date);if(!gate.canRelease)errors.push('Review gate ยังไม่พร้อมเปิด offer');
  if(!c.releases.length&&offer!=='destiny')errors.push('แพ็กเกจแรกต้องเป็น DESTINY');
  if(!c.releases.length&&!gate.below)errors.push('Normal ยังไม่เข้าเกณฑ์ต่ำกว่า Low pace');
  if(!readiness)errors.push('ยืนยัน creative, ราคา, checkout, ทีม และหลักฐานปัญหา offer');
  if(c.objective==='inventory'&&(capacity(c,offer,date)==null||capacity(c,offer,date)<=0))errors.push('Stock / BOM ของ offer ถัดไปยังไม่พร้อม');
  return errors;
}
export function alertList(c,asOf=today()){
  const g=evaluate(c,asOf),rules=[];
  const add=(id,title,active)=>{if(active){const last=c.alertActions.filter(a=>a.ruleId===id).at(-1);rules.push({id,title,status:last?.action==='ack'?'Acknowledged':'Open',owner:last?.owner||'',note:last?.note||'',lastObserved:asOf});}};
  add('G-01','ข้อมูล/ข้อกำหนดยังไม่ครบ',g.missing.length>0);add('G-02','ยังไม่ครบวันหรือจำนวนตัวอย่าง',!g.fullWeek||!g.enough);
  add('G-07','งบใช้จริงและภาระถึง cap',g.hard.some(x=>x.includes('งบ')));add('G-08','Margin ต่ำกว่า floor',g.hard.some(x=>x.includes('margin')));
  add('G-09','Stock ไม่พอ',g.hard.some(x=>x.includes('Stock')));add('G-10','Response SLA ไม่ผ่าน',g.serviceHold);add('G-11','KPI ต่ำกว่า Low pace',g.below);add('G-12','เวลาทดสอบเหลือน้อยกว่า 7 วัน',g.daysLeft!=null&&g.daysLeft<7);
  return rules;
}
export function settingsSnapshot(c){const {ads,leads,orders,inventory,tasks,decisions,releases,history,reviews,alertActions,...settings}=c;return structuredClone(settings);}
export function evidenceSnapshot(c,asOf=today(),scope={}){return {capturedAt:new Date().toISOString(),asOf,version:c.version,settings:settingsSnapshot(c),scope:{from:c.start,to:asOf,...scope},metrics:measure(c,{from:c.start,to:asOf,...scope}),gate:evaluate(c,asOf),records:structuredClone({ads:c.ads,leads:c.leads,orders:c.orders,inventory:c.inventory,releases:c.releases,tasks:c.tasks})};}
export function trend(c,scope={}){
  if(!c.start||!c.end)return [];
  const days=dayDiff(c.start,c.end);if(days<0||days>366)return [];
  const key=PRIMARY[c.objective][0],asOf=scope.to||today(),rows=[];
  for(let i=0;i<=days;i++){const date=plusDays(c.start,i);if(scope.from&&date<scope.from)continue;const m=date<=asOf?measure(c,{...scope,from:c.start,to:date}):null;
    rows.push({date,actual:m?m[key]:null,Low:c.targets.low==null?null:c.targets.low*(i+1)/(days+1),Mid:c.targets.mid==null?null:c.targets.mid*(i+1)/(days+1),High:c.targets.high==null?null:c.targets.high*(i+1)/(days+1)});
  }return rows;
}
export function summary(c,asOf=today()){
  const g=evaluate(c,asOf),m=g.all;const val=v=>v==null?'รอข้อมูล':Number(v).toLocaleString('th-TH',{maximumFractionDigits:2});
  return `${c.name} · ${asOf}\nPhase: ${OFFERS.find(o=>o.id===g.phase.offer)?.name}\n${PRIMARY[c.objective][1]}: ${val(m[g.primaryKey])} / ${val(c.targets.mid)}\nNet revenue: ${val(m.revenue)} ${c.currency}\nMedia spend: ${val(m.spend)} / ${val(c.cap)} ${c.currency}\nContribution after media: ${val(m.contribution)} ${c.currency}\nReview: ${g.status} — ${g.message}\nข้อค้าง: ${[...g.hard,...g.missing,...g.cautions].join('; ')||'ไม่มีเงื่อนไขค้างที่ตรวจพบ'}\nงานค้าง: ${c.tasks.filter(t=>t.status!=='Done').length}; ปิดแล้ว: ${c.tasks.filter(t=>t.status==='Done').length}\nรอบ review: ${g.reviewDate||'ยังไม่กำหนด'}\nแหล่งข้อมูล: records ที่ผู้ใช้บันทึก; snapshot target version ${c.version}`;
}
