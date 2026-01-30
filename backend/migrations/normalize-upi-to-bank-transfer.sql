-- One-time migration: Normalize UPI and SBI Neelkanth to Bank Transfer
-- Run this ONCE after deploying the code changes

BEGIN;

UPDATE daybook_entries SET payment_mode = 'Bank Transfer' WHERE payment_mode IN ('UPI', 'SBI Neelkanth');
UPDATE daybook_entries SET payment_source = 'Bank Transfer' WHERE payment_source IN ('UPI', 'SBI Neelkanth');
UPDATE daybook_entries SET received_in = 'Bank Transfer' WHERE received_in IN ('UPI', 'SBI Neelkanth');
UPDATE bookings SET payment_mode = 'Bank Transfer' WHERE payment_mode IN ('UPI', 'SBI Neelkanth');
UPDATE bookings SET balance_payment_mode = 'Bank Transfer' WHERE balance_payment_mode IN ('UPI', 'SBI Neelkanth');

COMMIT;
