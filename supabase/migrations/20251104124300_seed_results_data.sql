-- Seed data for the results table with achievements, items, books, base backgrounds, and character backgrounds

-- Insert achievements
INSERT INTO public.results (type, img, title, description, info) VALUES
('achievement', 'https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreibb77axafktdr7vjlurwizg6fh54so2pfwhlg2wqeluy5sweuk3ya', 'Core', 'Your core at level 8', '{"subtitle": "LVL 8"}'),
('achievement', 'https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreibb77axafktdr7vjlurwizg6fh54so2pfwhlg2wqeluy5sweuk3ya', 'Explorer', 'You explored new areas and discovered secrets.', '{"subtitle": "Visited 10 places"}'),
('achievement', '💎', 'Collector', 'A seasoned collector of rare items.', '{"subtitle": "Collected 50 items"}'),
('achievement', '🥇', 'Champion', 'You ranked high in the weekly leaderboard.', '{"subtitle": "Top 10 in leaderboard"}'),
('achievement', '🏃‍♂️', 'Marathoner', 'You demonstrate persistence and consistency.', '{"subtitle": "Complete 100 tasks"}'),
('achievement', '🤝', 'Socializer', 'You helped grow the community by inviting others.', '{"subtitle": "10 friends invited"}'),
('achievement', '🧠', 'Strategist', 'You planned and prioritized important goals effectively.', '{"subtitle": "5 goals planned"}'),
('achievement', '🗺️', 'Treasure Hunter', 'You found a rare treasure while exploring.', '{"subtitle": "Found hidden item"}'),
('achievement', '💡', 'Innovator', 'You shipped something useful.', '{"subtitle": "Created a feature"}'),
('achievement', '🆘', 'Helper', 'You helped the community.', '{"subtitle": "Answered 10 questions"}'),
('achievement', '⚡', 'Speedster', 'Completed a task very quickly.', '{"subtitle": "Fast completion"}'),
('achievement', '✅', 'Perfectionist', 'You finished every subtask.', '{"subtitle": "All subtasks done"}'),
('achievement', '🤝', 'Collaborator', 'Teamwork makes the dream work.', '{"subtitle": "Worked with a friend"}'),
('achievement', '🏗️', 'Architect', 'You created a solid plan.', '{"subtitle": "Planned 10 steps"}'),
('achievement', '🌱', 'Gardener', 'You nurtured something over time.', '{"subtitle": "Grew a garden"}'),
('achievement', '🗂️', 'Archivist', 'Your records are complete.', '{"subtitle": "Saved 100 notes"}');

-- Insert inventory items
INSERT INTO public.results (type, img, title, description, info) VALUES
('item', '🔴', 'Ruby', 'A small red gem.', '{"count": 1}'),
('item', '🍞', 'Bread', 'Restores energy.', '{"count": 1}'),
('item', '🧪', 'Potion', 'Heals wounds.', '{"count": 1}'),
('item', '🪙', 'Coin', 'Currency.', '{"count": 1}'),
('item', '🗝️', 'Key', 'Opens locks.', '{"count": 1}'),
('item', '🗺️', 'Map', 'Shows locations.', '{"count": 1}'),
('item', '📘', 'Book', 'Knowledge.', '{"count": 1}'),
('item', '🪶', 'Feather', 'Light item.', '{"count": 1}'),
('item', '💎', 'Gem', 'Valuable gem.', '{"count": 1}'),
('item', '🍎', 'Apple', 'Healthy snack.', '{"count": 1}'),
('item', '🛡️', 'Shield', 'Protection.', '{"count": 1}'),
('item', '🗡️', 'Sword', 'Weapon.', '{"count": 1}'),
('item', '🏮', 'Lantern', 'Lights the way.', '{"count": 1}'),
('item', '📜', 'Scroll', 'Ancient knowledge.', '{"count": 1}'),
('item', '🎫', 'Ticket', 'Entry pass.', '{"count": 1}'),
('item', '👑', 'Crown', 'Rare trophy.', '{"count": 1}');

-- Insert knowledge items (books)
INSERT INTO public.results (type, img, title, description, info) VALUES
('book', '📚', 'Ancient Tome', 'A dusty book containing forgotten knowledge.', '{"count": 1}'),
('book', '📜', 'Spell Scroll', 'Magical writings that reveal arcane secrets.', '{"count": 1}'),
('book', '🗺️', 'Treasure Map', 'A map leading to hidden treasures.', '{"count": 1}'),
('book', '🌿', 'Herbal Guide', 'Knowledge of medicinal plants and herbs.', '{"count": 1}'),
('book', '⭐', 'Star Chart', 'Celestial navigation and astronomical knowledge.', '{"count": 1}'),
('book', '⚗️', 'Alchemy Notes', 'Recipes and formulas for potions.', '{"count": 1}'),
('book', '⚔️', 'Battle Tactics', 'Strategic combat knowledge.', '{"count": 1}'),
('book', '📖', 'Language Primer', 'Ancient languages and their translations.', '{"count": 1}'),
('book', '🔮', 'Rune Dictionary', 'Mystical symbols and their meanings.', '{"count": 1}'),
('book', '🌤️', 'Weather Almanac', 'Patterns and predictions of weather.', '{"count": 1}'),
('book', '🦁', 'Beast Compendium', 'Encyclopedia of creatures and monsters.', '{"count": 1}'),
('book', '🔨', 'Crafting Manual', 'Instructions for creating tools and weapons.', '{"count": 1}'),
('book', '📜', 'History Scrolls', 'Chronicles of past events and civilizations.', '{"count": 1}'),
('book', '🎵', 'Music Sheets', 'Melodies and compositions from different eras.', '{"count": 1}'),
('book', '👨‍🍳', 'Cooking Recipes', 'Culinary knowledge and meal preparations.', '{"count": 1}'),
('book', '🏗️', 'Architecture Plans', 'Blueprints and building techniques.', '{"count": 1}');

-- Insert base backgrounds
INSERT INTO public.results (type, img, title, description) VALUES
('base', 'https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreidae7sneuejwbie7mytgjcuxi775j6zcall6ywfjf6jxuuwtmjlw4', 'Base Background 1', 'A beautiful base background'),
('base', 'https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreigpgvix4rumjuu2orw7ij7bc2umcgai7kwuvbylkj4rzgaluh42dy', 'Base Background 2', 'Another stunning base background'),
('base', 'https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafybeidrqqjj73obl35ceqeg7qoqmc2aphlvpuau57o7b3sd5zoz6ecjtq', 'Base Background 3', 'Third base background option');

-- Insert character backgrounds
INSERT INTO public.results (type, img, title, description) VALUES
('character', 'https://i.pinimg.com/736x/1e/fd/b6/1efdb63278aa6883bf73a4dab68eecd9.jpg', 'Character Background 1', 'A character background'),
('character', 'https://i.pinimg.com/736x/db/ad/37/dbad378fbb3ec5661fdc564ea5858ca3.jpg', 'Character Background 2', 'Another character background'),
('character', 'https://i.pinimg.com/736x/5b/cc/68/5bcc688778eb1e83950d3d39c5b138ed.jpg', 'Character Background 3', 'Third character background option');
