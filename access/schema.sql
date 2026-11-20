CREATE TABLE IF NOT EXISTS requests (
 id TEXT PRIMARY KEY, email TEXT NOT NULL, created INTEGER NOT NULL, day INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','denied')),
 decided INTEGER, expires INTEGER, code_hash TEXT UNIQUE, review_sent INTEGER, code_sent INTEGER,
 UNIQUE(email,day)
);
CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
