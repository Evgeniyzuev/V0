-- Add reinvest column to users table
ALTER TABLE users ADD COLUMN reinvest INTEGER NOT NULL DEFAULT 100;
-- Ensure reinvest is between 50 and 100
ALTER TABLE users ADD CONSTRAINT reinvest_range CHECK (reinvest >= 50 AND reinvest <= 100); 