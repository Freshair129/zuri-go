// Audience rules of FEAT-011 (SDD-011 "Audience rule"), shared by the API and the UI.
// @trace implements FR-011-004, FR-011-006, FR-011-007, FR-011-009, FR-011-011
export const LEVELS = ['restricted','team','business','public'];
export const DEFAULT_VISIBILITY = 'business';
export const VIEWER_KINDS = ['guest','member','operator'];
const teamOf = item => item?.teamId ?? item?.team_id ?? null;
const levelOf = item => item?.visibility || DEFAULT_VISIBILITY;
export const validLevel = level => LEVELS.includes(level);
export const GUEST = Object.freeze({kind:'guest',memberId:null,teamIds:[],admin:false});

// named: IDs of the people named on the item (task: R, A, C, I and viewers; meeting: participants).
export function canRead(viewer, item, named = []) {
  return ['guest','member','operator'].includes(viewer?.kind || 'guest');
}

// before is null for a new item. Returns {ok:true} or {error}.
export function visibilityChange(viewer, before, after, {accountableId = null, organizerId = null, reason = '', named = []} = {}) {
  const level = levelOf(after), team = teamOf(after);
  if (!validLevel(level)) return {error:'LEVEL_INVALID'};
  if (level === 'team' && !team) return {error:'TEAM_REQUIRED'};
  if (level === 'restricted' && !named.length) return {error:'NAMED_REQUIRED'};
  return {ok:true};
}

// The audience handed to every task created from a meeting (FR-011-009): a restricted meeting gives
// `restricted` with its participants as viewers; any other meeting gives nothing.
export function meetingAudience(meeting, participantIds = []) {
  return levelOf(meeting) === 'restricted' ? {visibility:'restricted', viewerIds:[...new Set(participantIds)]} : null;
}
