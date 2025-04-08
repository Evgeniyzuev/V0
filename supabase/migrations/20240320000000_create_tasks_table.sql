-- Create tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    icon_url TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    reward DECIMAL(10,2),
    description TEXT,
    notes TEXT
);


 