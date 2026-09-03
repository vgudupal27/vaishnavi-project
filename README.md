# My "Why" Recovery Reflection

Reflection worksheet and quality-improvement (QI) dashboard used to slow down
against-staff-advice (ASA) discharge decisions.

| Screen | What it does |
| --- | --- |
| **ASA Worksheet** | Six-step guided reflection, autosaved as a draft, saved as an ASA event |
| **Patient History** | Every ASA event and follow-up outcome for one Client ID, oldest first |
| **QI Dashboard** | Retention / ASA rates, why-factors, reasons for leaving, monthly volume |
| **Outcome Tracking** | 24/48/72-hour, discharge and follow-up outcomes per client |

## Two storage modes

The app picks its backend at build time:

| | Local mode | Shared mode |
| --- | --- | --- |
| When | Supabase env vars unset | `VITE_SUPABASE_*` set |
| Data lives | That one browser | Supabase Postgres |
| Sign-in | None | Shared staff password |
| Dashboard covers | That browser's events | Everyone's events |

Local mode is the default for `npm run dev` and the test suite, so you can work
on the app with no accounts at all.

## ⚠️ Test build — no real patient data

Free-tier Supabase carries no HIPAA BAA, all staff share one login, so records
have no per-user attribution, and anyone signed in can read every record. Keep
the "Development / Test Version" banner and use fake client IDs until the
[Path to production](#path-to-production) items are done.

## Requirements

- Node.js 20.19+ or 22.12+ (built on Node 22)
- npm
- For shared mode: a free Supabase account and a GitHub account

## Local development

```bash
npm install
npm run dev      # http://localhost:5173, local storage mode
```

`npm run dev` is required — the app is ES modules, so opening `index.html` over
`file://` will not work.

To develop against Supabase, copy `.env.example` to `.env.local` and fill it in.
`.env.local` is gitignored.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Run the test suite once (42 tests) |
| `npm run test:watch` | Tests in watch mode |

## Setting up Supabase (one time, ~10 minutes)

1. **Create a project** at [supabase.com](https://supabase.com) — free plan,
   pick the region closest to your facility.
2. **Create the tables.** SQL Editor → New query → paste all of
   [supabase/schema.sql](supabase/schema.sql) → Run. This creates both tables
   and turns on row-level security.
3. **Create the one shared staff account.** Authentication → Users → Add user →
   email `unit-staff@yourfacility.org`, set a strong password, tick
   *Auto Confirm User*. That password is what staff type; it is never stored in
   this repo.
4. **Turn off public sign-ups — do not skip this.** Authentication →
   Sign In / Providers → Email → disable *Allow new users to sign up*. The
   policies grant every signed-in user full read and write, so leaving sign-ups
   open lets any stranger register and read all records.
5. **Copy the keys.** Project Settings → API → Project URL and the `anon`
   public key. The anon key is designed to be public; row-level security and the
   password are the protection.

Free-plan gotcha: a project with **zero activity for about a week is paused**
and the app stops working until you open the dashboard and restore it. Weekly
use avoids it.

## Deploying to GitHub Pages

```bash
git init && git add . && git commit -m "Initial commit"
gh repo create vaishnavi-project --public --source=. --push
```

Then in the repository on github.com:

1. **Settings → Secrets and variables → Actions → New repository secret**, three
   times: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STAFF_EMAIL`.
   Miss these and the site still deploys, but in local storage mode with no
   sign-in and no shared data.
2. **Settings → Pages → Source: GitHub Actions.**
3. Push to `main`. [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
   runs the tests, builds, and publishes. Failing tests block the deploy.

Live at `https://<your-account>.github.io/vaishnavi-project/`.

The repo must be public for Pages on the free plan. No secrets live in the
source; the anon key is injected at build time and is safe to expose.

To change hosts later: `npm run build` and serve `dist/` anywhere — `netlify.toml`
is already included for Netlify, and `base: './'` keeps subfolder hosting working.

## Project layout

```
index.html            Markup for all four screens + the sign-in gate
src/css/styles.css    All styling (CSS variables at the top)
src/js/
  config.js           Schema: checkbox options, field map, CSV columns, storage keys
  env.js              Build-time config; decides local vs shared mode
  storage.js          Backend picker + the always-local draft
  storage/local.js    localStorage backend
  storage/remote.js   Supabase backend (row <-> object mapping)
  supabaseClient.js   Lazily-created Supabase client
  auth.js             Shared-password sign-in
  dom.js              $ / escapeHtml / message helpers
  form.js             Renders checkbox grids, reads and writes the worksheet
  wizard.js           Six-step navigation and progress bar
  router.js           Hash-based page switching (#dashboard, #history, …)
  dashboard.js        KPI and chart rendering
  stats.js            Pure aggregation maths
  csv.js              CSV serialize / parse / download
  history.js          Per-client timeline
  outcomes.js         Follow-up outcome capture
  main.js             Entry point — wires DOM events to the modules
supabase/schema.sql   Tables, indexes, row-level security policies
tests/                Vitest: stats, CSV, Supabase mapping, jsdom boot + auth gate
```

### Adding a checkbox option

Add it to `CHECKBOX_OPTIONS` in [src/js/config.js](src/js/config.js). Grid, saved
record, CSV export and dashboard all follow. No HTML, no database migration.

### Adding a new field

1. Add the input to `index.html` with an `id`.
2. Add `{ el: 'thatId', key: 'savedName' }` to `TEXT_FIELDS` in `config.js`.

Collect, populate, reset, draft, autosave and the Supabase `payload` column all
handle it automatically.

## Data model

Shared mode (Postgres): worksheet answers live whole in a `payload` jsonb
column, with the fields the app filters on lifted into real columns —
`client_id`, `event_date`, `staff`. That is why new questions need no migration.

Local mode (`localStorage`): keys `asaEvents`, `asaOutcomes`, `asaDraft`,
`asaSchemaVersion`.

```js
// an event, as the app sees it in either mode
{
  id, clientId, date, staff, createdAt,
  feelings: [], feelingOther, whatHappened,
  pastExperience, pastOutcome,
  why: [], whyOther, affectedPeople, futureGoal,
  stayOneDay, leaveToday, problems: [], problemOther,
  goals: [], goalOther, todayGoal, reason24,
  support: [], supportOther, finalReflection, currentFeeling,
  decision, interventionResult, finalDisposition,
  clientSignature, staffSignature, timeCompleted
}

// an outcome
{ id, clientId, status, period, notes, date, recordedAt }
```

The in-progress **draft is always local to the device**, in both modes — it is
one person's half-finished worksheet, not a record worth sharing.

Records are append-only: the app never updates or deletes a single event, and
`schema.sql` grants no update policy. "Clear All Test Data" in shared mode wipes
both tables for everyone and asks twice.

### Dashboard definitions

- **Initial retention** — events whose decision was "Continue treatment" or
  "Stay for today and revisit tomorrow", over all events.
- **Final ASA rate** — events with final disposition `ASA`, over all events.
- **24-hour retention** — 24-hour follow-ups marked "Stayed in treatment", over
  *24-hour follow-ups recorded* — an event with no follow-up is unknown, not a
  failure. Shows `—` when there are none.

## Path to production

Before this holds real client data:

1. **Per-user accounts** instead of the shared password, so records carry an
   author, and an append-only audit log of reads and writes.
2. **A signed BAA** with whoever stores the data — not available on free tiers.
   Supabase offers HIPAA on paid plans; confirm current terms directly.
3. **Tighter row-level security**: staff see their own facility/unit, not every
   record in the database.
4. **Server-side validation** — today the client decides what a valid record is.
5. **Backups and a retention/deletion policy** you can actually demonstrate.
6. Remove the test banner in `index.html` only once the above is real.

Only [src/js/storage/remote.js](src/js/storage/remote.js) and
[src/js/auth.js](src/js/auth.js) change for most of that; the rest of the app
does not know where data lives.
