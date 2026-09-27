-- Fix events with missing image files
-- This sets image_url to NULL for any paths that don't exist on disk

UPDATE events
SET image_url = NULL
WHERE image_url IS NOT NULL
  AND image_url LIKE '%/uploads/%1788%';

-- You can also do a broader cleanup if needed:
-- UPDATE events SET image_url = NULL WHERE image_url LIKE '%/uploads/%';
