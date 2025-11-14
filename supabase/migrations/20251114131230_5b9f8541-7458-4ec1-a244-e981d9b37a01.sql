-- Adicionar campo para link de reunião nos eventos de calendário
ALTER TABLE process_calendar_events
ADD COLUMN meeting_link text;