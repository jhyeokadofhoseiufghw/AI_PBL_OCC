INSERT INTO feed_posts (event_id, image_url, content)
SELECT e.id, e.poster_image_url, e.description
FROM events e
WHERE e.status IN ('SCHEDULED', 'IN_PROGRESS')
  AND e.description IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM feed_posts fp WHERE fp.event_id = e.id
  );
