export type Kind =
  | "clients"
  | "contacts"
  | "jobs"
  | "candidates"
  | "applications"
  | "interviews"
  | "offers"
  | "joinings"
  | "placements"
  | "replacements"
  | "invoices"
  | "credits"
  | "receipts"
  | "allocations"
  | "refunds"
  | "users"
  | "teams"
  | "targets"
  | "tasks"
  | "activities"
  | "cash";
export const kinds: Kind[] = [
  "clients",
  "contacts",
  "jobs",
  "candidates",
  "applications",
  "interviews",
  "offers",
  "joinings",
  "placements",
  "replacements",
  "invoices",
  "credits",
  "receipts",
  "allocations",
  "refunds",
  "users",
  "teams",
  "targets",
  "tasks",
  "activities",
  "cash",
];
export interface Terms {
  method: "Percentage" | "Fixed";
  value: number;
  days: number;
  trigger: "Invoice date" | "Joining date" | "Client acceptance";
  guarantee: number;
  conditions: string;
  salaryBasis: string;
}
export interface Share {
  userId: string;
  percent: number;
}
export interface Line {
  placementId: string;
  fee: number;
  discount: number;
  tax: number;
}
// A common record envelope lets the schema-driven editor share consistent controls.
// Financial and workflow structures remain typed and are mutated only by the action layer.
export interface RecordData {
  failedJoinings?: number;
  activeReplacements?: number;
  targetAchievement?: string;
  documents?: { name: string; size: number; type: string; attached: string }[];
  id: string;
  name: string;
  status: string;
  date: string;
  clientId?: string;
  jobId?: string;
  candidateId?: string;
  applicationId?: string;
  userId?: string;
  teamId?: string;
  managerId?: string;
  ownerId?: string;
  contactId?: string;
  offerId?: string;
  placementId?: string;
  originalId?: string;
  replacementId?: string;
  invoiceId?: string;
  receiptId?: string;
  terms?: Terms;
  shares?: Share[];
  lines?: Line[];
  amount?: number;
  salary?: number;
  minSalary?: number;
  maxSalary?: number;
  openings?: number;
  stage?: string;
  expected?: string;
  actual?: string;
  due?: string;
  triggerDate?: string;
  originalDue?: string;
  probability?: number;
  billable?: boolean;
  restart?: boolean;
  archived?: boolean;
  reversed?: string;
  reversalReason?: string;
  reason?: string;
  notes?: string;
  email?: string;
  phone?: string;
  skills?: string;
  tags?: string;
  consent?: string;
  availability?: string;
  location?: string;
  industry?: string;
  address?: string;
  website?: string;
  designation?: string;
  preferences?: string;
  source?: string;
  experience?: number;
  currentSalary?: number;
  notice?: number;
  resume?: string;
  followUp?: string;
  round?: number;
  time?: string;
  duration?: number;
  mode?: string;
  interviewer?: string;
  feedback?: string;
  rating?: number;
  recommendation?: string;
  version?: number;
  deadline?: string;
  response?: string;
  ended?: string;
  guaranteeEnd?: string;
  treatment?: string;
  eligibility?: string;
  promise?: string;
  disputed?: boolean;
  disputeReason?: string;
  resolved?: string;
  currency?: string;
  method?: string;
  reference?: string;
  priority?: string;
  linkedKind?: Kind;
  linkedId?: string;
  role?: string;
  scope?: string;
  targetType?: string;
  category?: string;
  plannedIssue?: string;
  vacant?: boolean;
  history?: { date: string; action: string; reason: string }[];
}
export interface Settings {
  asOf: string;
  agency: string;
  prefix: string;
  openingCash: number;
  reminder: number;
  stageAge: number;
  contact?: string;
  branding?: string;
  roleScopes?: Record<string, string>;
  defaultTerms: Terms;
  probabilities: Record<string, number>;
  masters: Record<string, { name: string; active: boolean }[]>;
  permissions: Record<string, Record<string, boolean>>;
  read: string[];
  savedFilters: { name: string; query: string }[];
}
export interface State {
  version: number;
  settings: Settings;
  data: Record<Kind, RecordData[]>;
}
export const stages = [
  "New",
  "Screening",
  "Shortlisted",
  "Submitted to Client",
  "Interviewing",
  "Selected",
  "Offer Sent",
  "Offer Accepted",
  "Joined",
  "Rejected",
  "Withdrawn",
  "On Hold",
];
export const terminal = ["Joined", "Rejected", "Withdrawn"];
export const roles = [
  "Super Admin",
  "Founder or Admin",
  "Recruitment Manager",
  "Recruiter",
  "Finance Executive",
];
export const permissionActions = [
  "view",
  "create",
  "edit",
  "archive",
  "assign",
  "approve",
  "export",
  "issue invoice",
  "record receipt",
  "create credit note",
  "financial visibility",
];
export const day = (s: string) => Date.parse(s + "T00:00:00Z");
export const addDays = (s: string, n: number) =>
  new Date(day(s) + n * 86400000).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) =>
  Math.round((day(b) - day(a)) / 86400000);
