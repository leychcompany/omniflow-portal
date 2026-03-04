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
3. Set to **Private** – the API streams files through authenticated download endpoints

PDFs can be uploaded via the Admin → Documents screen, or manually to match `storage_path` values (e.g. `OMNI-3000-6000/filename.pdf`). Documents use tags (array) instead of a single category; assign multiple tags when adding or editing.

### software (Private)

Create a storage bucket named `software` in Supabase Dashboard:

1. Go to Storage
2. Create new bucket: `software`
3. Set to **Private** – the API streams files through authenticated download endpoints

ZIP files can be uploaded via the Admin → Software screen. Software downloads are streamed through `/api/software/[id]/download` and require authentication.

**File size limits**: Free plan allows max 50 MB per file. Pro plan: increase in Dashboard → Storage → Settings → Global file size limit (up to 500 GB).

### images (Public)

Create a storage bucket named `images` for news and training thumbnails:

1. Go to Storage
2. Create new bucket: `images`
3. Set to **Public** – images are served directly

The admin uploads images to `images/news/` and `images/training/` via the News and Training forms.

## Password Reset & Invite – OTP Fallback (Corporate Email)

Corporate email systems (e.g. Microsoft 365, Outlook, Proofpoint) often prefetch links in emails for security scanning. This consumes the one-time token before the user clicks, causing "link has expired" errors.

To fix this, add the 6-digit OTP code (`{{ .Token }}`) to both **Reset Password** and **Invite** email templates in Supabase. Users can then enter the gitcode manually when the link is consumed by their corporate firewall.

### Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Email Templates**
2. Edit both **Reset Password** and **Invite** templates (see below)
3. Save each template

### Reset Password template

```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p><strong>If the link doesn't work</strong> (e.g. with Outlook or corporate email), use this 6-digit code on the reset page: <strong>{{ .Token }}</strong></p>
<p>This code expires in 24 hours.</p>
```

Users enter the code at `/forgot-password` (shown after requesting a reset, or via "Enter 6-digit code from email" on the expired link page).

### Invite template

```html
<h2>You Have Been Invited</h2>
<p>You have been invited to join. Click the link below to set your password:</p>
<p><a href="{{ .ConfirmationURL }}">Accept Invite</a></p>
<p><strong>If the link doesn't work</strong> (e.g. with Outlook or corporate email), use this 6-digit code on the reset page: <strong>{{ .Token }}</strong></p>
<p>This code expires in 24 hours.</p>
```

Invited users enter their email and the 6-digit code at `/forgot-password` (add `?mode=otp` to show the code field, or use "Enter 6-digit code from email" on the expired link page). The app detects whether the code is from a reset or invite email.
