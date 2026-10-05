# Architecture and frontend boundary

## Components and data

React 19, TypeScript, Vite, Lucide icons, Recharts and one CSS stylesheet. `App.tsx` provides the Super Admin shell, hash routes, global search, navigation, quick creation, notifications and date control. Hash routes support direct links and normal browser history. Mapped subrecord routes retain their exact entity kind, such as `/joinings/p1/placements` or `/payments/rc1/receipts`.

- `model.ts`: central typed record envelope, Terms, invoice lines, recruiter shares, stable relationships, calendar-day helpers and financial selectors.
- `seed.ts`: deterministic version 1 fictional dataset relative to 5 October 2026. All relationships resolve. It separates candidate profiles and applications, offers and joining outcomes, placement fees and invoice documents, cash receipts and allocations.
- `actions.ts`: local validation/mutation layer. Workflow and finance actions are transactional because the store clones state before running an action; a thrown validation error discards the entire mutation. Material actions append local actor/date/reason history.
- `store.tsx` / `persistence.ts`: React context and versioned JSON localStorage with tested in-memory fallback. No login session or password exists.
- `schema.ts`, `components.tsx`: labelled reusable forms, focus-contained modals, filters, searchable/sortable/paginated tables, status badges, record links and timelines. Table searches/status filters are retained locally; candidate searches can be saved.
- `RecordActions.tsx`, `Records.tsx`, `WorkflowViews.tsx`, `TalentViews.tsx`: domain action dialogues, linked details, commercial snapshots, ATS, Kanban, bulk review and interview calendar.
- `Analytics.tsx`: management cards/charts, client and recruiter reports, targets, collection/forecast/cash views. The same selectors power tables and metrics.
- `ImportCandidates.tsx` / `export.ts`: quote-aware CSV parser, mapping/validation/preview/import, deterministic filtered export with totals and generation context.
- `Settings.tsx`: defaults, masters, tasks/role controls and named scenarios.
- `tests/verification.ts`: 27 focused groups covering AC paths, relationships, date arithmetic, capacity, billing uniqueness, idempotence, allocation, period credits, cash, attribution and storage failure.

## Financial controls

Original filled slots are derived from non-replacement placements; replacements reference the original slot. Placement confirmation is idempotent by application ID and snapshots terms/shares. Invoice lines refer to billable joined placements and cannot have another active invoice/draft. Cancelled reissue records retain prior references. Invoice document state, settlement and overdue/dispute flags remain separate.

Credits refer to invoice lines and retain their own date/status. Signed balances create positive receivables or client credit. Over-settlement can be explicitly released to a receipt, then refunded or applied to another same-client/currency invoice. Reversals retain original allocations. Allocation and release are not cash events. Recruiter collections apportion only effective fee, excluding tax. Settings/current assignment changes do not rewrite historical shares or issued financial values.

## No application server

Only frontend assets are served. There are no business routes, database models/migrations, API clients, credentials, payment/identity services, resume parsing, remote file upload, email/SMS/WhatsApp delivery, calendar integration or AI service. Selected files use browser object URLs. Commercial, tax and permission behaviour is illustrative local configuration. Frontend permission previews are not production security.
