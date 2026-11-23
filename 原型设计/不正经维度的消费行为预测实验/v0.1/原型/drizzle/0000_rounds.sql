CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  label TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  products_json TEXT NOT NULL,
  rating_json TEXT NOT NULL,
  transcript TEXT,
  sealed_at TEXT,
  profile_prompt TEXT,
  rating_prompt TEXT,
  prompt_version TEXT,
  profile_json TEXT,
  response_json TEXT,
  submitted_at TEXT,
  prediction_status TEXT,
  prediction_json TEXT,
  prediction_at TEXT,
  run_id TEXT,
  lease_until INTEGER,
  error_code TEXT,
  error_stage TEXT
);
--> statement-breakpoint
CREATE INDEX rounds_owner_expiration ON rounds(owner, expires_at);
