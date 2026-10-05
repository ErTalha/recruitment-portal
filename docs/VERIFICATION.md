# Verification report

Verification performed on 5 October 2026. Application seed as-of date: 5 October 2026. The preview was returned to clean seed after UI checks.

## Executed checks

- TypeScript project check: `node node_modules/typescript/bin/tsc -b` — passed.
- Production build: `node node_modules/vite/bin/vite.js build` — passed. Framework and chart code are split into separate assets.
- Focused calculation/transition checks: `node node_modules/tsx/dist/cli.mjs tests/verification.ts` — 27 groups passed. Exact output is in `test-results.txt`.
- Seed checks: minimum counts, every foreign key, share and invoice-line link resolve; no duplicate active candidate-job pairs; seeded invoices follow actual joining.
- Browser navigation: all 19 destinations rendered successfully; final pass after repairs. No captured browser console errors in the final pass.
- Browser persistence: created client remained after reload; Reset Demo restored the original data/date.
- Browser responsive review: inspected dashboard screenshots at desktop, 820 × 1000 tablet and 390 × 844 narrow width. Body width stayed within viewport. Narrow navigation collapses to accessible icons; tables and pipeline scroll horizontally.
- Browser workflow: created a 45-day percentage-fee client; imported a real selected CSV file with valid/invalid/duplicate rows; only the eligible row appeared in Candidates. Applied that profile to two jobs with independent recruiters/stages, progressed screening/shortlisting/submission, scheduled and rescheduled an interview, recorded feedback/completion, explicitly selected, prepared/revised an offer, inspected both versions and accepted the latest. A joining tracker appeared.
- Browser finance: confirmed seeded joining twice and observed exactly one placement. Issued a draft for INR 100,000 fee plus INR 18,000 tax, due 4 November 2026. Recorded and allocated an INR 40,000 receipt; outstanding became INR 78,000. Invoice/client/report views used the same records.

## Acceptance evidence

| Scenario | Evidence actually executed |
|---|---|
| AC-01 | Focused snapshot/default test; browser created a 45-day percentage-fee client |
| AC-02 | Engine duplicate/independence test; browser imported profile applied to two jobs |
| AC-03 | Parser test and real local file-chooser import: one eligible row imported; invalid and duplicate rows excluded |
| AC-04 | Guard/history tests plus browser Screening → Shortlisted → Submitted |
| AC-05 | Engine previous-slot/task/feedback test; browser rescheduled then completed with feedback and recommendation |
| AC-06 | Engine current salary/version/joining test, including percentage fee calculation; browser revised and accepted latest offer |
| AC-07 | Engine idempotence/vacancy test; browser repeated joining and displayed one linked placement |
| AC-08 | Engine draft/issue/uniqueness test; browser issued the new placement invoice |
| AC-09 | Executed 30/45/60/90 date rules and alternative/missing trigger guards; browser invoice due-date checked |
| AC-10 | Engine partial/excess/availability/cash test; browser partial allocation left INR 78,000 |
| AC-11 | Engine date change across all ageing buckets without invoice mutation; date control used in browser |
| AC-12 | Engine promise/dispute does not change contractual age; follow-up UI implemented/source-reviewed |
| AC-13 | Executed paid credit draft/issue, explicit over-settlement release and refund reconciliation |
| AC-14 | Executed reversal reopens balance, reduces cash and preserves original receipt/allocations |
| AC-15 | Executed free replacement confirmation: fulfilled case, zero second fee, unchanged original slot count |
| AC-16 | Executed 60/40 shares and fee-only collection reconciliation, including after current reassignment |
| AC-17 | Filtered CSV generation, quoting, numeric totals and context tested. Report filter visibly changed rows/total. Browser export was clicked, but disk-file retrieval is unverified (see below) |
| AC-18 | Executed unique-email, deactivation, open-work reassignment and historical-attribution invariance; permission UI/navigation source-reviewed |
| AC-19 | JSON round-trip, denied/full storage fallback and seed reset tests; browser reload and confirmed reset observed |
| AC-20 | Dashboard invoice/fee selectors reconcile in tests; browser invoice/receipt/report drill-downs inspected |

These are focused tests and selected browser paths, not a claim that every sub-action or browser variant was exercised. The coverage matrix distinguishes implemented local actions from the verification evidence.

## Repairs made from verification

- Date and time controls now handle input events consistently. A browser rescheduling test exposed a date reverting on the next render; the repaired control retained and saved the new date.
- Offer creation owns its ID/name/Draft state regardless of generic form metadata. Revision retains the previous record, exposes all versions and navigates to the new current version.
- Seed chronology was reconciled so issued invoices follow actual joinings; active application conflicts were removed.
- CSV calculated financial fields/totals/context now come from selector values, rather than blank entity properties.
- Later-period credit fees are attributed to the credit issue period even when the original invoice lies outside that period.
- Point-in-time receipt availability excludes future transaction entries; issued financial values remain locked.
- Credit issue validates individual line balances; duplicate active billing and allocation availability remain guarded.

## Exact environment limitations and manual checks

**RT-06 / AC-17:** the in-app browser's download-event inspector timed out while waiting for the report CSV. The export action was clicked and the same CSV-generation function is tested, but the final downloaded disk file was not retrieved. In a normal browser, open Reports → Client revenue, choose one client, Export CSV, and compare rows, numeric totals and FILTERS / GENERATED context with the displayed report. Repeat for Invoice register to check derived outstanding values.

**IV-02, IV-06, AR-04, RT-06:** print-friendly CSS and document/report content are implemented and source-reviewed. Native print dialogue, PDF output and physical pagination were not captured. Open an invoice, issued credit, receipt and filtered report; use their Print buttons in a normal browser, inspect preview, verify INR/date/payment terms and all filtered report rows, then cancel or Save as PDF. Do not treat this as a verified statutory invoice format.

**AT-03:** bundled and local object-URL preview controls are implemented. The CSV file chooser was tested; individual PDF/image resume rendering was not exercised across browsers. Select a fictional local PDF/image, inspect it, refresh, and verify that metadata remains while contents require reselection.

No real backend, external integration, login, payment processing or message sending was created or tested. Those are explicitly outside this prototype's boundary, including US-05 production authentication.

Production-preview smoke check: the built assets were served at port 4173; Dashboard and Revenue Forecast rendered with the correct restored seed totals and no captured console errors. Development and production origins have separate local demo storage.
