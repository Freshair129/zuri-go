// Viewer of a request (FR-011-003, SDD-011 "Viewer"): Guest, a signed-in Member or the trusted local operator.
// @trace implements FR-011-003
import {resolveMember} from './member-auth.mjs';
import {GUEST} from '../web/src/content/shared/visibility.mjs';
export {GUEST};
export const OPERATOR=Object.freeze({kind:'operator'});
export const session=claims=>({kind:'session',claims:claims||null});
const OPERATOR_VIEWER=Object.freeze({kind:'operator',memberId:null,teamIds:[],admin:false});
export const viewerSettings=v=>({kind:['member','operator'].includes(v?.kind)?v.kind:'guest',member:v?.kind==='member'&&v.memberId?v.memberId:''});
export async function resolveViewer(c,b,principal){
 if(principal?.kind==='operator'){
  // The hosted runtime can only build session principals; refuse before any query.
  if(process.env.VERCEL==='1')throw Object.assign(Error('Operator viewer is local only'),{code:'VIEWER_OPERATOR_HOSTED'});
  return OPERATOR_VIEWER;
 }
 const member=principal?.kind==='session'&&principal.claims?await resolveMember(c,b,principal.claims):null;
 if(!member)return GUEST;
 // Team rows are closed to Guests, so the Member settings go first.
 await c.query("SELECT set_config('zuri_go.viewer_kind','member',true),set_config('zuri_go.viewer_member',$1,true)",[member.memberId]);
 const teamIds=(await c.query('SELECT team_id FROM team_members WHERE business_id=$1 AND member_id=$2 ORDER BY team_id',[b,member.memberId])).rows.map(r=>r.team_id);
 const admin=(await c.query('SELECT is_business_admin FROM members WHERE business_id=$1 AND id=$2',[b,member.memberId])).rows[0]?.is_business_admin===true;
 return Object.freeze({kind:'member',memberId:member.memberId,teamIds,admin,member});
}
