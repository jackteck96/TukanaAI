-- Add parent_note_id to process_notes to enable threaded replies
ALTER TABLE process_notes
ADD COLUMN parent_note_id uuid REFERENCES process_notes(id) ON DELETE CASCADE;

-- Add index for better performance when querying threads
CREATE INDEX idx_process_notes_parent_id ON process_notes(parent_note_id);

-- Add index for better performance when querying by process
CREATE INDEX idx_process_notes_process_id ON process_notes(process_id);