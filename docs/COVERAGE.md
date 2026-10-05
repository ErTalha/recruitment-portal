# Functional coverage matrix

129 Section 6 requirement IDs from the supplied Scope of Work. Status means an action exists and was source-reviewed; it does not mean every branch was exercised through the browser. Focused tests cover the listed calculation/transition paths. See VERIFICATION.md for exact UI evidence and pending browser-output checks. US-05 is deliberately excluded production functionality.

| ID | Screen | Local action / control | Verification status |
|---|---|---|---|
| CL-01 | Clients | Create / edit / archive; duplicate name or contact warning | Implemented; source-reviewed. Related focused paths: AC-01 |
| CL-02 | Clients | Add hiring and billing contacts; preferences and local timelines | Implemented; source-reviewed. Related focused paths: AC-01 |
| CL-03 | Clients | Edit commercial terms; job and placement snapshots | Implemented; source-reviewed. Related focused paths: AC-01 |
| CL-04 | Clients | Owner, industry, status and positive-balance filters | Implemented; source-reviewed. Related focused paths: AC-01 |
| CL-05 | Clients | Linked contact, job, application, placement, case and finance tabs | Implemented; source-reviewed. Related focused paths: AC-01 |
| CL-06 | Clients | Inactive confirmation reason when open work or unpaid balances exist | Implemented; source-reviewed. Related focused paths: AC-01 |
| JB-01 | Jobs | Create, edit, duplicate with a fresh reference, and change status | Implemented; source-reviewed. Related focused paths: AC-01, AC-02, AC-07 |
| JB-02 | Jobs | Reasoned hold, cancellation and reopening; progression guard | Implemented; source-reviewed. Related focused paths: AC-01, AC-02, AC-07 |
| JB-03 | Jobs | Lead and supporting recruiter configuration with history | Implemented; source-reviewed. Related focused paths: AC-01, AC-02, AC-07 |
| JB-04 | Jobs | Stage counts, interviews, offers, joinings and vacancy selectors | Implemented; source-reviewed. Related focused paths: AC-01, AC-02, AC-07 |
| JB-05 | Jobs | Job term override with source and offer-stage amendment reason | Implemented; source-reviewed. Related focused paths: AC-01, AC-02, AC-07 |
| JB-06 | Jobs | Candidate-to-job action; active duplicate guard | Implemented; source-reviewed. Related focused paths: AC-01, AC-02, AC-07 |
| JB-07 | Jobs | Original slot capacity warning with reasoned override | Implemented; source-reviewed. Related focused paths: AC-01, AC-02, AC-07 |
| JB-08 | Jobs | Explicit close / reopen actions with reason | Implemented; source-reviewed. Related focused paths: AC-01, AC-02, AC-07 |
| AT-01 | Candidates | Reusable profile create, edit, archive and application links | Implemented; source-reviewed. Related focused paths: AC-02, AC-03 |
| AT-02 | Candidates | ATS criteria, searchable profile fields and locally saved searches | Implemented; source-reviewed. Related focused paths: AC-02, AC-03 |
| AT-03 | Candidates | Bundled CV, selected local preview and retained metadata | Implemented; source-reviewed. Related focused paths: AC-02, AC-03 |
| AT-04 | Candidates | Duplicate warning and reviewed merge with conflict guard | Implemented; source-reviewed. Related focused paths: AC-02, AC-03 |
| AT-05 | Candidates | CSV template, real parser, mapping, validation and confirmed eligible import | Implemented; source-reviewed. Related focused paths: AC-02, AC-03 |
| AT-06 | Candidates | Apply to job; profile tabs expose all applications and linked outcomes | Implemented; source-reviewed. Related focused paths: AC-02, AC-03 |
| AT-07 | Candidates | Explicit consent edits, date in activity and submission guard | Implemented; source-reviewed. Related focused paths: AC-02, AC-03 |
| AT-08 | Candidates | Profile availability independent from application stages | Implemented; source-reviewed. Related focused paths: AC-02, AC-03 |
| PL-01 | Pipeline | Board / table, client, job, recruiter, source, stage and date filters | Implemented; source-reviewed. Related focused paths: AC-04, AC-06, AC-07 |
| PL-02 | Pipeline | All documented stages; Joined routes to actual joining confirmation | Implemented; source-reviewed. Related focused paths: AC-04, AC-06, AC-07 |
| PL-03 | Pipeline | Drag or stage menu through the same guarded action | Implemented; source-reviewed. Related focused paths: AC-04, AC-06, AC-07 |
| PL-04 | Pipeline | Recruiter, interview / exception, offer, acceptance and joining guards | Implemented; source-reviewed. Related focused paths: AC-04, AC-06, AC-07 |
| PL-05 | Pipeline | Reasoned terminal outcomes, reopen action and stage timeline | Implemented; source-reviewed. Related focused paths: AC-04, AC-06, AC-07 |
| PL-06 | Pipeline | Local unsent submission and communication preview | Implemented; source-reviewed. Related focused paths: AC-04, AC-06, AC-07 |
| PL-07 | Pipeline | Bulk eligibility preview and confirmation; invalid rows unchanged | Implemented; source-reviewed. Related focused paths: AC-04, AC-06, AC-07 |
| PL-08 | Pipeline | Follow-up and stage-age alerts with record links | Implemented; source-reviewed. Related focused paths: AC-04, AC-06, AC-07 |
| IN-01 | Interviews | Schedule rounds and inspect calendar, table and linked records | Implemented; source-reviewed. Related focused paths: AC-05 |
| IN-02 | Interviews | Reschedule / cancel / no-show with previous slot and reason | Implemented; source-reviewed. Related focused paths: AC-05 |
| IN-03 | Interviews | Feedback, ratings and recommendation required for completion | Implemented; source-reviewed. Related focused paths: AC-05 |
| IN-04 | Interviews | Candidate / coordinator time-overlap guard; reasoned override | Implemented; source-reviewed. Related focused paths: AC-05 |
| IN-05 | Interviews | Unsent invitation preview and linked reminder / follow-up task | Implemented; source-reviewed. Related focused paths: AC-05 |
| IN-06 | Interviews | Completion preserves application decision; explicit selection | Implemented; source-reviewed. Related focused paths: AC-05 |
| OF-01 | Offers | Selection action; revision creates one latest version and version tab | Implemented; source-reviewed. Related focused paths: AC-06 |
| OF-02 | Offers | Prepare offer and record unsent Sent event | Implemented; source-reviewed. Related focused paths: AC-06 |
| OF-03 | Offers | Draft, Sent, Accepted, Declined, Expired, Withdrawn decisions | Implemented; source-reviewed. Related focused paths: AC-06 |
| OF-04 | Offers | Annual salary revision; acceptance response and joining dates | Implemented; source-reviewed. Related focused paths: AC-06 |
| OF-05 | Offers | Acceptance creates or updates one joining tracker | Implemented; source-reviewed. Related focused paths: AC-06 |
| JO-01 | Joinings / Placements | Expected, overdue, deferred, failed and confirmed queues | Implemented; source-reviewed. Related focused paths: AC-07, AC-08, AC-16 |
| JO-02 | Joinings / Placements | Reasoned deferral or failed joining; no failed placement creation | Implemented; source-reviewed. Related focused paths: AC-07, AC-08, AC-16 |
| JO-03 | Joinings / Placements | Accepted offer or admin exception plus actual joining confirmation | Implemented; source-reviewed. Related focused paths: AC-07, AC-08, AC-16 |
| JO-04 | Joinings / Placements | Idempotent placement, term snapshot and 100% recruiter shares | Implemented; source-reviewed. Related focused paths: AC-07, AC-08, AC-16 |
| JO-05 | Joinings / Placements | Billing selector and linked financial / replacement records | Implemented; source-reviewed. Related focused paths: AC-07, AC-08, AC-16 |
| JO-06 | Joinings / Placements | Employment end with guarantee request and preserved original placement | Implemented; source-reviewed. Related focused paths: AC-07, AC-08, AC-16 |
| JO-07 | Joinings / Placements | Reasoned snapshot amendment; issued values remain locked | Implemented; source-reviewed. Related focused paths: AC-07, AC-08, AC-16 |
| RP-01 | Replacements | Stored guarantee end date and expiry alerts | Implemented; source-reviewed. Related focused paths: AC-15 |
| RP-02 | Replacements | Request and review with date eligibility and case states | Implemented; source-reviewed. Related focused paths: AC-15 |
| RP-03 | Replacements | Reasoned override and explicit financial treatment | Implemented; source-reviewed. Related focused paths: AC-15 |
| RP-04 | Replacements | Assign new candidate application to original job and case | Implemented; source-reviewed. Related focused paths: AC-15 |
| RP-05 | Replacements | Replacement joining fulfils case; free fee remains zero | Implemented; source-reviewed. Related focused paths: AC-15 |
| RP-06 | Replacements | Explicit guarantee-restart checkbox; default no restart | Implemented; source-reviewed. Related focused paths: AC-15 |
| RP-07 | Replacements | Operational approval has no automatic credit, cancellation or refund | Implemented; source-reviewed. Related focused paths: AC-15 |
| RP-08 | Replacements | Duplicate open-case guard; distinct-request override reason | Implemented; source-reviewed. Related focused paths: AC-15 |
| RE-01 | Recruiter Performance / Users | Configure recruiter profiles; assign / reassign work with history | Implemented; source-reviewed. Related focused paths: AC-16, AC-18 |
| RE-02 | Recruiter Performance / Users | Period targets for submissions, interviews, placements and net fees | Implemented; source-reviewed. Related focused paths: AC-16, AC-18 |
| RE-03 | Recruiter Performance / Users | Comparison exposes sourcing, applications, decisions and replacements | Implemented; source-reviewed. Related focused paths: AC-16, AC-18 |
| RE-04 | Recruiter Performance / Users | Confirm placement with recruiter shares totalling 100% | Implemented; source-reviewed. Related focused paths: AC-16, AC-18 |
| RE-05 | Recruiter Performance / Users | Stored-share net fees and fee-only allocated collections | Implemented; source-reviewed. Related focused paths: AC-16, AC-18 |
| RE-06 | Recruiter Performance / Users | Targets, cohort conversion and time-to-fill with record links | Implemented; source-reviewed. Related focused paths: AC-16, AC-18 |
| RE-07 | Recruiter Performance / Users | Free replacement excluded from original fees and vacancy counts | Implemented; source-reviewed. Related focused paths: AC-16, AC-18 |
| PC-01 | Clients / Placements / Invoices / Collections | 30 / 45 / 60 / 90-day terms editable and snapshotted | Implemented; source-reviewed. Related focused paths: AC-09, AC-11, AC-12 |
| PC-02 | Clients / Placements / Invoices / Collections | UTC date-only calendar addition selector | Implemented; source-reviewed. Related focused paths: AC-09, AC-11, AC-12 |
| PC-03 | Clients / Placements / Invoices / Collections | Required alternative trigger and grouping-date guards | Implemented; source-reviewed. Related focused paths: AC-09, AC-11, AC-12 |
| PC-04 | Clients / Placements / Invoices / Collections | Finance details and printable payment-cycle presentation | Implemented; source-reviewed. Related focused paths: AC-09, AC-11, AC-12 |
| PC-05 | Clients / Placements / Invoices / Collections | Reasoned due-date amendment retains original date and history | Implemented; source-reviewed. Related focused paths: AC-09, AC-11, AC-12 |
| PC-06 | Clients / Placements / Invoices / Collections | Promise / expected date separate from contractual due date | Implemented; source-reviewed. Related focused paths: AC-09, AC-11, AC-12 |
| PC-07 | Clients / Placements / Invoices / Collections | Cycle, client, this-week, this-month and overdue filters | Implemented; source-reviewed. Related focused paths: AC-09, AC-11, AC-12 |
| IV-01 | Invoices | Eligible placement draft selection and compatible grouping guard | Implemented; source-reviewed. Related focused paths: AC-08, AC-09, AC-13 |
| IV-02 | Invoices | Discount and illustrative rounded tax; invoice document preview | Implemented; source-reviewed. Related focused paths: AC-08, AC-09, AC-13 |
| IV-03 | Invoices | Issue validation, numbering and financial-value lock | Implemented; source-reviewed. Related focused paths: AC-08, AC-09, AC-13 |
| IV-04 | Invoices | Separate document / settlement / overdue / dispute indicators | Implemented; source-reviewed. Related focused paths: AC-08, AC-09, AC-13 |
| IV-05 | Invoices | Draft line edit / removal and reasoned unpaid cancellation guard | Implemented; source-reviewed. Related focused paths: AC-08, AC-09, AC-13 |
| IV-06 | Invoices | Line-specific credit draft, issue, amount guard and printable preview | Implemented; source-reviewed. Related focused paths: AC-08, AC-09, AC-13 |
| IV-07 | Invoices | Signed over-settlement credit with explicit release / transfer / refund | Implemented; source-reviewed. Related focused paths: AC-08, AC-09, AC-13 |
| IV-08 | Invoices | Unsent billing or reminder text recorded as local activity | Implemented; source-reviewed. Related focused paths: AC-08, AC-09, AC-13 |
| AR-01 | Payments | Record fictional receipts with date, method and reference | Implemented; source-reviewed. Related focused paths: AC-10, AC-13, AC-14 |
| AR-02 | Payments | Explicit multiple invoice allocations; availability and balance guard | Implemented; source-reviewed. Related focused paths: AC-10, AC-13, AC-14 |
| AR-03 | Payments | Unapplied credit and subsequent allocation actions | Implemented; source-reviewed. Related focused paths: AC-10, AC-13, AC-14 |
| AR-04 | Payments | Invoice breakdown, client financial tabs and receipt preview | Implemented; source-reviewed. Related focused paths: AC-10, AC-13, AC-14 |
| AR-05 | Payments | Linked reversal with reason; original allocation history preserved | Implemented; source-reviewed. Related focused paths: AC-10, AC-13, AC-14 |
| AR-06 | Payments | Refund only against available credit; separate dated cash event | Implemented; source-reviewed. Related focused paths: AC-10, AC-13, AC-14 |
| AR-07 | Payments | Same-client / currency guard and pre-confirmation amount review | Implemented; source-reviewed. Related focused paths: AC-10, AC-13, AC-14 |
| OD-01 | Collections | Positive overdue issued invoices and contractual overdue days | Implemented; source-reviewed. Related focused paths: AC-11, AC-12 |
| OD-02 | Collections | Current, 1–30, 31–60, 61–90 and Over 90 buckets | Implemented; source-reviewed. Related focused paths: AC-11, AC-12 |
| OD-03 | Collections | Local communication, promises, follow-ups and collection tasks | Implemented; source-reviewed. Related focused paths: AC-11, AC-12 |
| OD-04 | Collections | Dispute owner, reason and explicit resolution; balance stays aged | Implemented; source-reviewed. Related focused paths: AC-11, AC-12 |
| OD-05 | Collections | Collection date and probability; unscheduled-overdue group | Implemented; source-reviewed. Related focused paths: AC-11, AC-12 |
| OD-06 | Collections | Allocation completes linked collection task; missed-promise alert | Implemented; source-reviewed. Related focused paths: AC-11, AC-12 |
| ER-01 | Revenue Forecast | Per-application annual-salary estimate and weighted contribution | Implemented; source-reviewed. Related focused paths: capacity-limit test |
| ER-02 | Revenue Forecast | Editable probabilities; joined, held and terminal exclusions | Implemented; source-reviewed. Related focused paths: capacity-limit test |
| ER-03 | Revenue Forecast | Exact capacity formula applied across job before grouping | Implemented; source-reviewed. Related focused paths: capacity-limit test |
| ER-04 | Revenue Forecast | Uninvoiced fees once; draft subset shown separately | Implemented; source-reviewed. Related focused paths: capacity-limit test |
| ER-05 | Revenue Forecast | Client / job / recruiter / month breakdown and Unscheduled dates | Implemented; source-reviewed. Related focused paths: capacity-limit test |
| ER-06 | Revenue Forecast | Visible formula assumptions and underlying record links | Implemented; source-reviewed. Related focused paths: capacity-limit test |
| CF-01 | Cash Flow | Gross receipts, reversals, refunds, net cash and manual outflows | Implemented; source-reviewed. Related focused paths: AC-10, AC-14 |
| CF-02 | Cash Flow | Issued balances weighted by collection probability and forecast date | Implemented; source-reviewed. Related focused paths: AC-10, AC-14 |
| CF-03 | Cash Flow | Separate lower-confidence uninvoiced planned collections | Implemented; source-reviewed. Related focused paths: AC-10, AC-14 |
| CF-04 | Cash Flow | Create / edit manual actual or forecast outflows | Implemented; source-reviewed. Related focused paths: AC-10, AC-14 |
| CF-05 | Cash Flow | Opening cash, actual balance and projected closing cash selectors | Implemented; source-reviewed. Related focused paths: AC-10, AC-14 |
| CF-06 | Cash Flow | Monthly charts, 30 / 60 / 90-day outlook and client concentration | Implemented; source-reviewed. Related focused paths: AC-10, AC-14 |
| RT-01 | Reports | Client revenue catalogue with original / free placements and finances | Implemented; source-reviewed. Related focused paths: AC-17, AC-20 |
| RT-02 | Reports | Recruiter report with activity, fee and collection attribution | Implemented; source-reviewed. Related focused paths: AC-17, AC-20 |
| RT-03 | Reports | Operational, finance, ageing and forecast report catalogue | Implemented; source-reviewed. Related focused paths: AC-17, AC-20 |
| RT-04 | Reports | Applicable period, client, recruiter, team, job and status filters | Implemented; source-reviewed. Related focused paths: AC-17, AC-20 |
| RT-05 | Reports | Stored-share financial selectors and application-cohort definitions | Implemented; source-reviewed. Related focused paths: AC-17, AC-20 |
| RT-06 | Reports | Actual filtered CSV with totals / context and print CSS | Implemented; source-reviewed. Related focused paths: AC-17, AC-20 |
| RT-07 | Reports | Record links, metric drill-downs and zero-denominator labels | Implemented; source-reviewed. Related focused paths: AC-17, AC-20 |
| DA-01 | Dashboard | Derived operational measures and linked exception queues | Implemented; source-reviewed. Related focused paths: AC-20 |
| DA-02 | Dashboard | Four revenue / cash stages and receivables kept separate | Implemented; source-reviewed. Related focused paths: AC-20 |
| DA-03 | Dashboard | Funnel, fees / cash, clients, targets and cycle charts | Implemented; source-reviewed. Related focused paths: AC-20 |
| DA-04 | Dashboard | Due work, stage ageing, delays, guarantees and collection alerts | Implemented; source-reviewed. Related focused paths: AC-20 |
| DA-05 | Dashboard | Demo date / client / recruiter / team scope and metric definitions | Implemented; source-reviewed. Related focused paths: AC-20 |
| DA-06 | Dashboard | Metric / chart drill-downs and shared quick-create actions | Implemented; source-reviewed. Related focused paths: AC-20 |
| US-01 | Users & Roles | Create / edit / deactivate / reactivate and unique-email guard | Implemented; source-reviewed. Related focused paths: AC-18 |
| US-02 | Users & Roles | Role-module-action matrix with scope configuration | Implemented; source-reviewed. Related focused paths: AC-18 |
| US-03 | Users & Roles | Allowed / restricted local preview; Super Admin always available | Implemented; source-reviewed. Related focused paths: AC-18 |
| US-04 | Users & Roles | Unsent account invitations and reset previews, local history only | Implemented; source-reviewed. Related focused paths: AC-18 |
| US-05 | Users & Roles | Production authentication intentionally excluded by scope | Excluded as specified; no login service |
| US-06 | Users & Roles | Reassign open work; stored historical fee shares preserved | Implemented; source-reviewed. Related focused paths: AC-18 |
| ST-01 | Settings / Tasks & Activities | Agency profile, sample contact / branding and INR / timezone presentation | Implemented; source-reviewed. Related focused paths: AC-19, storage-fallback test |
| ST-02 | Settings / Tasks & Activities | Master option add / deactivate / reactivate with retained labels | Implemented; source-reviewed. Related focused paths: AC-19, storage-fallback test |
| ST-03 | Settings / Tasks & Activities | Commercial defaults, forecast probabilities and reminder thresholds | Implemented; source-reviewed. Related focused paths: AC-19, storage-fallback test |
| ST-04 | Settings / Tasks & Activities | Linked task form, owner, due date, priority and status | Implemented; source-reviewed. Related focused paths: AC-19, storage-fallback test |
| ST-05 | Settings / Tasks & Activities | Calculated notifications, record navigation, mark read and timelines | Implemented; source-reviewed. Related focused paths: AC-19, storage-fallback test |
| ST-06 | Settings / Tasks & Activities | As-of control, confirmed seed reset and scenario guide | Implemented; source-reviewed. Related focused paths: AC-19, storage-fallback test |
| ST-07 | Settings / Tasks & Activities | Actor, date, action and reason in illustrative local activity log | Implemented; source-reviewed. Related focused paths: AC-19, storage-fallback test |

## Output checks still requiring a normal browser

IV-02, IV-06, AR-04 and RT-06: print layouts are implemented and source-reviewed. Native print dialogue and physical/PDF pagination were not inspected. RT-06 / AC-17: generation, filtering, quoting and totals were tested, and the export control was clicked; the in-app browser download-event inspector timed out, so the downloaded disk file was not retrieved. AT-03 selected-file metadata/preview is implemented; bundled preview is present, but individual PDF rendering varies by browser.

No backend or external service requirement is included in this matrix. Full source requirement text remains in scope.txt and the original Word document.
