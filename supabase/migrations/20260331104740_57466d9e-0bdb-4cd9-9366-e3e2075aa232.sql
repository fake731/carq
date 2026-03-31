
CREATE TABLE public.global_theme (
  id TEXT PRIMARY KEY DEFAULT 'default',
  primary_color TEXT NOT NULL DEFAULT '211 100% 50%',
  accent_color TEXT NOT NULL DEFAULT '145 72% 42%',
  font_scale NUMERIC NOT NULL DEFAULT 1,
  border_radius NUMERIC NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.global_theme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read global theme"
  ON public.global_theme FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update global theme"
  ON public.global_theme FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can insert global theme"
  ON public.global_theme FOR INSERT
  TO authenticated
  WITH CHECK (true);

INSERT INTO public.global_theme (id, primary_color, accent_color, font_scale, border_radius)
VALUES ('default', '211 100% 50%', '145 72% 42%', 1, 1);

ALTER PUBLICATION supabase_realtime ADD TABLE public.global_theme;
