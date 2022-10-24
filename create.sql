CREATE TABLE events (
  timestamp INTEGER NOT NULL,
  ip TEXT NOT NULL,
  instance TEXT NOT NULL,
  type TEXT NOT NULL,
  values JSONB NOT NULL,
  latitude REAL,
  longitude REAL
);
