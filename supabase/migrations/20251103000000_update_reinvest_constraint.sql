-- Update reinvest constraint to allow values from 0 to 100
ALTER TABLE users DROP CONSTRAINT IF EXISTS reinvest_range;
ALTER TABLE users ADD CONSTRAINT reinvest_range CHECK (reinvest >= 0 AND reinvest <= 100);
