-- Seed courses (from courses-data.ts)
INSERT INTO courses (id, title, description, duration, thumbnail, instructor, featured, sort_order) VALUES
  ('TR7000', 'OMNI 7000', 'Comprehensive instrument training for operators, technicians and integrators. Get experience using the latest OMNI 7000 hardware and software tools.', 'In Person', '/images/tr7000.png', 'OMNI Training', true, 0),
  ('TR6100', 'Basic Operator Online Class – TR6100', 'If you need to get the baseline skills required to operate the OMNI 3000/6000 flow computer, this is the class for you.', 'In Person', '/images/tr6100.png', 'OMNI Training', false, 1),
  ('TR6300', 'Operator / Technician Training - TR6300', 'If you''re looking for a class that goes beyond basic navigation and front panel operations, this is the class for you.', 'In Person', '/images/tr6300.png', 'OMNI Training', false, 2),
  ('TR6400', 'Advanced Technician Class – TR6400', 'If you''re already an experienced OMNI user, or you''ve completed our Operator/Technician (TR6300) class and you''re ready for the next step, this is the class for you.', 'In Person', '/images/tr6400.png', 'OMNI Training', false, 3)
ON CONFLICT (id) DO NOTHING;

-- Seed manuals (from manuals-data.ts)
-- Note: storage_path is a placeholder. Upload PDFs to Supabase Storage bucket 'manuals' and update paths.
INSERT INTO manuals (title, category, filename, storage_path, size, description) VALUES
  ('User Manual Volume 1 - System Architecture & Installation', 'OMNI-3000-6000', 'User-Manual-Volume-1-System-Architecture-Installation.pdf', 'OMNI-3000-6000/User-Manual-Volume-1-System-Architecture-Installation.pdf', '2.4 MB', 'Complete system architecture and installation guide for OMNI-3000 and OMNI-6000 series'),
  ('OMNI 7000 Installation and Configuration', 'OMNI-4000-7000', 'OMNI 7000 Installation and Configuration.pdf', 'OMNI-4000-7000/OMNI-7000-Installation-and-Configuration.pdf', '1.8 MB', 'Step-by-step installation and configuration guide for OMNI-7000 systems'),
  ('OMNI 7000 Operations and Maintenance Guide', 'OMNI-4000-7000', 'OMNI 7000 Operations and Maintenance Guide.pdf', 'OMNI-4000-7000/OMNI-7000-Operations-and-Maintenance-Guide.pdf', '3.2 MB', 'Comprehensive operations and maintenance procedures for OMNI-7000 systems');

-- Seed news (from articles.ts)
INSERT INTO news_articles (title, slug, excerpt, content, image_url, featured, published_at) VALUES
  (
    'OMNI Flow Computers Launches New Customer Portal',
    'omni-flow-computers-launches-new-customer-portal',
    'We are excited to introduce a centralized customer portal for training, support, resources, and account tools from OMNI Flow Computers.',
    'Today we are announcing the launch of the OMNI Flow Computers Customer Portal, a secure hub that brings training, support resources, manuals, and RFQ tools into a single experience. The portal is designed to help teams onboard faster, find technical answers quickly, and manage ongoing service needs more efficiently. Customers can access product documentation, submit service requests, and track updates from one place, with a streamlined interface that reduces time spent searching for information. We will continue to expand the portal with new learning modules, best-practice guides, and proactive service notifications as we roll out additional capabilities over the coming months.',
    '/news-1.jpg',
    true,
    '2026-02-16'
  )
ON CONFLICT (slug) DO NOTHING;
