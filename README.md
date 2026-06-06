# Rail Schematic Trainer

A gamified web app to help rail workers memorize a **blank** light-rail schematic
(San Diego MTS Trolley) for a job qualification test.

Learners study three label types on an otherwise blank diagram:

- **Signals** — letter + 2–3 digits + optional trailing letters (e.g. `E18LA`, `M571`, `O22RB`)
- **Stations** — alphanumeric names shown in rectangles (e.g. `La Mesa Blvd`, `Grossmont Center`)
- **Crossings** — street names running parallel to a line (e.g. `University Ave`, `Friars Rd.`)

Plus mileposts (pentagons) and `SS` markers.

## How schematic data is authored

Each schematic is a single **`.json`** file that is the source of truth for both the
drawn diagram and the interactive markers. The app renders the blank SVG and the
clickable hotspots from the same coordinates, so they always line up. See
[`docs/schematic-format.md`](docs/schematic-format.md).

## Tech stack

- **web/** — React + TypeScript + Vite, SVG-rendered diagram and games
- **server/** — Express + TypeScript, Prisma + SQLite (local-first)
- **Auth** — email/password (bcrypt) + JWT; roles `admin` | `learner`
- **Testing (TDD)** — Vitest, React Testing Library, Supertest, Playwright (e2e)

## Getting started

```bash
npm install                                  # install all workspaces
cp server/.env.example server/.env           # local config (DB + JWT secret)
npm --workspace server run prisma:migrate    # create the SQLite database
npm --workspace server run seed              # create the admin + load seed schematics
npm test                                     # run the test suites
npm run dev                                  # run server + web in dev
```

The seed creates an admin account (default `admin@rail.test` / `admin12345`, override with
`ADMIN_EMAIL` / `ADMIN_PASSWORD`) and loads any schematic JSON files in `server/seed/`.
Admins can also upload new schematic JSON files from the in-app admin screen.

## Games

1. **Pin Drop** — given a name, tap its spot on the blank schematic
2. **Name It** — a marker glows; name it (multiple-choice → free text)
3. **Flashcard Drill** — spaced repetition, daily due queue
4. **Run the Line** — name everything along a line in order, against the clock

With XP, levels, daily streaks, per-category mastery, and a leaderboard.

## Project status

Built in phases (TDD; each phase ends green-tested):

- [x] **Phase 0** — scaffold, test harness, database schema
- [x] **Phase 1** — auth + accounts
- [x] **Phase 2** — schematic JSON validation, seed, upload, and admin CRUD
- [x] **Phase 4** — vector schematic renderer (blank diagram + label/filter modes)
- [x] **Phase 5** — Game 1 (Pin Drop) + proximity scoring + attempt tracking
- [ ] Phase 6 — Games 2–4 + SRS + XP/streaks/leaderboard
- [ ] Phase 7 — polish, stats, e2e
