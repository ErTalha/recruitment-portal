# Demonstration guide

Open http://127.0.0.1:4173 (built preview). If using the development server, substitute port 5173 in the links below. The sidebar exposes all 19 destinations. This is one Super Admin workspace; changing the proposed role preview does not reduce access. Use **All actions** on a record for the contextual workflow, **Quick create** for shared creation forms, and **Ctrl/Cmd + K** for global search. Record links, sidebar routes, browser Back and related tabs use stable IDs.

## Start, persistence and reset

Start at **5 October 2026**. The top bar and Settings both expose the as-of date. It changes ageing, upcoming/overdue alerts, guarantee expiry and point-in-time financial views; it does not rewrite existing due dates, commercial snapshots or history. Day-only arithmetic uses UTC midnight and calendar days, so it does not shift dates across timezones.

Changes are stored as versioned browser JSON under `northstar-recruitment-demo-v1`. If storage is blocked or full, the application retains working state in memory and shows a warning. Closing that visit loses in-memory changes. Each browser origin/profile has its own data. Selected local file contents are available in the current profile page only; filename/type/size/date metadata persists, but contents are not uploaded or saved. A bundled fictional CV remains available after refresh.

Use **Settings → Reset Demo → Confirm Reset Demo** before each independent walkthrough. This restores all fictional records, configuration and the initial date, and clears retained table search filters. Reset is destructive only to the local demo changes. CSV exports are reports, not full-store backups.

Seed version 1 contains 8 clients, 16 contacts, 20 jobs, 61 candidates, 83 applications, 7 users (5 recruiters), 35 interviews, 28 offers, 23 joining trackers, 18 placements, 4 replacement cases, 12 invoices, 10 receipts, 1 issued credit, 1 refund and 18 tasks. Every foreign-key reference resolves. Free and explicitly billable replacements are seeded in addition to original placements. All four payment durations and all ageing buckets are represented.

## 1. New placement to collection

