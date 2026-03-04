-- Software table for downloadable software files (ZIP format)
CREATE TABLE IF NOT EXISTS software (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE software ENABLE ROW LEVEL SECURITY;

CREATE POLICY "software_select" ON software FOR SELECT TO authenticated USING (true);

CREATE TRIGGER software_updated_at BEFORE UPDATE ON software
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
