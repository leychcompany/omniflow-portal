-- Remove deleted_at from tags (we use hard delete now)
ALTER TABLE tags DROP COLUMN IF EXISTS deleted_at;

-- Update RLS policy to allow all tags (no deleted_at filter)
DROP POLICY IF EXISTS "tags_select" ON tags;
CREATE POLICY "tags_select" ON tags FOR SELECT TO authenticated USING (true);
