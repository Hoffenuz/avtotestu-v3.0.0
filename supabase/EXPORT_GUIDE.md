# Supabase export without Docker

## Requirements

- PostgreSQL client tools installed on Windows
- `pg_dump.exe` available either on `PATH` or in `C:\Program Files\PostgreSQL\17\bin`
- Supabase database password from Dashboard -> Project Settings -> Database

## Run

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export-supabase.ps1
```

## Output

- `supabase/export/full.sql`
- `supabase/export/schema.sql`
- `supabase/export/data.sql`

## Production notes

- Do not commit the database password
- Do not put `service_role` keys into SQL files
- Keep RLS policies in migration files
- Keep exported data out of public repositories if it contains sensitive rows

## Suggested migration split

- `001_schema.sql`
- `002_policies.sql`
- `003_functions.sql`
- `004_triggers.sql`
