-- Migration: Add Ledger Opening Balance Table
-- Date: 2026-02-09
-- Purpose: Support automatic month-end closing and opening balance carry-forward

-- Create ledger opening balance table
CREATE TABLE IF NOT EXISTS ledger_opening_balance (
  id SERIAL PRIMARY KEY,
  agent_name VARCHAR(100) NOT NULL,
  month VARCHAR(7) NOT NULL,  -- Format: 'YYYY-MM' (e.g., '2026-02')
  opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_agent_month UNIQUE(agent_name, month)
);

-- Create index for faster queries
CREATE INDEX idx_ledger_opening_agent ON ledger_opening_balance(agent_name);
CREATE INDEX idx_ledger_opening_month ON ledger_opening_balance(month);

-- Add comments
COMMENT ON TABLE ledger_opening_balance IS 'Stores opening balances for agent ledgers (AKS Office, Agents) at the start of each month';
COMMENT ON COLUMN ledger_opening_balance.agent_name IS 'Name of agent or AKS Office';
COMMENT ON COLUMN ledger_opening_balance.month IS 'Month in YYYY-MM format';
COMMENT ON COLUMN ledger_opening_balance.opening_balance IS 'Opening balance (negative = hotel has advance, positive = agent owes hotel)';
