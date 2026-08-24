# Fleet Inspection And Maintenance — Database

PostgreSQL. Forward-only migrations in `migrations/`, numbered and never edited once merged.
`schema.sql` is the consolidated current state, regenerated after each migration.

`0002_seed.sql` loads placeholder `maintenance` rows — the same rows the API seeds itself with — so
the UI shows data before the database is wired up. Replace them with real reference data.
