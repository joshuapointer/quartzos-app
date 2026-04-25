export const DDL = `
CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  icon_slot INTEGER,
  is_builtin INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  peak_temp_f REAL NOT NULL DEFAULT 0,
  dab_alarm_f INTEGER NOT NULL,
  dunk_alarm_f INTEGER NOT NULL,
  samples_json TEXT NOT NULL DEFAULT '[]',
  alerts_json TEXT NOT NULL DEFAULT '[]',
  preset_id TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
`;
