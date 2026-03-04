-- Add tags (TEXT array) alongside category for gradual migration
-- Category remains for backward compatibility; tags is the new multi-select field
ALTER TABLE manuals ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Backfill tags from category for existing rows (tags takes precedence when both exist)
UPDATE manuals SET tags = ARRAY[category] WHERE category IS NOT NULL AND category != '' AND (tags IS NULL OR tags = '{}');

-- Ensure tags has default
ALTER TABLE manuals ALTER COLUMN tags SET DEFAULT '{}';
