BEGIN;
SET search_path TO zuri_go,public;
-- @trace implements FR-014-008, FR-014-009
-- Approved public projections are immutable; runtime can only retract an active row.
DROP POLICY IF EXISTS public_update ON visual_public_outputs;
CREATE POLICY public_retract ON visual_public_outputs AS RESTRICTIVE FOR UPDATE
USING (
 active AND viewer_kind() IN('member','operator')
 AND EXISTS(SELECT 1 FROM visual_projects p WHERE p.business_id=visual_public_outputs.business_id AND p.project_id=visual_public_outputs.project_id)
)
WITH CHECK (
 NOT active AND viewer_kind() IN('member','operator')
 AND EXISTS(SELECT 1 FROM visual_projects p WHERE p.business_id=visual_public_outputs.business_id AND p.project_id=visual_public_outputs.project_id)
);
COMMIT;
