-- Forward-only migration 0001: initial schema
CREATE TABLE IF NOT EXISTS maintenance (
    id           BIGSERIAL PRIMARY KEY,
    title        TEXT        NOT NULL,
    reference    TEXT        NOT NULL DEFAULT '',
    status       TEXT        NOT NULL DEFAULT 'new',
    priority     TEXT        NOT NULL DEFAULT 'normal',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
