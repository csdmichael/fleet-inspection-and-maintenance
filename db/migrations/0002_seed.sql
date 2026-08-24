-- Forward-only migration 0002: reference data so a new environment is not empty.
-- Re-runnable: each row is inserted only when its title is absent.
INSERT INTO maintenance (title, reference, status, priority)
SELECT 'Sample Maintenance 1', 'M-0001', 'new', 'low'
WHERE NOT EXISTS (SELECT 1 FROM maintenance WHERE title = 'Sample Maintenance 1');
INSERT INTO maintenance (title, reference, status, priority)
SELECT 'Sample Maintenance 2', 'M-0002', 'in-progress', 'normal'
WHERE NOT EXISTS (SELECT 1 FROM maintenance WHERE title = 'Sample Maintenance 2');
INSERT INTO maintenance (title, reference, status, priority)
SELECT 'Sample Maintenance 3', 'M-0003', 'complete', 'high'
WHERE NOT EXISTS (SELECT 1 FROM maintenance WHERE title = 'Sample Maintenance 3');
INSERT INTO maintenance (title, reference, status, priority)
SELECT 'Sample Maintenance 4', 'M-0004', 'new', 'low'
WHERE NOT EXISTS (SELECT 1 FROM maintenance WHERE title = 'Sample Maintenance 4');
