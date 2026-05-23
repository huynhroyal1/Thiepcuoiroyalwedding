-- Track template content saves for preview cache busting (mirrors wedding_cards.updated_at).
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.templates.updated_at IS 'Last content/metadata save — used by /thiep/mau/[id] preview';
