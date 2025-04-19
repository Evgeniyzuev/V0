--number,title,reward,icon_url,description,due_date,notes

INSERT INTO tasks (number, title, reward, icon_url, description, completion_condition, due_date, notes)
VALUES 
    (2, 'Choose your first wish', 1.00,
    'https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreieapembv4igmvsagw4ssbzcvoes2k2tg3g6sqwlrn6bi3xuqcejl4',
    'Choose your first wish from the list of available wishes.',
    'First wish selection',
    NULL,
    'Choose your first wish from the list of available wishes.'
    )
ON CONFLICT (number) DO UPDATE 
SET 
    title = EXCLUDED.title,
    reward = EXCLUDED.reward,
    icon_url = EXCLUDED.icon_url,
    description = EXCLUDED.description,
    completion_condition = EXCLUDED.completion_condition,
    due_date = EXCLUDED.due_date,
    notes = EXCLUDED.notes;

 