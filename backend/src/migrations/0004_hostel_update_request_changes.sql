-- Staged edits for a hostel update request.
--
-- When a super admin approves an update request, the sub admin can edit the
-- hostel. Their edits are NOT written to the live tables immediately; they are
-- held in `pending_changes` as JSON until a super admin reviews them. Approving
-- applies them to the live tables and clears this column; rejecting clears it
-- and closes the request.
--
-- State model:
--   status='pending'                                  request awaiting permission
--   status='approved' AND pending_changes IS NULL      unlocked, nothing staged
--   status='approved' AND pending_changes IS NOT NULL  changes awaiting review

ALTER TABLE hostel_update_requests
  ADD COLUMN pending_changes JSON NULL AFTER reason;

-- Staging and applying edits are new audit events.
ALTER TABLE hostel_review_log
  MODIFY COLUMN action ENUM(
    'submitted','approved','rejected',
    'update_requested','update_approved','update_rejected',
    'update_submitted','change_approved','change_rejected'
  ) NOT NULL;
