import {
  type State,
  type Kind,
  type RecordData,
  type Terms,
  find,
  fee,
  currentOffer,
  terminal,
  stages,
  addDays,
  invoiceNumbers,
  receiptAvailable,
  round,
  sum,
  vacancies,
  billing,
} from "./model";
export const uid = (prefix: string) =>
  prefix + "-" + crypto.randomUUID().slice(0, 8);
function requireValue(value: unknown, message: string): asserts value {
  if (!value) throw Error(message);
}
function positive(n: number, message = "Enter a positive amount") {
  requireValue(Number.isFinite(n) && n > 0, message);
}
function reason(r: string) {
  requireValue(r?.trim(), "A reason is required.");
}
function history(s: State, r: RecordData, action: string, why = "") {
  r.history = [
    ...(r.history || []),
    { date: s.settings.asOf, action, reason: why },
  ];
}
export function log(s: State, k: Kind, id: string, action: string, why = "") {
  s.data.activities.unshift({
    id: uid("act"),
    name: action,
    status: "Recorded",
    date: s.settings.asOf,
    userId: "admin",
    linkedKind: k,
    linkedId: id,
    notes: why,
  });
  const r = find(s, k, id);
  if (r) history(s, r, action, why);
}
export function validateTerms(t: Terms) {
  requireValue(
    [30, 45, 60, 90].includes(t.days),
    "Terms must be 30, 45, 60 or 90 days.",
  );
  positive(t.value, "Fee value must be positive.");
  requireValue(t.guarantee >= 0, "Guarantee cannot be negative.");
  requireValue(t.salaryBasis, "Record the annual salary basis.");
}
export function save(s: State, k: Kind, input: RecordData) {
  requireValue(input.name.trim(), "Name is required.");
  const old = find(s, k, input.id);
  if (["invoices", "credits"].includes(k) && old?.status === "Issued")
    throw Error(
      "Issued financial values are locked. Use an explicit adjustment.",
    );
  if (k === "receipts" && old)
    throw Error(
      "Recorded receipts are preserved. Reverse and record a correction.",
    );
  if (k === "users") {
    requireValue(
      input.email?.includes("@"),
      "A valid example email is required.",
    );
    requireValue(
      !s.data.users.some(
        (u) =>
          u.id !== input.id &&
          u.email?.toLowerCase() === input.email?.toLowerCase(),
      ),
      "User email already exists.",
    );
    requireValue(
      input.id !== "admin" || input.status === "Active",
      "Super Admin must remain active.",
    );
  }
  if (k === "jobs") {
    requireValue(find(s, "clients", input.clientId), "Select a client.");
    positive(input.openings || 0, "Openings must be positive.");
    if (!old) {
      input.terms = { ...find(s, "clients", input.clientId)!.terms! };
      input.preferences =
        "Commercial terms copied from client on " + s.settings.asOf;
    }
    if (old && input.status !== old.status) reason(input.reason || "");
    if (old && JSON.stringify(old.terms) !== JSON.stringify(input.terms)) {
      input.preferences =
        "Job-specific override recorded on " + s.settings.asOf;
      if (
        s.data.applications.some(
          (a) =>
            a.jobId === old.id &&
            ["Offer Sent", "Offer Accepted", "Joined"].includes(a.stage || ""),
        )
      )
        reason(input.reason || "");
    }
  }
  if (k === "candidates") {
    requireValue(input.email?.includes("@"), "Candidate email must be valid.");
    if (input.consent === "Withdrawn" && old?.consent !== "Withdrawn")
      reason(input.notes || "");
  }
  if (
    k === "clients" &&
    old &&
    input.status !== "Active" &&
    (s.data.jobs.some((j) => j.clientId === old.id && j.status === "Open") ||
      s.data.invoices.some(
        (i) => i.clientId === old.id && invoiceNumbers(s, i).outstanding > 0,
      ))
  )
    requireValue(
      input.reason?.trim(),
      "Open jobs or unpaid invoices exist. Record a reason to confirm inactivity; historical balances remain collectible.",
    );
  if (k === "interviews") {
    requireValue(
      find(s, "applications", input.applicationId),
      "Select an application.",
    );
    requireValue(input.date && input.time, "Date and time are required.");
    const app = find(s, "applications", input.applicationId)!;
    const conflict = s.data.interviews.find(
      (i) =>
        i.id !== input.id &&
        ["Scheduled", "Rescheduled"].includes(i.status) &&
        i.date === input.date &&
        (i.userId === input.userId ||
          find(s, "applications", i.applicationId)?.candidateId ===
            app.candidateId) &&
        timeMinutes(i.time || "") <
          timeMinutes(input.time || "") + (input.duration || 45) &&
        timeMinutes(input.time || "") <
          timeMinutes(i.time || "") + (i.duration || 45),
    );
    if (conflict) reason(input.reason || "");
    if (input.status === "Completed")
      requireValue(
        input.feedback && input.recommendation,
        "Feedback and recommendation are required.",
      );
    if (old && old.date !== input.date) {
      reason(input.reason || "");
      input.status = "Rescheduled";
      input.history = [
        ...(old.history || []),
        {
          date: old.date,
          action: "Previous appointment " + old.time,
          reason: input.reason || "",
        },
      ];
      s.data.tasks
        .filter((t) => t.linkedId === old.id)
        .forEach((t) => (t.due = input.date));
    }
  }
  if (k === "targets" || k === "cash") positive(input.amount || 0);
  if (k === "applications" && input.probability !== undefined)
    requireValue(
      input.probability >= 0 && input.probability <= 1,
      "Probability must be between 0 and 1.",
    );
  if (k === "applications") {
    requireValue(
      find(s, "jobs", input.jobId) && find(s, "candidates", input.candidateId),
      "Candidate and job must resolve.",
    );
    requireValue(
      !s.data.applications.some(
        (a) =>
          a.id !== input.id &&
          a.candidateId === input.candidateId &&
          a.jobId === input.jobId &&
          !terminal.includes(a.stage || ""),
      ),
      "Another active candidate-job application exists.",
    );
  }
  if (
    k === "interviews" &&
    old &&
    ["Cancelled", "No Show"].includes(input.status) &&
    old.status !== input.status
  )
    reason(input.reason || "");
  if (k === "tasks" && input.linkedKind)
    requireValue(
      find(s, input.linkedKind, input.linkedId),
      "Linked record ID does not resolve.",
    );
  if (input.terms) validateTerms(input.terms);
  if (old) Object.assign(old, input);
  else s.data[k].unshift(input);
  log(
    s,
    k,
    input.id,
    old ? "Record updated" : "Record created",
    input.reason || "",
  );
  if (k === "interviews" && !old)
    s.data.tasks.push({
      id: uid("task"),
      name: "Interview reminder: " + input.name,
      status: "Pending",
      date: s.settings.asOf,
      due: input.date,
      userId: input.userId,
      linkedKind: "interviews",
      linkedId: input.id,
    });
}
const timeMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export function applyCandidate(
  s: State,
  candidateId: string,
  jobId: string,
  userId: string,
  replacementId?: string,
) {
  const c = find(s, "candidates", candidateId),
    j = find(s, "jobs", jobId);
  requireValue(c && j, "Candidate and job are required.");
  requireValue(j.status === "Open", "The job must be Open.");
  requireValue(
    c.consent !== "Withdrawn",
    "Withdrawn consent blocks new submissions. Update consent explicitly.",
  );
  requireValue(
    !s.data.applications.some(
      (a) =>
        a.candidateId === candidateId &&
        a.jobId === jobId &&
        !terminal.includes(a.stage || ""),
    ),
    "An active candidate-job application already exists.",
  );
  const a: RecordData = {
    id: uid("app"),
    name: "Application · " + c.name,
    status: "Active",
    date: s.settings.asOf,
    candidateId,
    jobId,
    userId,
    stage: "New",
    replacementId,
  };
  s.data.applications.unshift(a);
  log(s, "applications", a.id, "Application created");
  return a;
}
export function stage(
  s: State,
  id: string,
  next: string,
  why = "",
  exception = false,
) {
  const a = find(s, "applications", id)!;
  requireValue(a, "Application not found.");
  const j = find(s, "jobs", a.jobId)!,
    c = find(s, "candidates", a.candidateId)!;
  requireValue(j.status !== "Cancelled", "Cancelled jobs block progression.");
  requireValue(stages.includes(next), "Unknown stage.");
  if (next === "Joined")
    throw Error(
      "Use Confirm joining in Joinings to record actual joining and create a placement.",
    );
  if (
    terminal.includes(a.stage || "") ||
    ["Rejected", "Withdrawn", "On Hold"].includes(next)
  )
    reason(why);
  const rank = stages.indexOf(next);
  if (rank >= 3 && rank <= 7) {
    requireValue(a.userId, "Assign a recruiter before submission.");
    requireValue(j.status === "Open", "Reopen the job before submitting.");
    requireValue(c.consent !== "Withdrawn", "Consent is withdrawn.");
  }
  if (
    next === "Selected" &&
    !s.data.interviews.some(
      (i) => i.applicationId === id && i.status === "Completed",
    )
  ) {
    requireValue(
      exception,
      "Complete an interview or select an admin fast-track exception.",
    );
    reason(why);
  }
  if (next === "Offer Sent")
    requireValue(
      currentOffer(s, id) &&
        ["Sent", "Accepted"].includes(currentOffer(s, id).status),
      "Create and send an offer first.",
    );
  if (next === "Offer Accepted")
    requireValue(
      currentOffer(s, id)?.status === "Accepted" &&
        currentOffer(s, id)?.response,
      "Record offer acceptance and its date first.",
    );
  a.stage = next;
  log(s, "applications", id, "Stage: " + next, why);
  if (next === "Submitted to Client") a.actual = s.settings.asOf;
}
export function makeOffer(s: State, appId: string, input: Partial<RecordData>) {
  const a = find(s, "applications", appId)!;
  requireValue(
    ["Selected", "Offer Sent", "Offer Accepted"].includes(a.stage || ""),
    "Select the candidate before creating an offer.",
  );
  positive(input.salary || 0, "Annual salary must be positive.");
  const previous = currentOffer(s, appId);
  const o: RecordData = {
    ...input,
    id: uid("offer"),
    name: "Offer · " + find(s, "candidates", a.candidateId)!.name,
    date: s.settings.asOf,
    status: "Draft",
    applicationId: appId,
    version: (previous?.version || 0) + 1,
  };
  s.data.offers.push(o);
  log(s, "offers", o.id, "Offer version " + o.version);
  return o;
}
export function offerDecision(
  s: State,
  id: string,
  status: string,
  why = "",
  response?: string,
  expected?: string,
) {
  const o = find(s, "offers", id)!;
  requireValue(
    currentOffer(s, o.applicationId!)?.id === id,
    "Only the latest offer version can change.",
  );
  const a = find(s, "applications", o.applicationId)!;
  if (["Declined", "Expired", "Withdrawn"].includes(status)) reason(why);
  if (status === "Accepted") {
    requireValue(
      response && expected,
      "Acceptance date and expected joining date are required.",
    );
    o.response = response;
    o.expected = expected;
    a.expected = expected;
    a.stage = "Offer Accepted";
    if (!s.data.joinings.some((j) => j.applicationId === a.id))
      s.data.joinings.push({
        id: uid("joining"),
        name: "Joining · " + find(s, "candidates", a.candidateId)!.name,
        date: s.settings.asOf,
        status: "Expected",
        applicationId: a.id,
        offerId: o.id,
        expected,
      });
    else
      Object.assign(
        s.data.joinings.find((j) => j.applicationId === a.id)!,
        { offerId: o.id, expected, status: "Expected" },
      );
  }
  if (status === "Sent") a.stage = "Offer Sent";
  if (["Declined", "Expired", "Withdrawn"].includes(status))
    a.stage = status === "Withdrawn" ? "Withdrawn" : "Rejected";
  o.status = status;
  log(s, "offers", id, "Offer " + status, why);
  log(s, "applications", a.id, "Offer outcome " + status, why);
}
export function confirmJoining(
  s: State,
  id: string,
  input: {
    actual: string;
    salary: number;
    shares: { userId: string; percent: number }[];
    reason?: string;
    exception?: boolean;
  },
) {
  const jo = find(s, "joinings", id)!;
  const existing = s.data.placements.find(
    (p) => p.applicationId === jo.applicationId,
  );
  if (existing) return existing;
  const a = find(s, "applications", jo.applicationId)!,
    j = find(s, "jobs", a.jobId)!,
    o = currentOffer(s, a.id);
  requireValue(
    o?.status === "Accepted" || input.exception,
    "An accepted offer is required.",
  );
  if (input.exception) reason(input.reason || "");
  requireValue(input.actual, "Actual joining date is required.");
  requireValue(
    input.actual <= s.settings.asOf,
    "Actual joining cannot be in the future.",
  );
  positive(input.salary, "Record final annual salary.");
  requireValue(
    Math.abs(sum(input.shares.map((x) => x.percent)) - 100) < 0.001 &&
      input.shares.every((x) => x.percent > 0 && find(s, "users", x.userId)),
    "Recruiter shares must total 100 per cent.",
  );
  if (!a.replacementId && vacancies(s, j).remaining === 0)
    reason(input.reason || "");
  const rp = find(s, "replacements", a.replacementId);
  if (rp)
    requireValue(
      ["Approved", "In Progress"].includes(rp.status),
      "Approve replacement before joining.",
    );
  const p: RecordData = {
    id: uid("placement"),
    name: "Placement · " + find(s, "candidates", a.candidateId)!.name,
    status: "Active",
    date: input.actual,
    actual: input.actual,
    applicationId: a.id,
    jobId: j.id,
    clientId: j.clientId,
    candidateId: a.candidateId,
    userId: a.userId,
    salary: input.salary,
    terms: { ...j.terms! },
    shares: input.shares,
    billable: !rp || rp.treatment === "Billable replacement",
    originalId: rp?.originalId,
    replacementId: rp?.id,
    amount:
      !rp || rp.treatment === "Billable replacement"
        ? fee(j.terms!, input.salary)
        : 0,
    currency: "INR",
    guaranteeEnd:
      rp && !rp.restart
        ? find(s, "placements", rp.originalId)!.guaranteeEnd
        : addDays(input.actual, j.terms!.guarantee),
    plannedIssue: s.settings.asOf,
  };
  s.data.placements.push(p);
  jo.actual = input.actual;
  jo.status = "Joining Confirmed";
  a.stage = "Joined";
  if (rp) {
    rp.placementId = p.id;
    rp.status = "Fulfilled";
    log(s, "replacements", rp.id, "Replacement fulfilled");
  }
  log(s, "joinings", id, "Joining confirmed", input.reason || "");
  log(
    s,
    "placements",
    p.id,
    "Placement confirmed with commercial and attribution snapshots",
    input.reason || "",
  );
  log(s, "applications", a.id, "Stage: Joined", input.reason || "");
  return p;
}
export function draftInvoice(
  s: State,
  ids: string[],
  input: {
    days: number;
    trigger: Terms["trigger"];
    triggerDate: string;
    date: string;
    discount: number;
    tax: number;
    reason?: string;
  },
) {
  requireValue(ids.length, "Select at least one eligible placement.");
  const ps = ids.map((id) => find(s, "placements", id)!);
  requireValue(
    ps.every((p) => p && p.billable && billing(s, p) === "Billable Uninvoiced"),
    "Placement already billed or linked to a draft, or is non-billable.",
  );
  const p = ps[0];
  requireValue(
    ps.every(
      (x) =>
        x.clientId === p.clientId &&
        x.currency === p.currency &&
        x.terms!.days === p.terms!.days,
    ),
    "Group only same client, currency and snapshotted duration.",
  );
  const triggerDate =
    input.trigger === "Invoice date"
      ? input.date
      : input.trigger === "Joining date"
        ? p.actual
        : input.triggerDate;
  if (input.trigger === "Joining date")
    requireValue(
      ps.every((x) => x.actual === triggerDate),
      "Joining trigger dates differ; prepare separate invoices.",
    );
  requireValue(triggerDate, "Required trigger date is missing.");
  requireValue(
    [30, 45, 60, 90].includes(input.days),
    "Select a valid payment duration.",
  );
  requireValue(
    input.discount >= 0 && input.tax >= 0,
    "Discount and tax cannot be negative.",
  );
  requireValue(
    ps.every((x) => input.discount <= (x.amount || 0)),
    "Discount exceeds line fee.",
  );
  const i: RecordData = {
    id: uid("invoice"),
    name: "DRAFT-" + (s.data.invoices.length + 1),
    status: "Draft",
    date: input.date,
    clientId: p.clientId,
    currency: p.currency,
    terms: { ...p.terms!, days: input.days, trigger: input.trigger },
    triggerDate,
    due: addDays(triggerDate!, input.days),
    lines: ps.map((x) => ({
      placementId: x.id,
      fee: x.amount!,
      discount: input.discount,
      tax: input.tax,
    })),
    notes: input.reason,
  };
  s.data.invoices.push(i);
  i.reference =
    s.data.invoices
      .filter(
        (old) =>
          old.id !== i.id &&
          old.status === "Cancelled" &&
          old.lines?.some((l) => ids.includes(l.placementId)),
      )
      .map((old) => old.name + " (" + old.id + ")")
      .join(", ") || undefined;
  log(s, "invoices", i.id, "Invoice draft prepared");
  return i;
}
export function issueInvoice(s: State, id: string) {
  const i = find(s, "invoices", id)!;
  requireValue(i.status === "Draft", "Only drafts can be issued.");
  requireValue(i.lines?.length, "Invoice needs a line.");
  requireValue(
    i.date <= s.settings.asOf &&
      i.lines.every(
        (l) => find(s, "placements", l.placementId)?.actual! <= i.date,
      ),
    "Issue date must be on or after actual joining and on or before the demo date.",
  );
  requireValue(
    find(s, "clients", i.clientId)?.address,
    "Client billing address required.",
  );
  requireValue(i.triggerDate, "Trigger date required.");
  validateTerms(i.terms!);
  requireValue(
    invoiceNumbers(s, i).total > 0,
    "Invoice total must be positive.",
  );
  requireValue(
    i.lines.every((l) => {
      const p = find(s, "placements", l.placementId);
      return (
        p?.billable &&
        l.discount >= 0 &&
        l.discount <= l.fee &&
        !s.data.invoices.some(
          (x) =>
            x.id !== id &&
            x.status !== "Cancelled" &&
            x.lines?.some((y) => y.placementId === l.placementId),
        )
      );
    }),
    "Invalid or duplicate placement billing.",
  );
  i.due = addDays(i.triggerDate, i.terms!.days);
  i.status = "Issued";
  i.name = `${s.settings.prefix}-2026-${String(s.data.invoices.filter((x) => x.status === "Issued" || x.status === "Cancelled").length).padStart(3, "0")}`;
  log(s, "invoices", id, "Invoice issued");
}
export function creditInvoice(
  s: State,
  id: string,
  amount: number,
  why: string,
  issue = false,
  placementId?: string,
) {
  const i = find(s, "invoices", id)!;
  requireValue(i.status === "Issued", "Credit requires issued invoice.");
  positive(amount);
  reason(why);
  const n = invoiceNumbers(s, i);
  requireValue(
    amount <= n.total - n.credit + 0.001,
    "Credit exceeds remaining uncredited amount.",
  );
  const ls = placementId
    ? i.lines!.filter((l) => l.placementId === placementId)
    : i.lines!;
  requireValue(ls.length, "Select a valid line.");
  const remaining = ls.map((l) => {
    const used = sum(
      s.data.credits
        .filter((c) => c.invoiceId === id && c.status === "Issued")
        .flatMap((c) =>
          (c.lines || [])
            .filter((x) => x.placementId === l.placementId)
            .map((x) => (x.fee - x.discount) * (1 + x.tax / 100)),
        ),
    );
    return {
      ...l,
      remaining: round((l.fee - l.discount) * (1 + l.tax / 100) - used),
    };
  });
  const total = sum(remaining.map((l) => l.remaining));
  requireValue(
    amount <= total + 0.001,
    "Credit exceeds selected line balance.",
  );
  const lines = remaining.map((l) => ({
    placementId: l.placementId,
    fee: round((amount * l.remaining) / total / (1 + l.tax / 100)),
    discount: 0,
    tax: l.tax,
  }));
  const c: RecordData = {
    id: uid("credit"),
    name: "CN-" + (s.data.credits.length + 1),
    status: "Draft",
    date: s.settings.asOf,
    invoiceId: id,
    lines,
    amount: round(sum(lines.map((l) => l.fee + round((l.fee * l.tax) / 100)))),
    reason: why,
  };
  s.data.credits.push(c);
  if (issue) issueCredit(s, c.id);
  log(s, "credits", c.id, "Credit prepared", why);
  return c;
}
export function issueCredit(s: State, id: string) {
  const c = find(s, "credits", id)!,
    i = find(s, "invoices", c.invoiceId)!;
  requireValue(c.status === "Draft", "Only draft credits can be issued.");
  requireValue(
    (c.amount || 0) <=
      invoiceNumbers(s, i).total - invoiceNumbers(s, i).credit + 0.01,
    "Credit exceeds invoice balance available for credit.",
  );
  for (const l of c.lines || []) {
    const original = i.lines!.find((x) => x.placementId === l.placementId)!;
    const previous = sum(
      s.data.credits
        .filter((x) => x.invoiceId === i.id && x.status === "Issued")
        .flatMap((x) =>
          (x.lines || [])
            .filter((y) => y.placementId === l.placementId)
            .map((y) => y.fee - y.discount),
        ),
    );
    requireValue(
      previous + l.fee - l.discount <= original.fee - original.discount + 0.02,
      "Credit exceeds selected line uncredited fee.",
    );
  }
  c.status = "Issued";
  log(s, "credits", id, "Credit issued", c.reason);
}
export function recordReceipt(s: State, input: RecordData) {
  requireValue(find(s, "clients", input.clientId), "Select a client.");
  positive(input.amount || 0);
  requireValue(
    input.date && input.date <= s.settings.asOf,
    "Received date is required and cannot be in the future.",
  );
  input.amount = round(input.amount!);
  input.currency = "INR";
  input.status = "Recorded";
  s.data.receipts.push(input);
  log(s, "receipts", input.id, "Fictional receipt recorded");
  return input;
}
export function allocate(
  s: State,
  receiptId: string,
  invoiceId: string,
  amount: number,
) {
  const r = find(s, "receipts", receiptId)!,
    i = find(s, "invoices", invoiceId)!;
  requireValue(
    r && i && i.status === "Issued",
    "Select an issued invoice and receipt.",
  );
  requireValue(!r.reversed, "Reversed receipt cannot be allocated.");
  requireValue(
    r.clientId === i.clientId && r.currency === i.currency,
    "Client and currency must match.",
  );
  positive(amount);
  requireValue(
    amount <= receiptAvailable(s, r) + 0.001,
    "Allocation exceeds available receipt credit.",
  );
  requireValue(
    amount <= invoiceNumbers(s, i).outstanding + 0.001,
    "Allocation exceeds invoice outstanding.",
  );
  const a: RecordData = {
    id: uid("allocation"),
    name: "Allocation",
    date: s.settings.asOf,
    status: "Active",
    receiptId,
    invoiceId,
    amount: round(amount),
  };
  s.data.allocations.push(a);
  if (invoiceNumbers(s, i).outstanding === 0)
    s.data.tasks
      .filter(
        (t) => t.linkedId === i.id && t.name.toLowerCase().includes("collect"),
      )
      .forEach((t) => (t.status = "Completed"));
  log(s, "receipts", receiptId, "Receipt allocated", `${amount} to ${i.name}`);
}
export function reverseReceipt(s: State, id: string, why: string) {
  const r = find(s, "receipts", id)!;
  reason(why);
  requireValue(!r.reversed, "Receipt is already reversed.");
  requireValue(
    !s.data.refunds.some((x) => x.receiptId === id),
    "A refunded receipt cannot be fully reversed; record a separate correction.",
  );
  r.reversed = s.settings.asOf;
  r.reversalReason = why;
  log(s, "receipts", id, "Receipt reversed", why);
}
export function releaseCredit(
  s: State,
  invoiceId: string,
  receiptId: string,
  amount: number,
  why: string,
) {
  reason(why);
  const i = find(s, "invoices", invoiceId)!;
  positive(amount);
  requireValue(
    amount <= invoiceNumbers(s, i).clientCredit + 0.001,
    "Release exceeds over-settlement.",
  );
  let left = amount;
  for (const a of s.data.allocations.filter(
    (a) =>
      a.invoiceId === invoiceId && a.receiptId === receiptId && !a.archived,
  )) {
    const take = Math.min(left, a.amount || 0);
    a.amount = round((a.amount || 0) - take);
    left -= take;
    history(s, a, "Credit release", why);
  }
  requireValue(
    left < 0.001,
    "Selected receipt has insufficient allocation to release.",
  );
  log(
    s,
    "invoices",
    invoiceId,
    "Over-settlement released to receipt credit",
    why,
  );
}
export function refund(
  s: State,
  receiptId: string,
  amount: number,
  why: string,
  transactionDate: string,
  method: string,
  reference: string,
) {
  const r = find(s, "receipts", receiptId)!;
  positive(amount);
  reason(why);
  requireValue(
    transactionDate &&
      transactionDate >= r.date &&
      transactionDate <= s.settings.asOf,
    "Refund date must fall between the receipt date and the demo date.",
  );
  requireValue(
    amount <= receiptAvailable(s, r) + 0.001,
    "Refund exceeds unapplied receipt credit. Release invoice over-settlement first.",
  );
  s.data.refunds.push({
    id: uid("refund"),
    name: "Refund · " + r.name,
    receiptId,
    clientId: r.clientId,
    date: transactionDate,
    status: "Recorded",
    amount,
    currency: r.currency,
    method,
    reference,
    reason: why,
  });
  log(s, "receipts", receiptId, "Fictional refund recorded", why);
}
export function cancelInvoice(s: State, id: string, why: string) {
  const i = find(s, "invoices", id)!;
  reason(why);
  const n = invoiceNumbers(s, i);
  requireValue(
    n.allocated === 0 && n.credit === 0,
    "Invoices with payments or issued credits cannot be cancelled. Use explicit adjustments.",
  );
  i.status = "Cancelled";
  log(s, "invoices", id, "Invoice cancelled", why);
}
export function mergeCandidates(
  s: State,
  keepId: string,
  removeId: string,
  why: string,
) {
  reason(why);
  requireValue(keepId !== removeId, "Select different profiles.");
  const keep = find(s, "candidates", keepId)!,
    remove = find(s, "candidates", removeId)!;
  requireValue(keep && remove, "Profiles must exist.");
  requireValue(
    !s.data.applications.some(
      (a) =>
        a.candidateId === removeId &&
        !terminal.includes(a.stage || "") &&
        s.data.applications.some(
          (b) =>
            b.candidateId === keepId &&
            b.jobId === a.jobId &&
            !terminal.includes(b.stage || ""),
        ),
    ),
    "Conflicting active candidate-job applications. Reject or withdraw the duplicate application before merge.",
  );
  s.data.applications
    .filter((a) => a.candidateId === removeId)
    .forEach((a) => (a.candidateId = keepId));
  s.data.placements
    .filter((p) => p.candidateId === removeId)
    .forEach((p) => (p.candidateId = keepId));
  keep.notes = [keep.notes, remove.notes, why].filter(Boolean).join("\n");
  remove.archived = true;
  remove.status = "Merged";
  log(
    s,
    "candidates",
    keepId,
    "Duplicate profile merged",
    remove.name + " → " + keep.name + "; " + why,
  );
}
export function replacement(
  s: State,
  pId: string,
  ended: string,
  why: string,
  distinct = false,
) {
  const p = find(s, "placements", pId)!;
  reason(why);
  requireValue(
    ended && ended >= p.actual!,
    "Employment end must be on or after joining.",
  );
  requireValue(
    distinct ||
      !s.data.replacements.some(
        (r) =>
          r.originalId === pId &&
          !["Fulfilled", "Rejected", "Closed"].includes(r.status),
      ),
    "An open case already exists. A distinct request requires an override reason.",
  );
  const r: RecordData = {
    id: uid("case"),
    name: "Replacement · " + p.name,
    date: s.settings.asOf,
    originalId: pId,
    jobId: p.jobId,
    clientId: p.clientId,
    ended,
    status: "Requested",
    reason: why,
    treatment: "Free replacement",
    eligibility:
      ended <= p.guaranteeEnd! ? "Within guarantee" : "Outside guarantee",
    restart: false,
    userId: p.userId,
  };
  s.data.replacements.push(r);
  p.ended = ended;
  p.status = "Employment Ended";
  log(s, "replacements", r.id, "Replacement requested", why);
  return r;
}
export function reviewReplacement(
  s: State,
  id: string,
  status: string,
  treatment: string,
  why: string,
  restart: boolean,
) {
  const r = find(s, "replacements", id)!;
  reason(why);
  r.status = status;
  r.treatment = treatment;
  r.restart = restart;
  r.eligibility =
    r.ended! <= find(s, "placements", r.originalId)!.guaranteeEnd!
      ? "Within guarantee"
      : "Override: outside guarantee";
  log(s, "replacements", id, "Case " + status, why);
}
export function bulk(
  s: State,
  ids: string[],
  next: string,
  userId: string,
  why: string,
) {
  return ids.map((id) => {
    try {
      if (userId) {
        const a = find(s, "applications", id)!;
        const old = a.userId;
        a.userId = userId;
        log(
          s,
          "applications",
          id,
          "Recruiter reassigned",
          old + " → " + userId,
        );
      } else stage(s, id, next, why);
      return { id, ok: true, message: "Eligible" };
    } catch (e) {
      return { id, ok: false, message: (e as Error).message };
    }
  });
}
export function reassignOpenWork(
  s: State,
  from: string,
  to: string,
  why: string,
) {
  reason(why);
  requireValue(
    from !== to && find(s, "users", to)?.status === "Active",
    "Choose another active user.",
  );
  for (const k of ["applications", "jobs", "tasks", "replacements"] as Kind[])
    s.data[k]
      .filter(
        (x) =>
          x.userId === from &&
          ![
            "Joined",
            "Rejected",
            "Withdrawn",
            "Completed",
            "Cancelled",
            "Closed",
            "Fulfilled",
          ].includes(x.stage || x.status),
      )
      .forEach((x) => {
        x.userId = to;
        log(s, k, x.id, "Open work reassigned", why + "; " + from + " → " + to);
      });
  log(s, "users", from, "Open work reassigned", why);
}
