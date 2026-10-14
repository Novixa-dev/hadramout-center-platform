-- 0001_init.sql — core schema.
-- Conventions: timestamps are ISO-8601 UTC strings; JSON columns hold objects; text is UTF-8.

CREATE TABLE posts (
  id           INTEGER PRIMARY KEY,                -- imported rows keep their legacy WordPress id
  type         TEXT    NOT NULL CHECK (type IN ('news','article','book','magazine','event','forum','video')),
  status       TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  title        TEXT    NOT NULL,
  excerpt      TEXT    NOT NULL DEFAULT '',
  body         TEXT    NOT NULL DEFAULT '',        -- sanitized HTML
  cover        TEXT,                               -- local media path or remote URL
  cover_alt    TEXT    NOT NULL DEFAULT '',
  published_at TEXT,
  fields       TEXT    NOT NULL DEFAULT '{}',      -- JSON: translatable Arabic strings (author, publisher…)
  data         TEXT    NOT NULL DEFAULT '{}',      -- JSON: non-translatable (pdf, youtube_id, issue_number…)
  featured     INTEGER NOT NULL DEFAULT 0,
  views        INTEGER NOT NULL DEFAULT 0,
  legacy_url   TEXT,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_posts_list     ON posts (type, status, published_at DESC);
CREATE INDEX idx_posts_featured ON posts (status, featured, published_at DESC);

CREATE TABLE authors (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  name_key   TEXT NOT NULL UNIQUE,                 -- normalized, honorific-free key used for merging
  bio        TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE post_authors (
  post_id   INTEGER NOT NULL REFERENCES posts(id)   ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, author_id)
);
CREATE INDEX idx_post_authors_author ON post_authors (author_id);

CREATE TABLE terms (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  taxonomy TEXT NOT NULL,                          -- article_category | book_category | topic | era
  name     TEXT NOT NULL,
  UNIQUE (taxonomy, name)
);

CREATE TABLE post_terms (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  term_id INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, term_id)
);
CREATE INDEX idx_post_terms_term ON post_terms (term_id);

CREATE TABLE pages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE timeline_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  year_from INTEGER NOT NULL,                      -- negative = BCE
  year_to   INTEGER,
  era       TEXT NOT NULL DEFAULT '',
  title     TEXT NOT NULL,
  body      TEXT NOT NULL DEFAULT '',
  source    TEXT NOT NULL DEFAULT '',
  status    TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published'))
);
CREATE INDEX idx_timeline_year ON timeline_events (year_from);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL                              -- JSON
);

-- ── Translation memory & queue ────────────────────────────────────────────────
CREATE TABLE translations (
  scope       TEXT NOT NULL,                       -- post | page | ui | term | author | setting | timeline
  ref         TEXT NOT NULL,                       -- entity id (text) or UI key
  field       TEXT NOT NULL,                       -- title | excerpt | body | f.author | …
  lang        TEXT NOT NULL,
  text        TEXT NOT NULL,
  source_hash TEXT NOT NULL,                       -- hash of the Arabic source this was made from
  quality     TEXT NOT NULL DEFAULT 'auto' CHECK (quality IN ('auto','reviewed','manual')),
  provider    TEXT,
  model       TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (scope, ref, field, lang)
) WITHOUT ROWID;
CREATE INDEX idx_translations_lang ON translations (lang, scope);

CREATE TABLE translation_jobs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  scope      TEXT NOT NULL,
  ref        TEXT NOT NULL,
  lang       TEXT NOT NULL,
  priority   INTEGER NOT NULL DEFAULT 5,           -- lower runs first
  state      TEXT NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','running','done','failed')),
  attempts   INTEGER NOT NULL DEFAULT 0,
  run_after  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_error TEXT,
  chars      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (scope, ref, lang)
);
CREATE INDEX idx_jobs_pick ON translation_jobs (state, run_after, priority);

CREATE TABLE translation_usage (
  day       TEXT NOT NULL,
  provider  TEXT NOT NULL,
  chars_in  INTEGER NOT NULL DEFAULT 0,
  chars_out INTEGER NOT NULL DEFAULT 0,
  calls     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, provider)
) WITHOUT ROWID;

CREATE TABLE glossary (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  term_ar     TEXT NOT NULL,
  lang        TEXT NOT NULL DEFAULT '*',           -- '*' = every language (use for do-not-translate)
  translation TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'term' CHECK (kind IN ('term','person','place','org','keep')),
  note        TEXT NOT NULL DEFAULT '',
  UNIQUE (term_ar, lang)
);

-- ── Search (Arabic-normalized text, one row per post per language) ────────────
CREATE VIRTUAL TABLE search_index USING fts5(
  title, excerpt, body, authors, stems,
  lang UNINDEXED, post_id UNINDEXED, type UNINDEXED,
  tokenize = "unicode61 remove_diacritics 2"
);

-- ── Administration ───────────────────────────────────────────────────────────
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin','editor','reviewer')),
  password_hash TEXT NOT NULL,
  disabled      INTEGER NOT NULL DEFAULT 0,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until  TEXT,
  last_login_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE sessions (
  id_hash    TEXT PRIMARY KEY,                     -- sha-256 of the cookie token
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf       TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_sessions_user ON sessions (user_id);

CREATE TABLE audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL DEFAULT '',
  entity_id  TEXT NOT NULL DEFAULT '',
  meta       TEXT NOT NULL DEFAULT '{}',
  ip         TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_audit_created ON audit_log (created_at DESC);

CREATE TABLE media (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  path          TEXT NOT NULL UNIQUE,              -- relative to UPLOADS_DIR, e.g. 2026/10/abc123
  original_name TEXT NOT NULL DEFAULT '',
  mime          TEXT NOT NULL DEFAULT '',
  size          INTEGER NOT NULL DEFAULT 0,
  width         INTEGER,
  height        INTEGER,
  alt           TEXT NOT NULL DEFAULT '',
  source_url    TEXT,                              -- original remote URL when mirrored from the legacy site
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX idx_media_source ON media (source_url) WHERE source_url IS NOT NULL;

-- ── Visitor-facing data ──────────────────────────────────────────────────────
CREATE TABLE messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  kind       TEXT NOT NULL DEFAULT 'contact' CHECK (kind IN ('contact','book_request','translation_issue')),
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  subject    TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL DEFAULT '',
  post_id    INTEGER,
  page_url   TEXT NOT NULL DEFAULT '',
  lang       TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','archived')),
  ip_hash    TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_messages_status ON messages (status, created_at DESC);

CREATE TABLE subscribers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE,
  lang            TEXT NOT NULL DEFAULT 'ar',
  token           TEXT NOT NULL,
  consent_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  unsubscribed_at TEXT
);

CREATE TABLE redirects (
  from_path TEXT PRIMARY KEY,
  to_path   TEXT NOT NULL,
  code      INTEGER NOT NULL DEFAULT 301,
  hits      INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;

-- Privacy-friendly aggregate analytics: no IPs, no cookies, no per-visitor rows.
CREATE TABLE pageviews (
  day   TEXT NOT NULL,
  path  TEXT NOT NULL,
  lang  TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path, lang)
) WITHOUT ROWID;

CREATE TABLE search_queries (
  day     TEXT NOT NULL,
  q       TEXT NOT NULL,
  count   INTEGER NOT NULL DEFAULT 0,
  results INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, q)
) WITHOUT ROWID;

CREATE TABLE not_found_log (
  day   TEXT NOT NULL,
  path  TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
) WITHOUT ROWID;
