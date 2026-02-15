-- ============================================================
-- Cluster Alerts table — persists network engine cluster alerts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cluster_alerts (
  id            TEXT PRIMARY KEY,
  cluster_label TEXT NOT NULL,
  patient_count INTEGER NOT NULL DEFAULT 0,
  shared_symptoms JSONB DEFAULT '[]'::jsonb,
  geographic_spread TEXT DEFAULT '',
  travel_commonalities TEXT DEFAULT '',
  growth_rate   TEXT DEFAULT 'Emerging',
  recommended_action TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cluster_alerts ENABLE ROW LEVEL SECURITY;

-- Providers (authenticated) can read cluster alerts
CREATE POLICY "Authenticated users can read cluster alerts"
  ON public.cluster_alerts
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role (server-side API) can insert/update
-- RLS doesn't apply to service role, so no policy needed for inserts.
-- If you want to allow authenticated inserts from client (not recommended):
-- CREATE POLICY "Authenticated users can insert cluster alerts"
--   ON public.cluster_alerts
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

COMMENT ON TABLE public.cluster_alerts IS 'Persisted cluster alerts from the network engine. Created when patient clusters cross the alert threshold.';
