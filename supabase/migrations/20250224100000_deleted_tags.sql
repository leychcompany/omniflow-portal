-- Store tags that have been permanently deleted from the pool (case-insensitive key)
CREATE TABLE IF NOT EXISTS deleted_tags (
  tag_lower TEXT PRIMARY KEY,
  deleted_at TIMESTAMPTZ DEFAULT now()
);
