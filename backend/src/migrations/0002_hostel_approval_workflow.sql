-- 0002_hostel_approval_workflow.sql
-- Adds the sub-admin -> super-admin approval workflow to the EXISTING schema.
-- Existing hostels are marked 'approved' so nothing currently live disappears.
-- New submissions from the sub-admin app are inserted with status = 'pending'.

-- 1) Extend the existing hostels table with workflow columns
ALTER TABLE hostels
  ADD COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' AFTER average_rating,
  ADD COLUMN rejection_reason VARCHAR(255) NULL AFTER status,
  ADD COLUMN created_by INT NULL AFTER rejection_reason,
  ADD COLUMN reviewed_by INT NULL AFTER created_by,
  ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by,
  ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER reviewed_at,
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE hostels
  ADD INDEX idx_hostels_status (status),
  ADD INDEX idx_hostels_created_by (created_by),
  ADD CONSTRAINT fk_hostels_created_by FOREIGN KEY (created_by) REFERENCES team_users(id),
  ADD CONSTRAINT fk_hostels_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES team_users(id);

-- 2) Audit trail of submitted / approved / rejected actions
CREATE TABLE hostel_review_log (
  id INT NOT NULL AUTO_INCREMENT,
  hostel_id VARCHAR(50) NOT NULL,
  action ENUM('submitted','approved','rejected') NOT NULL,
  performed_by INT NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_review_log_hostel (hostel_id),
  CONSTRAINT fk_review_log_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id) ON DELETE CASCADE,
  CONSTRAINT fk_review_log_user FOREIGN KEY (performed_by) REFERENCES team_users(id)
);
