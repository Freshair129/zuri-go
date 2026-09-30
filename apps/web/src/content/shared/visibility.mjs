// Audience rules of FEAT-011 (SDD-011 "Audience rule"), shared by the API and the UI.
// @trace implements FR-011-004, FR-011-006, FR-011-007, FR-011-011
export const LEVELS = ['restricted','team','business','public'];
export const DEFAULT_VISIBILITY = 'business';
export const VIEWER_KINDS = ['guest','member','operator'];
const breadth = level => LEVELS.indexOf(level);
const teamOf = item => item?.teamId ?? item?.team_id ?? null;
const levelOf = item => item?.visibility || DEFAULT_VISIBILITY;
export const validLevel = level => LEVELS.includes(level);
export const GUEST = Object.freeze({kind:'guest',memberId:null,teamIds:[],admin:false});

// named: IDs of the people named on the item (task: R, A, C, I and viewers; meeting: participants).
export function canRead(viewer, item, named = []) {
  const kind = viewer?.kind || 'guest', level = levelOf(item);
  if (kind === 'operator' || level === 'public') return true;
  if (kind !== 'member' || !viewer.memberId) return false;
  if (level === 'business') return true;
  const isNamed = named.includes(viewer.memberId);
  if (level === 'team') return isNamed || (viewer.teamIds || []).includes(teamOf(item));
  return level === 'restricted' && isNamed;
}

// before is null for a new item. Returns {ok:true} or {error}.
export function visibilityChange(viewer, before, after, {accountableId = null, organizerId = null, reason = '', named = []} = {}) {
  const level = levelOf(after), team = teamOf(after);
  if (!validLevel(level)) return {error:'LEVEL_INVALID'};
  if (level === 'team' && !team) return {error:'TEAM_REQUIRED'};
  if (level === 'restricted' && !named.length) return {error:'NAMED_REQUIRED'};
  if (before) {
    const from = levelOf(before), widening = breadth(level) > breadth(from) || (from === 'team' && level === 'team' && teamOf(before) !== team);
    if (widening) {
      const owner = accountableId || organizerId;
      if (viewer?.kind !== 'operator' && !(viewer?.memberId && viewer.memberId === owner)) return {error:'WIDEN_DENIED'};
      if (!String(reason || '').trim()) return {error:'REASON_REQUIRED'};
    }
  }
  if (!canRead(viewer, after, named)) return {error:'SELF_EXCLUDED'};
  return {ok:true};
}
