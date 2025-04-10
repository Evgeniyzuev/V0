-- Add completion_condition column to tasks table
ALTER TABLE tasks
ADD COLUMN completion_condition TEXT;
