-- Seed default activity types
INSERT INTO public.activity_types (nama_aktivitas) VALUES
  ('Find Leads'),
  ('Pitch Product'),
  ('Presentation'),
  ('Deliver Proposal'),
  ('Follow Up'),
  ('Negosiasi'),
  ('Closing')
ON CONFLICT (nama_aktivitas) DO NOTHING;
