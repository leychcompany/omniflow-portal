-- Make category nullable so documents can have no tags
ALTER TABLE manuals ALTER COLUMN category DROP NOT NULL;
