-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT DEFAULT 'In Person',
  thumbnail TEXT,
  instructor TEXT,
  featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Manuals table
CREATE TABLE IF NOT EXISTS manuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- News articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  published_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- RLS: Allow SELECT for authenticated users (client reads)
CREATE POLICY "courses_select" ON courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "manuals_select" ON manuals FOR SELECT TO authenticated USING (true);
CREATE POLICY "news_articles_select" ON news_articles FOR SELECT TO authenticated USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER manuals_updated_at BEFORE UPDATE ON manuals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER news_articles_updated_at BEFORE UPDATE ON news_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
