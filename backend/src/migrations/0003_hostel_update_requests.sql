-- 0003_hostel_update_requests.sql
-- Sub admins cannot edit a hostel directly. They first request permission,
-- stating why, and a super admin approves or rejects that request. An approved
-- request is what unlocks the edit form for that hostel.

CREATE TABLE hostel_update_requests (
  id INT NOT NULL AUTO_INCREMENT,
  hostel_id VARCHAR(50) NOT NULL,
  requested_by INT NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  decision_note VARCHAR(255) NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_update_requests_status (status),
  KEY idx_update_requests_hostel (hostel_id),
  KEY idx_update_requests_requested_by (requested_by),
  CONSTRAINT fk_update_requests_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id) ON DELETE CASCADE,
  CONSTRAINT fk_update_requests_requested_by FOREIGN KEY (requested_by) REFERENCES team_users(id),
  CONSTRAINT fk_update_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES team_users(id)
);

-- Record request decisions in the same audit trail as hostel decisions.
ALTER TABLE hostel_review_log
  MODIFY COLUMN action ENUM(
    'submitted','approved','rejected',
    'update_requested','update_approved','update_rejected'
  ) NOT NULL;
