-- Migration: Add collection_amount and agent_id to bookings table
-- Author: System
-- Date: 2026-02-09
-- Module: 1 - Booking Fields Enhancement

-- Add collection_amount column (nullable for backward compatibility)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS collection_amount DECIMAL(12, 2) DEFAULT NULL;

-- Add agent_id column (nullable for backward compatibility)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS agent_id INTEGER DEFAULT NULL;

-- Add foreign key constraint to users table
ALTER TABLE bookings
ADD CONSTRAINT fk_bookings_agent_id
FOREIGN KEY (agent_id)
REFERENCES users(id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON bookings(agent_id);

-- Rollback script (commented out, uncomment to rollback):
-- ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_agent_id;
-- DROP INDEX IF EXISTS idx_bookings_agent_id;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS agent_id;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS collection_amount;

-- Verification query:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'bookings'
-- AND column_name IN ('collection_amount', 'agent_id');
