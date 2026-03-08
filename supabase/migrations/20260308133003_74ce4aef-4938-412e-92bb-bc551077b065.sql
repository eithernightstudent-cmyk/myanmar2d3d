CREATE TABLE public.threed_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  threed TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.threed_results DISABLE ROW LEVEL SECURITY;

INSERT INTO public.threed_results (date, threed) VALUES
  ('2026-03-01', '866'),
  ('2026-02-16', '563'),
  ('2026-02-01', '629'),
  ('2026-01-17', '972'),
  ('2026-01-02', '706');