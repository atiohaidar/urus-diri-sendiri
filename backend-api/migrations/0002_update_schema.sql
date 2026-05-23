-- Migration: Update schema to match frontend v2
-- Adds missing fields for scheduling and calendar integration

-- Update priorities table
ALTER TABLE priorities ADD COLUMN scheduled_for TEXT;
ALTER TABLE priorities ADD COLUMN completion_note TEXT;
ALTER TABLE priorities ADD COLUMN calendar_event_id TEXT;

-- Update routines table
ALTER TABLE routines ADD COLUMN completion_note TEXT;
ALTER TABLE routines ADD COLUMN calendar_event_id TEXT;

-- Create indexes for new schedulable fields
CREATE INDEX IF NOT EXISTS idx_priorities_scheduled_for ON priorities(scheduled_for);
