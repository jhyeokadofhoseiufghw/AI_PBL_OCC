WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY event_id ORDER BY updated_at DESC, created_at DESC, id DESC
  ) AS row_number
  FROM feed_posts
)
DELETE FROM feed_posts
WHERE id IN (SELECT id FROM ranked WHERE row_number > 1);

DROP INDEX IF EXISTS idx_feed_posts_event;
CREATE UNIQUE INDEX IF NOT EXISTS idx_feed_posts_event_unique
  ON feed_posts(event_id);