1. Open the built-in demonstration guide or [Joining 17](http://127.0.0.1:4173/#/joinings/jo17). Follow its application, candidate, job and client links. It belongs to Asterwave Labs and has a current accepted offer.
2. **Confirm actual joining** with 5 October 2026, the recorded annual salary and a primary recruiter share of 100%. To demonstrate split attribution, choose another contributor and set the primary share to 60%. Save locally. Repeat the confirmation: it returns the existing placement.
3. Open the **Placements** tab. There must be one linked placement and one new original filled vacancy. Inspect its fee, 30-day cycle, guarantee and stored recruiter shares. Copy its stable placement ID.
4. Go to **Invoices → Prepare invoice**. Enter that ID, issue date 5 October 2026, 30 days, Invoice date, zero discount and 18% illustrative tax. Save the draft, open it, and **Issue invoice**. With the fixed INR 100,000 fee, total is INR 118,000 and due date is **4 November 2026**. Drafts do not increase pipeline or uninvoiced totals; issue moves the fee to net invoiced fees.
5. **Payments → Record fictional receipt**: Asterwave Labs, 5 October 2026, INR 40,000 and a DEMO reference. Open the receipt and **Allocate receipt** to the new invoice. Outstanding becomes INR 78,000; settlement becomes Partially Paid. Actual cash increases only once.
6. Record a second INR 78,000 receipt and allocate it to the same invoice. It becomes Paid with zero receivable. An excess receipt can retain unapplied credit.
7. Compare the invoice, client finance tabs, Collections, Cash Flow, client report and recruiter fee collections. Tax is excluded from recruiter collection attribution.

For a full ATS walkthrough before joining: create a candidate or import the supplied CSV fixture; apply the profile to two different open jobs. Use **Change stage** for Screening, Shortlisted and Submitted to Client. Schedule an interview; edit it to reschedule with a reason, then record Completed with feedback and recommendation. Explicitly select the application. Prepare an offer, revise its salary, use the latest version and record Accepted with response and expected dates. This creates a joining tracker. For percentage-fee demonstration use a job under Birchline Systems or Cloudmere Works; the salary revision changes the percentage fee estimate.

## 2. Replacement without duplicate revenue

1. Reset. Open [Guarantee case 1](http://127.0.0.1:4173/#/replacements/rp1), linked to original Placement 13. Employment ended within its stored guarantee.
2. **Review eligibility / treatment**: Approved, Free replacement, no guarantee restart, and a decision reason. No invoice, credit, receipt or cash is changed by approval.
3. **Assign replacement candidate**: choose Lane Sample 60 (`ca60`) and an active recruiter. A new application is linked to the same job and case. It does not create an open original vacancy or contribute a second original pipeline fee.
4. Open that application and progress it. For a short demonstration, select **Admin fast-track (no interview)** with the reason “Client agreed no additional interview for replacement”. Prepare an offer and record acceptance with joining details.
5. Open the joining tracker and confirm actual joining. The case becomes Fulfilled. Its second placement is **Non Billable**, has zero fee and links to the original vacancy. Filled original slots and net fees remain unchanged.
6. Inspect the original placement, financial history and recruiter activity. Guarantee restart is off by default; an explicitly agreed restart can be enabled during review. Seed case 2 is already fulfilled free; seed case 3 demonstrates explicitly billable treatment.

## 3. Collection exception

1. Reset. Open [NST-2026-003](http://127.0.0.1:4173/#/invoices/iv3). Inspect outstanding, contractual due date, overdue days and the dispute flag.
2. **Collection promise / dispute**: enter a future promise date, probability, owner, dispute reason and follow-up reason. The forecast date changes; ageing does not. Clear the disputed checkbox with a resolution note to record resolution.
3. **Prepare credit note** for an agreed amount and reason, optionally selecting a particular placement line. The draft has no financial effect. Open the Credits tab and **Issue credit note**. Original issued invoice values remain visible.
4. Record a same-client fictional receipt and allocate it. A cross-client or excessive allocation is rejected. Open the receipt and **Reverse receipt** with a reason: original cash/allocations remain traceable, cash falls on the reversal date, and outstanding reopens. A refunded receipt cannot be fully reversed.
5. For the refund branch, open [NST-2026-001](http://127.0.0.1:4173/#/invoices/iv1). It has a paid invoice with an issued fee credit and over-settlement. **Release over-settlement** to receipt `rc1`, with a reason and amount up to its displayed invoice credit. This creates available receipt credit without changing cash.
6. Open [REC-001](http://127.0.0.1:4173/#/payments/rc1/receipts) and **Record fictional refund**, limited to the available credit. Cash decreases on the refund date. Alternatively allocate released credit to another same-client invoice. Allocations and credit release are not additional cash events.
7. Move the demo date beyond a due or promise date. Review Collections buckets, missed-promise alerts, Cash Flow unscheduled overdue and client statements.

## Other review tasks

- **CSV import**: use `public/demo-import.csv` or download the candidate template. The fixture contains one valid, one invalid-email and one duplicate-email row. Map columns, review issues, and confirm only eligible rows. No remote upload occurs. Duplicate candidate merge shows the action's effects, preserves application/placement references and notes, and refuses conflicting active candidate/job pairs. Review and withdraw/reject a conflicting application before retrying.
- **Pipeline bulk actions**: select cards/rows, choose stage or recruiter, inspect the per-record validation summary and confirm eligible records. Invalid records stay unchanged. Dragging and the stage menu use the same guards.
- **Users**: edit roles, module/action permissions and stored scope previews. Deactivate a recruiter with a reason, then Reassign open work. Historical placement shares do not move. Invitation/reset actions record an unsent preview only.
- **Commercial terms**: edit clients, job overrides or placement snapshots. Existing issued invoice amounts and due dates stay locked. A reasoned contractual due-date amendment is separate from a promise. Joining/client acceptance triggers need their dates; grouped joining triggers need the same date.
- **Reports**: choose Client revenue or Recruiter performance explicitly; use applicable filters, review the date basis and as-of balance labels, export current filtered rows with totals/context, or print. Operational report catalogues cover vacancies, pipeline, interviews, offers, joinings, cases, invoices, receipts, ageing and forecast.
- **Manual outflows**: Cash Flow supports actual/forecast management entries only. Opening cash and outflows form a demonstration balance, not an accounting ledger.
- **Printing**: invoices, credit notes and receipts expose record-specific print buttons; reports expose Print. Use a normal desktop browser's print dialogue. Financial documents omit navigation and secondary profile content. Report printing expands all filtered table rows. Verify paper size and pagination before sharing.

## Defaults and unresolved production decisions

The prototype uses permanent recruitment, one agency, British English, INR, Asia/Calcutta appointment labels and DD MMM YYYY date display. Salary means annual fixed CTC; reference forecast salaries use the midpoint of the recorded annual range unless current offer terms exist. Fixed fees use their agreed amount. Initial fee default is 8.33%, invoice-date trigger, 30 days and 90-day guarantee. All 30/45/60/90-day durations are calendar days. Illustrative tax defaults to 18% in invoice preparation, rounded per line, and is not tax advice or filing.

The exact capacity formula is `Σ(fee × probability) × min(1, remaining original vacancies / Σprobability)`. Joined, terminal, held and replacement applications are excluded; closed/held jobs contribute zero. Capacity is applied before recruiter/month grouping. Missing dates are Unscheduled. Active replacement cases reserve the original slot until explicit reopening. Free replacements create no second fee. Initial replacement guarantee does not restart; recorded contractual conditions and reasoned eligibility overrides remain illustrative.

Pipeline expected fees, uninvoiced fees (with draft subset), credit-adjusted net invoiced fees and actual cash are separate measures. Issued credits affect their own issue period even when the invoice was issued earlier. Allocated collections and unapplied credit are distinct; fee-only recruiter collections exclude tax. Due-date commitments do not reset ageing. Financial cancellation cannot erase paid/credited history. No commission payout, payroll, withholding, exchange conversion, statutory accounting or retention/security enforcement is implemented. Production policies in the Scope's client-confirmation checklist remain decisions for a later project.

