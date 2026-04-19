-- Add extras JSONB column to words for storing word-type-specific data
-- (verb forms, noun genders, adjective forms, preposition examples)
ALTER TABLE public.words ADD COLUMN IF NOT EXISTS extras JSONB;
