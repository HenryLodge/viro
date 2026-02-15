-- Add lat/lng columns to patients table for geolocation capture
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS lat float8,
  ADD COLUMN IF NOT EXISTS lng float8;
