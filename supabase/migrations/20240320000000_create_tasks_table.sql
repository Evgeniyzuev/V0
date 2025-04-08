-- Create tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    icon_url TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    reward DECIMAL(10,2),
    description TEXT,
    notes TEXT
);

-- Create index for faster queries
CREATE INDEX tasks_due_date_idx ON tasks(due_date);

-- Add RLS (Row Level Security) policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

 