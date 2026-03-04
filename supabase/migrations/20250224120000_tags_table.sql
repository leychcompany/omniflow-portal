-- Tags table: id, name (unique case-insensitive), soft delete
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tags_name_lower_idx ON tags (LOWER(name));

-- Junction table: manuals <-> tags (many-to-many)
CREATE TABLE IF NOT EXISTS manual_tags (
  manual_id UUID NOT NULL REFERENCES manuals(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (manual_id, tag_id)
);

-- Migrate only if manuals still has tags column (first run)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manuals' AND column_name = 'tags'
  ) THEN
    -- Insert distinct tag names (one per case-insensitive name)
    INSERT INTO tags (name)
    SELECT DISTINCT ON (LOWER(trim(t))) trim(t)
    FROM (
      SELECT unnest(COALESCE(m.tags, '{}')) AS t
      FROM manuals m
      WHERE m.tags IS NOT NULL AND array_length(m.tags, 1) > 0
    ) sub
    WHERE trim(t) != ''
    ORDER BY LOWER(trim(t));

    -- Populate manual_tags
    INSERT INTO manual_tags (manual_id, tag_id)
    SELECT DISTINCT m.id, t.id
    FROM manuals m, unnest(COALESCE(m.tags, '{}')) AS tag_name
    JOIN tags t ON LOWER(t.name) = LOWER(trim(tag_name)) AND t.deleted_at IS NULL
    WHERE m.tags IS NOT NULL AND array_length(m.tags, 1) > 0 AND trim(tag_name) != ''
    ON CONFLICT (manual_id, tag_id) DO NOTHING;

    -- Mark tags as deleted if they were in deleted_tags
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deleted_tags') THEN
      UPDATE tags t
      SET deleted_at = now()
      FROM deleted_tags dt
      WHERE LOWER(t.name) = dt.tag_lower AND t.deleted_at IS NULL;
    END IF;

    ALTER TABLE manuals DROP COLUMN tags;
    DROP TABLE IF EXISTS deleted_tags;
  END IF;
END $$;

-- RLS: tags and manual_tags are read via admin/client APIs; allow SELECT for authenticated
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_select" ON tags FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "manual_tags_select" ON manual_tags FOR SELECT TO authenticated USING (true);
