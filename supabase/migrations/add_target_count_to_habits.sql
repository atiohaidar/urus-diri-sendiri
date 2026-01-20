-- Migration to add target_count to habits table

ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS target_count INTEGER NULL;

-- Comment on column
COMMENT ON COLUMN habits.target_count IS 'Optional target completion count for the habit (e.g. 30 times)';
