# LifeGift

A mobile-first chat app for cancer patients to check in about symptoms during treatment, plus a staff dashboard for oncology teams to see who needs attention. Full design rationale lives in the plan at `~/.claude/plans/i-want-to-build-elegant-llama.md`; this file is the quick orientation for anyone (including future-you) opening the repo.

## Safety architecture — read before touching `lib/triage/`

**The LLM is never the sole authority on how urgent a symptom is.** Every severity grade (Green/Amber/Red) and every recommended action comes from the deterministic rules engine in `lib/triage/engine.ts`, built from data files transcribed from the UKONS 24-Hour Triage Tool and the UKONS Acute Oncology Initial Management Guidelines v4.0. The LLM's only jobs are (a) turning a patient's free text into structured fields the engine can evaluate, and (b) phrasing the engine's output warmly — it cannot invent a grade, soften one, or add advice the matched guideline doesn't already prescribe.

## Scope boundary — do not "complete" this without reading it first

This app deliberately implements only the **patient-reportable-symptom** guidelines — the ones a patient can self-report without lab values: chest pain, arthralgia/myalgia, bleeding/bruising, constipation, diarrhoea (incl. the immunotherapy/colitis variant), dyspnoea, fatigue, MSCC/back-pain red flags, mucositis, nausea, vomiting, skin rash, PPE/hand-foot skin toxicity, a simple extravasation alert, and a simple hypercalcaemia prompt — plus the **neutropenic sepsis rule**, which runs as a global override on every single turn regardless of presenting complaint.

**Explicitly excluded, on purpose:** the lab-value-driven immune-related-adverse-event algorithms (adrenal crisis, hypophysitis, thyroid dysfunction, hepatotoxicity, neuro-irAE, pneumonitis, renal toxicity, myocarditis) and clinician-workflow-only guidelines (steroid tapering, CVAD management, suspected-new-malignancy workup, effusion drainage, SVCO/cerebral oedema). These require lab values (cortisol, LFTs, troponin, creatinine) a patient can't self-report. If a message plausibly matches one of these, the system flags `possibleExcludedCondition`, forces at least Amber, and points the patient to their oncology team — it does **not** attempt the excluded algorithm. Don't "finish" guidelines 18–42 into the rules engine without re-opening this scope decision first; it wasn't an oversight.

**Fail-safe rule:** if a symptom doesn't cleanly match any known guideline, or required fields are missing after a few follow-up questions, the engine defaults to at least Amber. It never falls through to Green by default — under-triage is the dangerous failure mode here, not over-triage.

## Clinical data needs a second reviewer

Every threshold in `lib/triage/guidelines/*.ts` is transcribed from the source PDFs by an engineer (or an AI assistant), not a clinician. Before any real patient uses this, every guideline's criteria need a human clinical review against the literal source documents — the unit tests in `*.test.ts` prove the code matches what was transcribed, not that what was transcribed is correct.

## Development

```bash
npm run dev    # Turbopack dev server (Next.js 16 — Turbopack is default, no flag needed)
npm run lint   # ESLint flat config (next lint was removed in Next 16)
npm run build
npm run test   # Vitest — currently covers lib/triage/** (the rules engine)
```

Next.js 16 is newer than most training data know about — check `node_modules/next/dist/docs/` before assuming an API works the way it used to (async `params`/`searchParams`, `middleware.ts` → `proxy.ts`, etc.)

## Environment variables

Copy `.env.example` to `.env.local` and fill in `ANTHROPIC_API_KEY` (required — the extraction/phrasing steps in `lib/llm/` throw without it, which the route handles as a safe `error_failsafe`, never a crash). `LIFEGIFT_EXTRACTION_MODEL`/`LIFEGIFT_PHRASING_MODEL` are optional overrides of the default Haiku/Sonnet models. `DATABASE_URL` is required for persistence (see below).

## Persistence (`lib/db/`)

`PatientSession`/`Message`/`GradeEvent` (schema in `lib/db/schema.prisma`, a non-default location wired via `prisma.config.ts`) are written on every `/api/chat` turn via `lib/db/sessions.ts`, using Prisma's Neon serverless driver adapter (`lib/db/prisma.ts`) rather than a raw TCP connection — see the plan's "Prisma + serverless Postgres connections" risk for why. This is **best-effort**: a DB outage is caught and logged in `route.ts`'s `persistTurn`, never allowed to break, delay, or alter the patient-facing chat response.

To set up a real database:
1. Create a Postgres store from the Vercel dashboard (Neon-backed) and pull `DATABASE_URL` into `.env.local` (or copy it from the Vercel project settings).
2. Run `npx prisma migrate dev --name init` once, locally, to create the tables (needs `DATABASE_URL` reachable — `prisma.config.ts` loads `.env.local` via `dotenv` for the CLI, since defining a config file opts out of Prisma's own auto-loading).
3. Add `DATABASE_URL` to the Vercel project's environment variables alongside the Phase 6.5 vars, then `npx prisma migrate deploy` against production (or let your deploy pipeline run it).

`npm install`'s `postinstall` script runs `prisma generate` automatically (needed for `@prisma/client`'s types/runtime) — it does **not** need a reachable database, only the schema file.

## Deployment

Deployed to Vercel via GitHub's auto-deploy-on-push-to-main integration — every `git push origin main` redeploys automatically, no manual step. The same env vars from `.env.example` need adding to the Vercel project's settings separately; they don't sync from `.env.local`. `package.json`'s `engines.node` pins a Next-16-compatible Node runtime.
