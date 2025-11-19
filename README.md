## Overview

Next.js 16 app configured with Supabase as the backend for the PKL management experience (onboarding, presensi, laporan, kegiatan, dan jadwal). All server routes live under `app/api` and talk to Supabase via the service-role client.

## Requirements

- Node 18+
- Supabase project with the schema from `schema.sql` (see Supabase SQL editor).
- Environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-key>
SUPABASE_SERVICE_ROLE_KEY=<server-key>   # keep server-only
```

## Running the app

```bash
npm install
npm run dev
```

Dev server: `http://localhost:3000`.

### Supabase health & seed helpers

- `GET /api/health/supabase` – quick connectivity check.
- `POST /api/dev/seed` – creates demo user `demo@student.app / Demo1234!` plus sample attendance, activities, and reports for local testing.

## Authentication & Validation

All protected routes expect an `Authorization: Bearer <access_token>` header (Supabase session access token). The helper in `lib/apiAuth.ts` handles:

- Missing/invalid header → 401.
- Supabase token lookup failure → 401.
- Generic server issues → 500 JSON with `{ ok: false, message }`.

Each route performs its own payload validation (see below). Requests that fail validation return HTTP 400 with a descriptive message.

## REST Endpoints

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/profile` | `GET`, `PUT` | Fetch or update the current user profile. Auto-creates on first call. |
| `/api/attendance` | `GET`, `POST` | List presensi records (filterable by `start`/`end`) or submit Masuk/Pulang with pop-up logging. |
| `/api/activities` | `GET`, `POST` | List or create kegiatan harian. Optional `tanggal` filter. |
| `/api/activities/[id]` | `GET`, `PUT`, `DELETE` | Detail, edit, or delete a specific kegiatan. |
| `/api/reports` | `GET`, `POST` | List or create daily reports with automatic history entry. Optional `status` filter. |
| `/api/reports/[id]` | `GET`, `PUT`, `DELETE` | Show detail (including history), update, or delete a report. |
| `/api/schedule` | `GET`, `POST` | CRUD jadwal/pengingat items. Optional `tanggal` filter. |
| `/api/schedule/[id]` | `PUT`, `DELETE` | Edit or remove a schedule item. |

## Validation Rules Per Route

- **Profile (`PUT /api/profile`)**
  - Only `full_name`, `username`, `avatar_url`, `role` accepted.
  - 400 if no updatable fields supplied.

- **Attendance (`POST /api/attendance`)**
  - Requires `tanggal` (ISO date) and `status` (`masuk`/`pulang`).
  - Optional `timestamp`, `lokasi`, `catatan`.
  - Automatically sets `masuk_at` or `pulang_at` using provided timestamp or current time.
  - Records unique per `(profile_id, tanggal, status)`; repeated calls update the same row and append a new `attendance_events` entry.

- **Activities**
  - `POST /api/activities`: requires `tanggal`, `jam_mulai`, `jam_selesai`, `kegiatan`. Optional `catatan`.
  - `PUT /api/activities/[id]`: same fields validated by database constraints; request must belong to the same user.

- **Reports**
  - `POST /api/reports`: requires `judul`, `tanggal`, `isi`; optional `status` (defaults to `draft`). Always logs to `report_history`.
  - `PUT /api/reports/[id]`: accepts `judul`, `tanggal`, `isi`, `status`; auto-updates `updated_at` and logs to history.

- **Schedule**
  - `POST /api/schedule`: requires `tanggal` and `judul`; optional `jam`, `deskripsi`.
  - `PUT /api/schedule/[id]`: same fields as create; scoped to the requesting user.

## Example Usage

```ts
const session = await supabase.auth.getSession();
const res = await fetch('/api/attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.data.session?.access_token}`,
  },
  body: JSON.stringify({ tanggal: '2025-11-19', status: 'masuk' }),
});
const json = await res.json();
```

Every response includes `{ ok: boolean, ... }` so the UI can trigger pop-ups/toasts that match the designs. Let the maintainer know if you add new screens so the table above stays in sync.
