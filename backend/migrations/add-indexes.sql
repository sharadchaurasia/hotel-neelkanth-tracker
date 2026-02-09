-- ============================================================
-- Hotel Neelkanth — Performance Optimization Indexes
-- Run this to improve query performance
-- ============================================================

-- Most frequently queried fields in bookings table
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(source);
CREATE INDEX IF NOT EXISTS idx_bookings_source_name ON bookings(source_name);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_type ON bookings(payment_type);

-- Composite index for common date range queries
CREATE INDEX IF NOT EXISTS idx_bookings_dates_status ON bookings(check_out, check_in, status);

-- Index for phone number lookup (guest history)
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);

-- Daybook entries optimization
CREATE INDEX IF NOT EXISTS idx_daybook_date ON daybook_entries(date);
CREATE INDEX IF NOT EXISTS idx_daybook_ref_booking ON daybook_entries(ref_booking_id);
CREATE INDEX IF NOT EXISTS idx_daybook_type ON daybook_entries(type);

-- Staff and attendance optimization
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(staff_id);

-- AKS Office payments
CREATE INDEX IF NOT EXISTS idx_aks_office_date ON aks_office_payments(date);
CREATE INDEX IF NOT EXISTS idx_aks_office_booking ON aks_office_payments(ref_booking_id);

-- Agent settlements
CREATE INDEX IF NOT EXISTS idx_agent_settlement_date ON agent_settlements(date);
CREATE INDEX IF NOT EXISTS idx_agent_settlement_name ON agent_settlements(agent_name);

-- Analyze tables after index creation for query planner
ANALYZE bookings;
ANALYZE daybook_entries;
ANALYZE staff;
ANALYZE attendance;
ANALYZE aks_office_payments;
ANALYZE agent_settlements;
