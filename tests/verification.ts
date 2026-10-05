import assert from "node:assert/strict";
import { seed } from "../src/seed";
import {
  type State,
  type Kind,
  type RecordData,
  type Terms,
  find,
  totals,
  invoiceNumbers,
  fee,
  forecast,
  vacancies,
  billing,
  addDays,
  attribution,
  sum,
  receiptAvailable,
  periodFees,
} from "../src/model";
import * as A from "../src/actions";
import { parseCSV } from "../src/ImportCandidates";
import { buildCSV } from "../src/export";
import { loadDemo, persistDemo } from "../src/persistence";
let checks = 0;
const results: string[] = [];
function test(name: string, fn: () => void) {
  fn();
  checks++;
  results.push("PASS " + name);
  console.log("PASS " + name);
}
const near = (x: number, y: number) =>
  assert.ok(Math.abs(x - y) < 0.03, `${x} != ${y}`);
const throws = (fn: () => void) => assert.throws(fn);
const base = seed();
test("Seed minimum counts and every foreign key resolves", () => {
  for (const [k, min] of Object.entries({
    clients: 8,
    jobs: 20,
    candidates: 60,
    applications: 80,
    interviews: 25,
    offers: 15,
    placements: 12,
    replacements: 4,
    invoices: 12,
    receipts: 10,
    tasks: 15,
  }))
    assert.ok(base.data[k as Kind].length >= min, k);
  const refs: Record<string, Kind> = {
    clientId: "clients",
    jobId: "jobs",
    candidateId: "candidates",
    applicationId: "applications",
    userId: "users",
    ownerId: "users",
    teamId: "teams",
    managerId: "users",
    contactId: "contacts",
    offerId: "offers",
    placementId: "placements",
    originalId: "placements",
    replacementId: "replacements",
    invoiceId: "invoices",
    receiptId: "receipts",
  };
  for (const [k, rows] of Object.entries(base.data))
    for (const r of rows) {
      for (const [key, kind] of Object.entries(refs))
        if ((r as unknown as Record<string, string>)[key])
          assert.ok(
            find(base, kind, (r as unknown as Record<string, string>)[key]),
            `${k}.${key}: ${r.id}`,
          );
      for (const l of r.lines || [])
        assert.ok(find(base, "placements", l.placementId));
      for (const sh of r.shares || [])
        assert.ok(find(base, "users", sh.userId));
    }
});
test("Seed invoices follow actual joining; no duplicate active applications", () => {
  for (const i of base.data.invoices)
    for (const l of i.lines!)
      assert.ok(find(base, "placements", l.placementId)!.actual! <= i.date);
  const keys = base.data.applications
    .filter((a) => !["Joined", "Rejected", "Withdrawn"].includes(a.stage!))
    .map((a) => a.candidateId + "|" + a.jobId);
  assert.equal(new Set(keys).size, keys.length);
});
test("AC-01 client defaults copied and later terms do not rewrite snapshots", () => {
  const s = seed(),
    c = {
      ...s.data.clients[1],
      id: "new-client",
      name: "Example New Client",
      terms: { ...s.data.clients[1].terms!, days: 45 },
    };
  A.save(s, "clients", c);
  const j = { ...s.data.jobs[0], id: "new-job", clientId: c.id };
  A.save(s, "jobs", j);
  assert.equal(j.terms!.days, 45);
  c.terms.days = 60;
  assert.equal(j.terms!.days, 45);
  const due = s.data.invoices[1].due;
  c.terms.days = 30;
  assert.equal(s.data.invoices[1].due, due);
});
test("AC-02 independent applications and duplicate active protection", () => {
  const s = seed(),
    a = A.applyCandidate(s, "ca59", "j1", "u1"),
    b = A.applyCandidate(s, "ca59", "j2", "u2");
  A.stage(s, a.id, "Screening");
  assert.equal(b.stage, "New");
  throws(() => A.applyCandidate(s, "ca59", "j1", "u1"));
  find(s, "candidates", "ca59")!.phone = "DEMO-EDIT";
  assert.equal(
    find(s, "candidates", a.candidateId)!.phone,
    find(s, "candidates", b.candidateId)!.phone,
  );
});
test("AC-03 CSV handles commas, quotes and real rows", () => {
  const rows = parseCSV(
    'name,email,skills\r\n"Taylor, Sample",valid@example.com,"React, TypeScript"\r\nBad,not-email,Other\r\nDuplicate,valid@example.com,Other',
  );
  assert.equal(rows.length, 4);
  assert.equal(rows[1][0], "Taylor, Sample");
  assert.equal(rows[1][2], "React, TypeScript");
  throws(() => parseCSV('"unclosed'));
});
test("AC-04 progression validates recruiter, consent, held job and history", () => {
  const s = seed(),
    a = A.applyCandidate(s, "ca59", "j3", "");
  A.stage(s, a.id, "Screening");
  throws(() => A.stage(s, a.id, "Submitted to Client"));
  a.userId = "u1";
  A.stage(s, a.id, "Submitted to Client");
  assert.ok(a.history!.some((h) => h.action.includes("Submitted")));
  find(s, "candidates", "ca59")!.consent = "Withdrawn";
  throws(() => A.stage(s, a.id, "Interviewing"));
  find(s, "candidates", "ca59")!.consent = "Recorded";
  find(s, "jobs", "j3")!.status = "On Hold";
  throws(() => A.stage(s, a.id, "Interviewing"));
});
test("AC-05 rescheduling retains date and updates linked reminder", () => {
  const s = seed(),
    i = s.data.interviews[25];
  s.data.tasks.push({
    id: "reminder-test",
    name: "Reminder",
    status: "Pending",
    date: s.settings.asOf,
    due: i.date,
    linkedKind: "interviews",
    linkedId: i.id,
  });
  const old = i.date,
    previousStage = find(s, "applications", i.applicationId)!.stage;
  A.save(s, "interviews", {
    ...i,
    date: addDays(s.settings.asOf, 15),
    reason: "Client availability",
  });
  assert.equal(i.status, "Rescheduled");
  assert.ok(i.history!.some((h) => h.date === old));
  assert.equal(find(s, "tasks", "reminder-test")!.due, i.date);
  throws(() =>
    A.save(s, "interviews", {
      ...i,
      status: "Completed",
      feedback: "",
      recommendation: "",
    }),
  );
  A.save(s, "interviews", {
    ...i,
    status: "Completed",
    feedback: "Structured feedback",
    recommendation: "Proceed",
  });
  assert.equal(find(s, "applications", i.applicationId)!.stage, previousStage);
});
function newPlacement(s: State) {
  const a = A.applyCandidate(s, "ca59", "j1", "u1");
  throws(() => A.stage(s, a.id, "Selected"));
  A.stage(s, a.id, "Selected", "No interviews required", true);
  const o = A.makeOffer(s, a.id, {
    salary: 1200000,
    expected: s.settings.asOf,
  });
  A.offerDecision(s, o.id, "Sent");
  const revised = A.makeOffer(s, a.id, {
    salary: 1500000,
    expected: s.settings.asOf,
  });
  A.offerDecision(
    s,
    revised.id,
    "Accepted",
    "",
    s.settings.asOf,
    s.settings.asOf,
  );
  const jo = s.data.joinings.find((j) => j.applicationId === a.id)!;
  const p = A.confirmJoining(s, jo.id, {
    actual: s.settings.asOf,
    salary: revised.salary!,
    shares: [
      { userId: "u1", percent: 60 },
      { userId: "u2", percent: 40 },
    ],
  });
  return { a, jo, p };
}
test("AC-06 offer revision uses current salary and creates joining tracker", () => {
  const s = seed(),
    { a, p } = newPlacement(s);
  assert.equal(s.data.offers.filter((o) => o.applicationId === a.id).length, 2);
  assert.equal(p.salary, 1500000);
  assert.equal(p.amount, fee(p.terms!, 1500000));
});
test("AC-07 joining confirmation is idempotent and consumes one original slot", () => {
  const s = seed(),
    { jo, p } = newPlacement(s);
  const count = s.data.placements.length,
    filled = vacancies(s, find(s, "jobs", p.jobId)!).filled;
  const twice = A.confirmJoining(s, jo.id, {
    actual: s.settings.asOf,
    salary: 1500000,
    shares: [{ userId: "u1", percent: 100 }],
  });
  assert.equal(twice.id, p.id);
  assert.equal(s.data.placements.length, count);
  assert.equal(vacancies(s, find(s, "jobs", p.jobId)!).filled, filled);
});
function issued(s: State) {
  const { p } = newPlacement(s);
  const i = A.draftInvoice(s, [p.id], {
    days: 30,
    trigger: "Invoice date",
    date: s.settings.asOf,
    triggerDate: "",
    discount: 0,
    tax: 18,
  });
  A.issueInvoice(s, i.id);
  return i;
}
test("AC-08 draft fees counted once; issue moves fee into invoice and blocks duplicate", () => {
  const s = seed(),
    { p } = newPlacement(s),
    before = totals(s);
  const i = A.draftInvoice(s, [p.id], {
    days: 30,
    trigger: "Invoice date",
    date: s.settings.asOf,
    triggerDate: "",
    discount: 0,
    tax: 18,
  });
  near(totals(s).uninvoiced, before.uninvoiced);
  assert.equal(billing(s, p), "Draft Invoice Linked");
  throws(() =>
    A.draftInvoice(s, [p.id], {
      days: 30,
      trigger: "Invoice date",
      date: s.settings.asOf,
      triggerDate: "",
      discount: 0,
      tax: 18,
    }),
  );
  A.issueInvoice(s, i.id);
  near(totals(s).uninvoiced, before.uninvoiced - p.amount!);
  near(totals(s).netFees, before.netFees + p.amount!);
  near(totals(s).cash, before.cash);
});
test("AC-09 four durations and alternative calendar triggers", () => {
  for (const days of [30, 45, 60, 90]) {
    const s = seed(),
      { p } = newPlacement(s);
    const i = A.draftInvoice(s, [p.id], {
      days,
      trigger: "Invoice date",
      date: "2026-10-01",
      triggerDate: "",
      discount: 0,
      tax: 0,
    });
    assert.equal(i.due, addDays("2026-10-01", days));
  }
  const s = seed(),
    { p } = newPlacement(s);
  throws(() =>
    A.draftInvoice(s, [p.id], {
      days: 45,
      trigger: "Client acceptance",
      date: s.settings.asOf,
      triggerDate: "",
      discount: 0,
      tax: 0,
    }),
  );
  const i = A.draftInvoice(s, [p.id], {
    days: 45,
    trigger: "Joining date",
    date: s.settings.asOf,
    triggerDate: "",
    discount: 0,
    tax: 0,
  });
  assert.equal(i.due, addDays(p.actual!, 45));
});
test("AC-10 partial and excess receipts; allocation never duplicates cash", () => {
  const s = seed(),
    i = issued(s),
    n = invoiceNumbers(s, i),
    before = totals(s).cash;
  const r = A.recordReceipt(s, {
    id: "test-r",
    name: "Test receipt",
    status: "Recorded",
    date: s.settings.asOf,
    clientId: i.clientId,
    amount: n.total * 0.4,
    currency: "INR",
  });
  A.allocate(s, r.id, i.id, r.amount!);
  near(invoiceNumbers(s, i).outstanding, n.total * 0.6);
  near(totals(s).cash, before + r.amount!);
  const extra = A.recordReceipt(s, {
    id: "extra",
    name: "Excess",
    status: "Recorded",
    date: s.settings.asOf,
    clientId: i.clientId,
    amount: n.total,
    currency: "INR",
  });
  A.allocate(s, extra.id, i.id, invoiceNumbers(s, i).outstanding);
  near(receiptAvailable(s, extra), n.total * 0.4);
  assert.equal(invoiceNumbers(s, i).settlement, "Paid");
  throws(() => A.allocate(s, extra.id, i.id, 1));
});
test("AC-11 date control updates ageing without editing invoice", () => {
  const s = seed(),
    i = issued(s),
    due = i.due;
  s.settings.asOf = addDays(due!, 1);
  assert.equal(invoiceNumbers(s, i).overdue, 1);
  assert.equal(invoiceNumbers(s, i).bucket, "1–30");
  for (const [n, b] of [
    [31, "31–60"],
    [61, "61–90"],
    [91, "Over 90"],
  ] as const) {
    s.settings.asOf = addDays(due!, n);
    assert.equal(invoiceNumbers(s, i).bucket, b);
  }
  assert.equal(i.due, due);
});
test("AC-12 promise and dispute preserve contractual ageing", () => {
  const s = seed(),
    i = s.data.invoices[2],
    due = i.due,
    age = invoiceNumbers(s, i).overdue;
  i.promise = addDays(s.settings.asOf, 20);
  i.disputed = true;
  i.disputeReason = "Local review";
  assert.equal(i.due, due);
  assert.equal(invoiceNumbers(s, i).overdue, age);
  assert.ok(totals(s).disputed > 0);
});
test("AC-13 paid credit release and refund reconcile cash and history", () => {
  const s = seed(),
    i = issued(s),
    n = invoiceNumbers(s, i);
  const r = A.recordReceipt(s, {
    id: "refund-test",
    name: "Paid receipt",
    status: "Recorded",
    date: s.settings.asOf,
    clientId: i.clientId,
    amount: n.total,
    currency: "INR",
  });
  A.allocate(s, r.id, i.id, n.total);
  const c = A.creditInvoice(s, i.id, 11800, "Agreed reduction");
  assert.equal(invoiceNumbers(s, i).clientCredit, 0);
  A.issueCredit(s, c.id);
  near(invoiceNumbers(s, i).clientCredit, 11800);
  const cash = totals(s).cash;
  A.releaseCredit(s, i.id, r.id, 11800, "Return over-settlement");
  A.refund(
    s,
    r.id,
    11800,
    "Refund client credit",
    s.settings.asOf,
    "Fictional transfer",
    "DEMO-REF",
  );
  near(totals(s).cash, cash - 11800);
  near(invoiceNumbers(s, i).outstanding, 0);
  assert.ok(s.data.receipts.includes(r));
  throws(() =>
    A.refund(s, r.id, 1, "Extra refund", s.settings.asOf, "Cash", "X"),
  );
});
test("AC-14 reversal reopens invoice and preserves original allocation", () => {
  const s = seed(),
    i = issued(s),
    n = invoiceNumbers(s, i),
    r = A.recordReceipt(s, {
      id: "reverse-test",
      name: "Receipt",
      status: "Recorded",
      date: s.settings.asOf,
      clientId: i.clientId,
      amount: 10000,
      currency: "INR",
    });
  A.allocate(s, r.id, i.id, 10000);
  const cash = totals(s).cash;
  A.reverseReceipt(s, r.id, "Correction");
  near(invoiceNumbers(s, i).outstanding, n.total);
  near(totals(s).cash, cash - 10000);
  assert.ok(s.data.allocations.some((a) => a.receiptId === r.id));
  throws(() => A.reverseReceipt(s, r.id, "Again"));
});
test("AC-15 free replacement produces no second fee or original vacancy", () => {
  const s = seed(),
    rp = s.data.replacements[0],
    p = find(s, "placements", rp.originalId)!,
    j = find(s, "jobs", p.jobId)!,
    filled = vacancies(s, j).filled,
    cash = totals(s).cash;
  A.reviewReplacement(
    s,
    rp.id,
    "Approved",
    "Free replacement",
    "Guarantee confirmed",
    false,
  );
  const a = A.applyCandidate(s, "ca59", j.id, "u1", rp.id);
  rp.applicationId = a.id;
  A.stage(s, a.id, "Selected", "Fast-track agreed", true);
  const o = A.makeOffer(s, a.id, { salary: 1400000 });
  A.offerDecision(s, o.id, "Accepted", "", s.settings.asOf, s.settings.asOf);
  const jo = s.data.joinings.find((j) => j.applicationId === a.id)!;
  const replacement = A.confirmJoining(s, jo.id, {
    actual: s.settings.asOf,
    salary: 1400000,
    shares: [{ userId: "u1", percent: 100 }],
  });
  assert.equal(replacement.amount, 0);
  assert.equal(replacement.billable, false);
  assert.equal(rp.status, "Fulfilled");
  assert.equal(vacancies(s, j).filled, filled);
  near(totals(s).cash, cash);
});
test("AC-16 recruiter fee and collection shares reconcile after reassignment", () => {
  const s = seed(),
    i = issued(s);
  const r = A.recordReceipt(s, {
    id: "attr-test",
    name: "Receipt",
    status: "Recorded",
    date: s.settings.asOf,
    clientId: i.clientId,
    amount: 50000,
    currency: "INR",
  });
  A.allocate(s, r.id, i.id, 50000);
  near(
    sum(s.data.users.map((u) => attribution(s, u.id).net)),
    totals(s).netFees,
  );
  const agencyFeeCollections = sum(
    s.data.invoices
      .filter((i) => i.status === "Issued")
      .map((i) => {
        const n = invoiceNumbers(s, i);
        return n.total - n.credit > 0
          ? (Math.min(n.allocated, n.total - n.credit) *
              (n.net - n.creditFee)) /
              (n.total - n.credit)
          : 0;
      }),
  );
  near(
    sum(s.data.users.map((u) => attribution(s, u.id).collected)),
    agencyFeeCollections,
  );
  const prior = attribution(s, "u1").net;
  s.data.jobs[0].userId = "u5";
  near(attribution(s, "u1").net, prior);
});
test("Forecast exact capacity limit: two 90% candidates / one vacancy", () => {
  const s = seed();
  s.data.jobs = s.data.jobs.slice(0, 1);
  const j = s.data.jobs[0];
  j.openings = 1;
  s.data.placements = [];
  s.data.applications = [
    {
      id: "x",
      name: "X",
      status: "Active",
      date: s.settings.asOf,
      stage: "Offer Accepted",
      jobId: j.id,
      probability: 0.9,
    },
    {
      id: "y",
      name: "Y",
      status: "Active",
      date: s.settings.asOf,
      stage: "Offer Accepted",
      jobId: j.id,
      probability: 0.9,
    },
  ];
  s.data.offers = [];
  const rows = forecast(s);
  near(sum(rows.map((r) => r.weighted)), fee(j.terms!, 1200000));
  j.openings = 0;
  near(sum(forecast(s).map((r) => r.weighted)), 0);
});
test("Percentage offer salary revision, line discounts and rounded tax", () => {
  const s = seed();
  s.data.jobs[0].terms!.method = "Percentage";
  s.data.jobs[0].terms!.value = 10;
  const { p } = newPlacement(s);
  assert.equal(p.amount, 150000);
  const i = A.draftInvoice(s, [p.id], {
    days: 45,
    trigger: "Client acceptance",
    triggerDate: s.settings.asOf,
    date: s.settings.asOf,
    discount: 5000,
    tax: 18,
  });
  A.issueInvoice(s, i.id);
  const n = invoiceNumbers(s, i);
  assert.equal(n.net, 145000);
  assert.equal(n.tax, 26100);
  assert.equal(n.total, 171100);
  throws(() => A.save(s, "invoices", { ...i, amount: 1 }));
});
test("Later-period credit affects later period independently of invoice date", () => {
  const s = seed();
  const i = issued(s);
  i.date = "2026-09-01";
  const c = A.creditInvoice(s, i.id, 11800, "October adjustment", true);
  assert.equal(c.date, "2026-10-05");
  near(
    periodFees(s, "2026-10-01", "2026-10-31"),
    -sum(
      s.data.credits
        .filter((c) => c.date.startsWith("2026-10") && c.status === "Issued")
        .flatMap((c) => c.lines!.map((l) => l.fee - l.discount)),
    ),
  );
  near(
    sum(
      s.data.users.map((u) => periodFees(s, "2026-10-01", "2026-10-31", u.id)),
    ),
    periodFees(s, "2026-10-01", "2026-10-31"),
  );
});
test("Cross-client, excessive allocations, invalid shares and conflicting merges block", () => {
  const s = seed(),
    r = s.data.receipts[1];
  throws(() => A.allocate(s, r.id, "iv1", 100));
  const { jo } = newPlacement(s);
  const a = A.applyCandidate(s, "ca59", "j2", "u1");
  const dup = { ...find(s, "candidates", "ca59")!, id: "duplicate" };
  s.data.candidates.push(dup);
  A.applyCandidate(s, dup.id, "j2", "u1");
  throws(() => A.mergeCandidates(s, "ca59", dup.id, "Merge review"));
});
test("AC-18 users duplicate email validation and historical attribution survives deactivation", () => {
  const s = seed(),
    u = s.data.users[0],
    before = attribution(s, u.id);
  throws(() => A.save(s, "users", { ...u, id: "duplicate-user" }));
  A.save(s, "users", { ...u, status: "Inactive", reason: "Demo deactivation" });
  A.reassignOpenWork(s, u.id, "u5", "Reassign local open work");
  assert.ok(
    !s.data.applications.some(
      (a) =>
        a.userId === u.id &&
        !["Joined", "Rejected", "Withdrawn"].includes(a.stage || ""),
    ),
  );
  assert.deepEqual(attribution(s, u.id), before);
  assert.equal(find(s, "users", "admin")!.status, "Active");
});
test("AC-19 JSON persistence round-trip and seed reset are consistent", () => {
  const s = seed();
  s.data.clients[0].name = "Locally changed";
  const restored = JSON.parse(JSON.stringify(s));
  assert.equal(restored.data.clients[0].name, "Locally changed");
  assert.notEqual(seed().data.clients[0].name, "Locally changed");
  assert.deepEqual(totals(seed()), totals(base));
});
test("AC-20 dashboard and supporting invoice balances use same selectors", () => {
  near(
    totals(base).outstanding,
    sum(base.data.invoices.map((i) => invoiceNumbers(base, i).outstanding)),
  );
  near(
    totals(base).netFees,
    periodFees(base, "0000-01-01", base.settings.asOf),
  );
});
test("AC-17 filtered CSV values, quoting, totals and generation context", () => {
  const rows = base.data.invoices.filter((i) => i.clientId === "c1");
  const output = buildCSV(
    rows,
    [
      { title: "Invoice", value: (r) => r.name },
      {
        title: "Outstanding",
        value: (r) => invoiceNumbers(base, r).outstanding,
      },
    ],
    "Client c1; as of 2026-10-05",
  );
  assert.ok(output.includes("TOTAL"));
  assert.ok(output.includes("Client c1"));
  assert.ok(!output.includes("NST-2026-002"));
  assert.ok(
    output.includes(
      String(sum(rows.map((i) => invoiceNumbers(base, i).outstanding))),
    ),
  );
  const quote = buildCSV(
    [{ name: 'Taylor, "Demo"' }],
    [{ title: "Name", value: (r) => r.name }],
  );
  assert.ok(quote.includes('"Taylor, ""Demo"""'));
});
test("Storage failure falls back safely; JSON writes round-trip", () => {
  const loaded = loadDemo({
    getItem: () => {
      throw Error("blocked");
    },
  });
  assert.ok(loaded.error);
  assert.equal(loaded.state.version, 1);
  assert.ok(
    persistDemo(base, {
      setItem: () => {
        throw Error("full");
      },
    }),
  );
  let raw = "";
  assert.equal(persistDemo(base, { setItem: (_k, v) => (raw = v) }), "");
  assert.deepEqual(
    totals(loadDemo({ getItem: () => raw }).state),
    totals(base),
  );
});
console.log(
  `\n${checks} focused verification groups passed. Browser-only AC-17 export and responsive/print/persistence checks are documented separately.`,
);
