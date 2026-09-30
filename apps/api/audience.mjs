// Application-side audience filter (SDD-011); row-level security enforces the same audiences a second time.
// @trace implements FR-011-004, FR-011-005, FR-011-006, FR-011-007, FR-011-008
import {canRead,GUEST} from '../web/src/content/shared/visibility.mjs';
const collect=(rows,key)=>{const map=new Map();for(const r of rows){if(!map.has(r[key]))map.set(r[key],[]);map.get(r[key]).push(r.member_id);}return map;};
export const viewerOf=c=>c.zuriViewer||GUEST;
// People named on each task: R, A, C, I and explicit viewers.
export async function taskNames(c,b){return collect([...(await c.query('SELECT task_id,member_id FROM task_roles WHERE business_id=$1',[b])).rows,...(await c.query('SELECT task_id,member_id FROM task_viewers WHERE business_id=$1',[b])).rows],'task_id');}
export async function meetingNames(c,b){return collect((await c.query('SELECT meeting_id,member_id FROM meeting_participants WHERE business_id=$1',[b])).rows,'meeting_id');}
export const readable=(viewer,rows,names)=>rows.filter(r=>canRead(viewer,r,names.get(r.id)||[]));
