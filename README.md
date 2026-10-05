# Northstar Recruitment Workspace

A complete local React + TypeScript + Vite demonstration based on `Recruitment_Management_Scope_of_Work.docx`. Opens directly as Super Admin. Business actions run in the browser; Vite only serves frontend assets. There is no backend, database, authentication, payment gateway, message delivery, external calendar or application API.

## Run

The built preview is running at http://127.0.0.1:4173. The development preview is also available at http://127.0.0.1:5173 while its server is running.

With installed dependencies and Node:

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1
```

Use `./run-demo.ps1` for the built preview at port 4173. On another machine, install Node and run `npm install`, then `npm run dev`. pnpm is also supported; its workspace configuration allows the registry-provided esbuild build step.

```powershell
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
node node_modules/tsx/dist/cli.mjs tests/verification.ts
```

The production assets are in `dist/`. Serve them with `node node_modules/vite/bin/vite.js preview --host 127.0.0.1`; opening the HTML through file:// is not supported.

## Deliverables

- [Demonstration guide](docs/DEMO_GUIDE.md): three connected scenarios, local behaviour and assumptions.
- [GitHub Pages instructions](docs/GITHUB_PAGES.md): upload the source and publish the interactive demo.
- [Coverage matrix](docs/COVERAGE.md): every one of the 129 Section 6 requirement IDs, its screen, action and verification status.
- [Verification report](docs/VERIFICATION.md): exact checks performed and remaining browser-output checks.
- [Architecture](docs/ARCHITECTURE.md): typed records, browser store, actions and selectors.
- [Focused test output](docs/test-results.txt).
- `scope.txt`: extracted requirement text; the original Word document remains unchanged.

## Implementation checkpoints

1. Scope inspection and assumptions: documented; 129 functional IDs mapped.
2. Shared model, fictional seed, selectors, persistence, routes and settings: implemented.
3. Clients, jobs, candidates, pipeline, interviews, offers, joinings and replacements: implemented with related records and validated local actions.
4. Drafts, issued invoices, line credits, receipts, allocations, credit release, reversals, refunds and collections: implemented.
5. Dashboard, forecast, cash flow, reports, targets, tasks, role previews and notifications: implemented.
6. Type/build checks, navigation, focused acceptance checks and responsive review: completed with precise limitations in VERIFICATION.md.
7. Repairs, source formatting, coverage and handover guide: completed.

The source uses reusable forms, tables, badges, modal confirmations, record details, timelines and chart components. `src/actions.ts` guards financial/workflow mutations; `src/model.ts` owns date/financial selectors. No dashboard total is an unrelated seed constant. All personal and company records are fictional, with example.com addresses and DEMO contact references.

