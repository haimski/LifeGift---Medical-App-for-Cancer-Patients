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
