// Task rules of FEAT-010 (SDD-010 "Interfaces"), shared by the API and the UI. Pure: no I/O.
// @trace implements FR-010-002, FR-010-003, FR-010-005, FR-010-006, FR-010-007, FR-010-009
export const TASK_STATUSES = ['planned','doing','blocked','review','done'];
export const PROJECT_STATUSES = ['active','on_hold','done','archived'];
export const WORKBOARD_STATUSES = ['Backlog','Ready','Doing','Blocked','Review','Done'];
// Backlog and Ready become `planned`; the original stays a badge (PLAN-002 Q8).
export const FROM_WORKBOARD = {Backlog:'planned',Ready:'planned',Doing:'doing',Blocked:'blocked',Review:'review',Done:'done'};
export const RULE_MESSAGES = {
  TITLE_REQUIRED:'ระบุชื่องาน', STATUS_INVALID:'สถานะไม่ถูกต้อง', MEMBER_INACTIVE:'สมาชิกนี้ปิดใช้งานอยู่ กรุณาเลือกคนที่ Active', BLOCKER_REQUIRED:'ระบุเหตุที่ติดขัดก่อนย้ายไป Blocked',
  R_REQUIRED:'ก่อน Done ต้องมี R', A_UNCONFIRMED:'ก่อน Done ต้องมี A ที่ยืนยันแล้ว', ACCEPTANCE_UNCONFIRMED:'ก่อน Done ต้องมีเกณฑ์รับงานที่ยืนยันแล้ว',
  EVIDENCE_REQUIRED:'ก่อน Done ต้องมีหลักฐานส่งงาน', RECHECK_REQUIRED:'งานที่ผูก KPI หรือ gate ต้องมีวันตรวจผลซ้ำ', DUE_REQUIRED:'งานของแคมเปญต้องมีวันส่งก่อน Done',
  CONTEXT_CONFLICT:'แคมเปญของงาน คอนเทนต์ และเป้าหมายต้องตรงกัน', NAME_REQUIRED:'ระบุชื่อโปรเจกต์', NAME_TOO_LONG:'ชื่อโปรเจกต์ยาวไม่เกิน 80 ตัวอักษร', DATES_INVALID:'วันจบต้องไม่ก่อนวันเริ่ม',
};
const filled = v => typeof v === 'string' ? v.trim() !== '' : v != null;

// FR-010-007: a new completion needs R, a confirmed A, a confirmed acceptance criterion and evidence, a recheck date
// when a KPI or campaign gate is named, and a due date when the task has a campaign (PLAN-002 Q7).
export function completionError(t) {
  if (!t.responsibleId) return 'R_REQUIRED';
  if (!t.accountableId || !t.accountableConfirmed) return 'A_UNCONFIRMED';
  if (!filled(t.acceptance) || t.acceptanceProposed) return 'ACCEPTANCE_UNCONFIRMED';
  if (!filled(t.evidence)) return 'EVIDENCE_REQUIRED';
  if ((filled(t.kpi) || filled(t.details?.gate)) && !t.recheckDate) return 'RECHECK_REQUIRED';
  if (t.campaignId && !t.dueDate) return 'DUE_REQUIRED';
  return null;
}
// FR-010-006: moving into Blocked needs a blocker; moving into Done follows FR-010-007.
export function moveError(t, toStatus) {
  if (!TASK_STATUSES.includes(toStatus)) return 'STATUS_INVALID';
  if (toStatus === 'blocked' && !filled(t.blocker)) return 'BLOCKER_REQUIRED';
  if (toStatus === 'done') return completionError(t);
  return null;
}
// A whole save: a task already Done under the Workboard rule is not re-checked until it leaves Done (AC-010-007-03);
// a Blocked Workboard task without a blocker stays valid until someone moves it (SDD-010 Decisions).
export function saveError(before, after) {
  if (!filled(after.title)) return 'TITLE_REQUIRED';
  if (!TASK_STATUSES.includes(after.status)) return 'STATUS_INVALID';
  const moved = !before || before.status !== after.status;
  if (after.status === 'blocked' && !filled(after.blocker) && (moved || filled(before?.blocker))) return 'BLOCKER_REQUIRED';
  if (after.status === 'done' && (moved || after.completionRule !== 'workboard')) return completionError(after);
  return null;
}
// FR-010-002: a content item and a goal must belong to the task's campaign, and to each other's.
export function contextError(t, {contentItem = null, goal = null} = {}) {
  const campaigns = [t.campaignId, contentItem?.campaign_id, goal?.campaign_id].filter(Boolean);
  return new Set(campaigns).size > 1 ? 'CONTEXT_CONFLICT' : null;
}
// FR-010-005: boards. "Mine" is the task's R or A (owner decision 2026-10-01).
export function onBoard(t, board, memberId = null) {
  switch (board?.kind) {
    case 'all': return true;
    case 'campaign': return !!board.id && t.campaignId === board.id;
    case 'project': return !!board.id && t.projectId === board.id;
    case 'team': return !!board.id && t.teamId === board.id;
    case 'unlinked': return !t.campaignId && !t.projectId && !t.teamId && !t.contentItemId && !t.goalId;
    case 'mine': return !!memberId && (t.responsibleId === memberId || t.accountableId === memberId);
    default: return false;
  }
}
// FR-010-009: a create with a used key replays the stored task only for the same body.
export function idempotencyOutcome(existing, payloadHash) {
  if (!existing) return 'create';
  return existing.idempotency_hash === payloadHash ? 'replay' : 'conflict';
}
// FR-010-003.
export function projectError(p) {
  const name = typeof p.name === 'string' ? p.name.trim() : '';
  if (!name) return 'NAME_REQUIRED';
  if (name.length > 80) return 'NAME_TOO_LONG';
  if (p.status != null && !PROJECT_STATUSES.includes(p.status)) return 'STATUS_INVALID';
  if (p.planned_start && p.planned_end && p.planned_end < p.planned_start) return 'DATES_INVALID';
  return null;
}
// Lane of a Workboard status and back; `planned` keeps Backlog or Ready as its original (FR-010-013).
export function toWorkboardStatus(status, original = null) {
  if (status === 'planned') return ['Backlog','Ready'].includes(original) ? original : 'Backlog';
  return {doing:'Doing', blocked:'Blocked', review:'Review', done:'Done'}[status] || 'Backlog';
}
