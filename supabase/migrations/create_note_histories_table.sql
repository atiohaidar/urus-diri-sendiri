-- Create note_histories table for version tracking
CREATE TABLE IF NOT EXISTS note_histories (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_note_histories_user_id ON note_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_note_histories_note_id ON note_histories(note_id);
CREATE INDEX IF NOT EXISTS idx_note_histories_saved_at ON note_histories(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_histories_updated_at ON note_histories(updated_at);

-- Enable RLS
ALTER TABLE note_histories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own note histories"
    ON note_histories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own note histories"
    ON note_histories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own note histories"
    ON note_histories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own note histories"
    ON note_histories FOR DELETE
    USING (auth.uid() = user_id);
