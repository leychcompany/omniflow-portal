# Supabase Setup

## Running Migrations

Run the migration SQL in the Supabase Dashboard (SQL Editor) or via Supabase CLI:

```bash
supabase db push
```

Or copy the contents of `migrations/20250209000000_create_courses_manuals_news.sql` and run in SQL Editor.

## Seeding Data

After migrations, run the seed to populate initial data:

```bash
# In Supabase SQL Editor, run the contents of seed.sql
```

Or: `supabase db reset` (if using local Supabase) which runs migrations and seed.

## Storage Buckets

### manuals (Private)

Create a storage bucket named `manuals` in Supabase Dashboard:

1. Go to Storage
2. Create new bucket: `manuals`
3. Set to **Private** – the API generates signed download URLs

PDFs can be uploaded via the Admin → Manuals screen, or manually to match `storage_path` values (e.g. `OMNI-3000-6000/filename.pdf`).

### images (Public)

Create a storage bucket named `images` for news and training thumbnails:

1. Go to Storage
2. Create new bucket: `images`
3. Set to **Public** – images are served directly

The admin uploads images to `images/news/` and `images/training/` via the News and Training forms.
