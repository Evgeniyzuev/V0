-- Add fields for universal challenge system
ALTER TABLE tasks ADD COLUMN verification_type TEXT DEFAULT 'manual';
ALTER TABLE tasks ADD COLUMN materials JSONB;
ALTER TABLE tasks ADD COLUMN verification_config JSONB;

-- Update task 1 for PDF challenge
UPDATE tasks
SET verification_type = 'pdf_open',
    materials = '[{"type": "pdf", "url": "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreia3xfb5ntpomdalkpqk7upttz7azkf5tppu5qadqrrmb4irqb64n4", "title": "Abundance Effect", "downloadable": true}]'::jsonb
WHERE number = 1;
