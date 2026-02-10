-- Module 9: Add Closing Balances and Auto-Calculation Fields
-- Date: 2026-02-10
-- Purpose: Enable automatic daily balance carry forward

-- Add new columns to daybook_balances table
ALTER TABLE daybook_balances
ADD COLUMN IF NOT EXISTS cash_closing DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_sbi_closing DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_calculated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;

-- Create index for faster date lookups
CREATE INDEX IF NOT EXISTS idx_daybook_balances_date ON daybook_balances(date);

-- Add comment for documentation
COMMENT ON COLUMN daybook_balances.cash_closing IS 'Closing balance for cash (auto-calculated)';
COMMENT ON COLUMN daybook_balances.bank_sbi_closing IS 'Closing balance for SBI Bank (auto-calculated)';
COMMENT ON COLUMN daybook_balances.is_calculated IS 'Flag indicating if balance was auto-calculated vs manually entered';
COMMENT ON COLUMN daybook_balances.calculated_at IS 'Timestamp when balance was last calculated';
COMMENT ON COLUMN daybook_balances.locked IS 'Prevents modification of historical balances';