export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n || 0);
export const date = (s?: string) =>
  s
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(day(s)))
    : "Unscheduled";
export const round = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
export const find = (s: State, k: Kind, id?: string) =>
  s.data[k].find((x) => x.id === id);
export const fee = (terms: Terms, salary: number) =>
  round(terms.method === "Fixed" ? terms.value : (salary * terms.value) / 100);
export const currentOffer = (s: State, id: string) =>
  s.data.offers
    .filter((x) => x.applicationId === id)
    .sort((a, b) => (b.version || 0) - (a.version || 0))[0];
export function invoiceNumbers(s: State, i: RecordData) {
  const net = sum((i.lines || []).map((l) => l.fee - l.discount));
  const tax = sum(
    (i.lines || []).map((l) => round(((l.fee - l.discount) * l.tax) / 100)),
  );
  const credits = s.data.credits.filter(
    (c) =>
      c.invoiceId === i.id &&
      c.status === "Issued" &&
      c.date <= s.settings.asOf,
  );
  const credit = sum(credits.map((c) => c.amount || 0));
  const allocated = sum(
    s.data.allocations
      .filter(
        (a) =>
          a.invoiceId === i.id &&
          a.date <= s.settings.asOf &&
          !a.archived &&
          (() => {
            const r = find(s, "receipts", a.receiptId);
            return (
              r &&
              r.date <= s.settings.asOf &&
              (!r.reversed || r.reversed > s.settings.asOf)
            );
          })(),
      )
      .map((a) => a.amount || 0),
  );
  const signed = round(net + tax - credit - allocated);
  const outstanding =
    i.status === "Issued" && i.date <= s.settings.asOf
      ? Math.max(0, signed)
      : 0;
  const overdue = i.due ? Math.max(0, daysBetween(i.due, s.settings.asOf)) : 0;
  const creditFee = sum(
    credits.map((c) => sum((c.lines || []).map((l) => l.fee - l.discount))),
  );
  return {
    net: round(net),
    tax: round(tax),
    total: round(net + tax),
    credit: round(credit),
    creditFee: round(creditFee),
    allocated: round(allocated),
    signed,
    outstanding,
    clientCredit: i.status === "Issued" ? Math.max(0, -signed) : 0,
    overdue,
    bucket:
      overdue === 0
        ? "Current"
        : overdue <= 30
          ? "1–30"
          : overdue <= 60
            ? "31–60"
            : overdue <= 90
              ? "61–90"
              : "Over 90",
    settlement:
      outstanding === 0 ? "Paid" : allocated > 0 ? "Partially Paid" : "Unpaid",
  };
}
export function receiptAvailable(s: State, r: RecordData) {
  if (r.date > s.settings.asOf || (r.reversed && r.reversed <= s.settings.asOf))
    return 0;
  return round(
    (r.amount || 0) -
      sum(
        s.data.allocations
          .filter(
            (a) =>
              a.receiptId === r.id && !a.archived && a.date <= s.settings.asOf,
          )
          .map((a) => a.amount || 0),
      ) -
      sum(
        s.data.refunds
          .filter((x) => x.receiptId === r.id && x.date <= s.settings.asOf)
          .map((x) => x.amount || 0),
      ),
  );
}
export function vacancies(s: State, j: RecordData) {
  const filled = s.data.placements.filter(
    (p) => p.jobId === j.id && !p.originalId && !p.vacant,
  ).length;
  return { filled, remaining: Math.max(0, (j.openings || 0) - filled) };
}
export function billing(s: State, p: RecordData) {
  if (!p.billable) return "Non Billable";
  const i = s.data.invoices.find(
    (i) =>
      i.status !== "Cancelled" && i.lines?.some((l) => l.placementId === p.id),
  );
  return i?.status === "Issued"
    ? "Invoiced"
    : i
      ? "Draft Invoice Linked"
      : "Billable Uninvoiced";
}
export function forecast(s: State) {
  return s.data.jobs.flatMap((j) => {
    if (j.status !== "Open") return [];
    const r = vacancies(s, j).remaining;
    const apps = s.data.applications.filter(
      (a) =>
        a.jobId === j.id &&
        !a.replacementId &&
        !terminal.includes(a.stage || "") &&
        a.stage !== "On Hold",
    );
    const p = sum(
      apps.map(
        (a) => a.probability ?? s.settings.probabilities[a.stage || "New"] ?? 0,
      ),
    );
    const scale = p > 0 ? Math.min(1, r / p) : 0;
    return apps.map((a) => {
      const o = currentOffer(s, a.id);
      const estimate = fee(
        j.terms!,
        o?.salary || ((j.minSalary || 0) + (j.maxSalary || 0)) / 2,
      );
      const probability =
        a.probability ?? s.settings.probabilities[a.stage || "New"] ?? 0;
      return {
        ...a,
        estimate,
        probability,
        scale,
        weighted: estimate * probability * scale,
        clientId: j.clientId,
      };
    });
  });
}
export function totals(s: State) {
  const issued = s.data.invoices.filter(
    (i) => i.status === "Issued" && i.date <= s.settings.asOf,
  );
  const nums = issued.map((i) => invoiceNumbers(s, i));
  const gross = sum(
    s.data.receipts
      .filter((r) => r.date <= s.settings.asOf)
      .map((r) => r.amount || 0),
  );
  const reversals = sum(
    s.data.receipts
      .filter((r) => r.reversed && r.reversed <= s.settings.asOf)
      .map((r) => r.amount || 0),
  );
  const refunds = sum(
    s.data.refunds
      .filter((r) => r.date <= s.settings.asOf)
      .map((r) => r.amount || 0),
  );
  return {
    pipeline: sum(forecast(s).map((a) => a.weighted)),
    uninvoiced: sum(
      s.data.placements
        .filter((p) => billing(s, p) !== "Invoiced" && p.billable)
        .map((p) => p.amount || 0),
    ),
    draft: sum(
      s.data.placements
        .filter((p) => billing(s, p) === "Draft Invoice Linked")
        .map((p) => p.amount || 0),
    ),
    netFees: sum(nums.map((n) => n.net - n.creditFee)),
    gross,
    reversals,
    refunds,
    cash: round(gross - reversals - refunds),
    outstanding: sum(nums.map((n) => n.outstanding)),
    overdue: sum(nums.filter((n) => n.overdue > 0).map((n) => n.outstanding)),
    disputed: sum(
      issued
        .filter((i) => i.disputed)
        .map((i) => invoiceNumbers(s, i).outstanding),
    ),
    credit:
      sum(s.data.receipts.map((r) => Math.max(0, receiptAvailable(s, r)))) +
      sum(nums.map((n) => n.clientCredit)),
  };
}
export function attribution(s: State, userId: string) {
  let net = 0,
    collected = 0;
  for (const i of s.data.invoices.filter(
    (i) => i.status === "Issued" && i.date <= s.settings.asOf,
  )) {
    const n = invoiceNumbers(s, i);
    const effective = n.total - n.credit;
    const credits = s.data.credits.filter(
      (c) =>
        c.invoiceId === i.id &&
        c.status === "Issued" &&
        c.date <= s.settings.asOf,
    );
    for (const l of i.lines || []) {
      const p = find(s, "placements", l.placementId)!;
      const share =
        (p.shares || []).find((x) => x.userId === userId)?.percent || 0;
      const feeCredit = sum(
        credits.flatMap((c) =>
          (c.lines || [])
            .filter((x) => x.placementId === l.placementId)
            .map((x) => x.fee - x.discount),
        ),
      );
      const remaining = l.fee - l.discount - feeCredit;
      net += (remaining * share) / 100;
      collected +=
        effective > 0
          ? (((Math.min(n.allocated, effective) * remaining) / effective) *
              share) /
            100
          : 0;
    }
  }
  return { net: round(net), collected: round(collected) };
}
export function collectionDate(s: State, i: RecordData) {
  return i.promise || ((i.due || "") >= s.settings.asOf ? i.due : undefined);
}
export function periodFees(
  s: State,
  start: string,
  end: string,
  userId?: string,
  clientId?: string,
) {
  const within = (d: string) => d >= start && d <= end;
  let net = 0;
  const portion = (l: Line) =>
    userId
      ? (find(s, "placements", l.placementId)?.shares || []).find(
          (sh) => sh.userId === userId,
        )?.percent || 0
      : 100;
  for (const i of s.data.invoices.filter(
    (i) =>
      i.status === "Issued" &&
      within(i.date) &&
      (!clientId || i.clientId === clientId),
  ))
    net += sum(
      (i.lines || []).map((l) => ((l.fee - l.discount) * portion(l)) / 100),
    );
  for (const c of s.data.credits.filter(
    (c) => c.status === "Issued" && within(c.date),
  )) {
    const i = find(s, "invoices", c.invoiceId);
    if (i?.status === "Issued" && (!clientId || i.clientId === clientId))
      net -= sum(
        (c.lines || []).map((l) => ((l.fee - l.discount) * portion(l)) / 100),
      );
  }
  return round(net);
}
