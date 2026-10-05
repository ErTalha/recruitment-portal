import { useState } from "react";
import { Printer, ArrowUpRight, FileText } from "lucide-react";
import {
  type Kind,
  type RecordData,
  type State,
  find,
  date,
  money,
  billing,
  vacancies,
  invoiceNumbers,
  receiptAvailable,
  currentOffer,
  fee,
  daysBetween,
  sum,
} from "./model";
import { fields, label, get, modules } from "./schema";
import { Table, Badge, Timeline, refColumn, type Column } from "./components";
import RecordActions from "./RecordActions";
import ImportCandidates from "./ImportCandidates";
import { useStore } from "./store";
import { log } from "./actions";
export const destination = (k: string) =>
  ({
    applications: "pipeline",
    receipts: "payments",
    placements: "joinings",
    credits: "invoices",
    cash: "cashflow",
    contacts: "clients",
    targets: "performance",
    teams: "users",
    activities: "tasks",
    refunds: "payments",
    allocations: "payments",
  })[k] || k;
export function columns(s: State, k: Kind): Column[] {
  const cols: Column[] = [
    {
      key: "name",
      title:
        k === "candidates"
          ? "Candidate"
          : k === "jobs"
            ? "Requirement"
            : "Record",
    },
  ];
  for (const [key, title, ref] of [
    ["clientId", "Client", "clients"],
    ["candidateId", "Candidate", "candidates"],
    ["jobId", "Job", "jobs"],
    ["applicationId", "Application", "applications"],
    ["userId", "Recruiter / owner", "users"],
  ] as [string, string, Kind][])
    if (s.data[k].some((r) => get(r, key)))
      cols.push(refColumn(s, key, title, ref));
  if (k === "applications")
    cols.push(
      { key: "stage", title: "Stage", render: (r) => <Badge>{r.stage}</Badge> },
      {
        key: "followUp",
        title: "Follow-up",
        render: (r) => (
          <span
            className={
              r.followUp && r.followUp < s.settings.asOf ? "danger" : ""
            }
          >
            {date(r.followUp)}
          </span>
        ),
      },
    );
  else
    cols.push({
      key: "status",
      title: "Status",
      render: (r) => <Badge>{r.status}</Badge>,
    });
  if (k === "clients")
    cols.push(
      {
        key: "terms.days",
        title: "Cycle",
        render: (r) => r.terms?.days + " days",
      },
      { key: "industry", title: "Industry" },
    );
  if (k === "jobs")
    cols.push({
      key: "openings",
      title: "Vacancies",
      render: (r) =>
        `${vacancies(s, r).filled} filled / ${vacancies(s, r).remaining} remaining`,
    });
  if (k === "candidates")
    cols.push(
      { key: "skills", title: "Skills" },
      {
        key: "consent",
        title: "Consent",
        render: (r) => <Badge>{r.consent}</Badge>,
      },
      { key: "availability", title: "Availability" },
    );
  if (k === "invoices")
    cols.push(
      {
        key: "amount",
        title: "Total",
        render: (r) => money(invoiceNumbers(s, r).total),
        exportValue: (r) => invoiceNumbers(s, r).total,
      },
      { key: "due", title: "Contractual due" },
      {
        key: "outstanding",
        title: "Outstanding",
        render: (r) => money(invoiceNumbers(s, r).outstanding),
        exportValue: (r) => invoiceNumbers(s, r).outstanding,
      },
      {
        key: "settlement",
        title: "Settlement",
        exportValue: (r) =>
          invoiceNumbers(s, r).settlement +
          (r.disputed ? " / Disputed" : "") +
          (invoiceNumbers(s, r).overdue > 0 ? " / Overdue" : ""),
        render: (r) => (
          <>
            <Badge>{invoiceNumbers(s, r).settlement}</Badge>
            {r.disputed && <Badge>Disputed</Badge>}
            {invoiceNumbers(s, r).overdue > 0 &&
              invoiceNumbers(s, r).outstanding > 0 && <Badge>Overdue</Badge>}
          </>
        ),
      },
    );
  if (k === "receipts")
    cols.push(
      { key: "amount", title: "Received" },
      {
        key: "available",
        title: "Unapplied credit",
        render: (r) => money(receiptAvailable(s, r)),
      },
      {
        key: "reversed",
        title: "Reversed on",
        render: (r) => date(r.reversed),
      },
    );
  if (k === "placements")
    cols.push(
      { key: "amount", title: "Fee" },
      {
        key: "billable",
        title: "Billing",
        render: (r) => <Badge>{billing(s, r)}</Badge>,
      },
      {
        key: "terms.days",
        title: "Payment cycle",
        render: (r) => `${r.terms?.days} days`,
      },
      {
        key: "guaranteeEnd",
        title: "Guarantee ends",
        render: (r) => date(r.guaranteeEnd),
      },
    );
  if (k === "offers")
    cols.push(
      {
        key: "salary",
        title: "Annual salary",
        render: (r) => money(r.salary || 0),
      },
      { key: "version", title: "Version" },
      { key: "expected", title: "Expected joining" },
    );
  if (k === "joinings")
    cols.push(
      { key: "expected", title: "Expected joining" },
      { key: "actual", title: "Actual joining", render: (r) => date(r.actual) },
    );
  if (k === "interviews")
    cols.push(
      { key: "date", title: "Interview date" },
      { key: "time", title: "Time IST" },
      { key: "recommendation", title: "Outcome" },
    );
  if (k === "replacements")
    cols.push(
      refColumn(s, "originalId", "Original placement", "placements"),
      { key: "treatment", title: "Treatment" },
      { key: "eligibility", title: "Eligibility" },
    );
  if (k === "cash" || k === "credits" || k === "targets" || k === "refunds")
    cols.push({ key: "amount", title: "Amount" });
  if (k === "tasks")
    cols.push(
      { key: "due", title: "Due" },
      { key: "priority", title: "Priority" },
    );
  if (k === "users")
    cols.push(
      { key: "role", title: "Role" },
      refColumn(s, "teamId", "Team", "teams"),
      { key: "scope", title: "Scope" },
    );
  if (!["interviews", "joinings", "invoices", "placements"].includes(k))
    cols.push({ key: "date", title: "Recorded" });
  return cols;
}
export function RecordList({
  kind,
  rows,
  onNavigate,
  extra,
  clientFilter,
}: {
  kind: Kind;
  rows?: RecordData[];
  onNavigate: (k: string, id?: string) => void;
  extra?: React.ReactNode;
  clientFilter?: string;
}) {
  const { state } = useStore();
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>
            {kind === "receipts"
              ? "Receipt register"
              : kind === "applications"
                ? "Applications"
                : kind === "cash"
                  ? "Management outflows"
                  : kind[0].toUpperCase() + kind.slice(1)}
          </h2>
          <p className="muted">Connected records · local demonstration</p>
        </div>
        <RecordActions kind={kind} onNavigate={onNavigate} />
      </div>
      <Table
        rows={rows || state.data[kind]}
        title={kind}
        columns={columns(state, kind)}
        onOpen={(r) => onNavigate(kind, r.id)}
        extra={kind === "candidates" ? <ImportCandidates /> : extra}
      />
      {kind === "invoices" && (
        <div className="panel">
          <h3>Eligible billable placements</h3>
          <RecordList
            kind="placements"
            rows={state.data.placements.filter(
              (p) =>
                billing(state, p) === "Billable Uninvoiced" &&
                (!clientFilter || p.clientId === clientFilter),
            )}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </>
  );
}
export function Detail({
  kind,
  id,
  onNavigate,
}: {
  kind: Kind;
  id: string;
  onNavigate: (k: string, id?: string) => void;
}) {
  const { state, run } = useStore();
  const r = find(state, kind, id);
  const [tab, setTab] = useState("Overview");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
  if (!r)
    return (
      <div className="empty">
        Record not found.{" "}
        <button onClick={() => onNavigate(kind)}>Return to list</button>
      </div>
    );
  const related: Partial<Record<Kind, RecordData[]>> = {};
  const put = (k: Kind, rs: RecordData[]) => {
    related[k] = rs;
  };
  const appIds =
    kind === "candidates"
      ? state.data.applications
          .filter((a) => a.candidateId === id)
          .map((a) => a.id)
      : kind === "jobs"
        ? state.data.applications.filter((a) => a.jobId === id).map((a) => a.id)
        : kind === "clients"
          ? state.data.applications
              .filter((a) => find(state, "jobs", a.jobId)?.clientId === id)
              .map((a) => a.id)
          : kind === "applications"
            ? [id]
            : [];
  if (kind === "clients") {
    for (const k of [
      "contacts",
      "jobs",
      "placements",
      "replacements",
      "invoices",
      "receipts",
    ] as Kind[])
      put(
        k,
        state.data[k].filter((x) => x.clientId === id),
      );
  }
  if (
    appIds.length ||
    ["jobs", "candidates", "clients", "applications"].includes(kind)
  ) {
    put(
      "applications",
      state.data.applications.filter((a) => appIds.includes(a.id)),
    );
    for (const k of [
      "interviews",
      "offers",
      "joinings",
      "placements",
    ] as Kind[])
      put(
        k,
        state.data[k].filter((a) => appIds.includes(a.applicationId || "")),
      );
  }
  if (kind === "placements") {
    put(
      "invoices",
      state.data.invoices.filter((i) =>
        i.lines?.some((l) => l.placementId === id),
      ),
    );
    put(
      "replacements",
      state.data.replacements.filter(
        (x) => x.originalId === id || x.placementId === id,
      ),
    );
  }
  if (kind === "replacements") {
    put(
      "applications",
      state.data.applications.filter((a) => a.replacementId === id),
    );
    put(
      "placements",
      state.data.placements.filter(
        (a) => a.id === r.originalId || a.replacementId === id,
      ),
    );
  }
  if (kind === "invoices") {
    put(
      "placements",
      state.data.placements.filter((p) =>
        r.lines?.some((l) => l.placementId === p.id),
      ),
    );
    put(
      "credits",
      state.data.credits.filter((c) => c.invoiceId === id),
    );
    put(
      "receipts",
      state.data.receipts.filter((rc) =>
        state.data.allocations.some(
          (a) => a.invoiceId === id && a.receiptId === rc.id,
        ),
      ),
    );
  }
  if (kind === "receipts") {
    put(
      "allocations",
      state.data.allocations.filter((a) => a.receiptId === id),
    );
    put(
      "refunds",
      state.data.refunds.filter((a) => a.receiptId === id),
    );
  }
  if (kind === "joinings" || kind === "offers" || kind === "interviews") {
    put(
      "applications",
      state.data.applications.filter((a) => a.id === r.applicationId),
    );
    put(
      "placements",
      state.data.placements.filter((p) => p.applicationId === r.applicationId),
    );
  }
  if (kind === "offers")
    put(
      "offers",
      state.data.offers.filter((o) => o.applicationId === r.applicationId),
    );
  const tabs = [
    "Overview",
    ...Object.keys(related).map((k) => k[0].toUpperCase() + k.slice(1)),
    "Activities",
  ];
  return (
    <>
      <div className="record-header">
        <div>
          <p className="eyebrow">
            {kind} / {r.id}
          </p>
          <h1>{r.name}</h1>
          <div className="record-meta">
            <Badge>{r.stage || r.status}</Badge>
            <span>Recorded {date(r.date)}</span>
            {r.billable !== undefined && <Badge>{billing(state, r)}</Badge>}
          </div>
        </div>
        <RecordActions kind={kind} record={r} onNavigate={onNavigate} />
      </div>
      <nav className="tabs">
        {tabs.map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t === "Receipts" ? "Payments" : t}
          </button>
        ))}
      </nav>
      {tab === "Activities" ? (
        <div className="panel">
          <Timeline state={state} kind={kind} id={id} />
          {r.history?.map((h, i) => (
            <p key={i}>
              {date(h.date)} · {h.action} · {h.reason}
            </p>
          ))}
        </div>
      ) : tab !== "Overview" ? (
        <RecordList
          kind={tab.toLowerCase() as Kind}
          rows={related[tab.toLowerCase() as Kind]}
          onNavigate={onNavigate}
        />
      ) : (
        <>
          {kind === "clients" && (
            <div className="operational-strip">
              {(() => {
                const inv = state.data.invoices.filter(
                    (i) => i.clientId === id && i.status === "Issued",
                  ),
                  nums = inv.map((i) => invoiceNumbers(state, i));
                return [
                  [
                    "Net invoiced fees",
                    sum(nums.map((n) => n.net - n.creditFee)),
                    "Invoices",
                  ],
                  [
                    "Allocated collections",
                    sum(nums.map((n) => n.allocated)),
                    "Receipts",
                  ],
                  [
                    "Outstanding",
                    sum(nums.map((n) => n.outstanding)),
                    "Invoices",
                  ],
                  [
                    "Overdue",
                    sum(
                      nums
                        .filter((n) => n.overdue > 0)
                        .map((n) => n.outstanding),
                    ),
                    "Invoices",
                  ],
                ].map(([text, n, t]) => (
                  <button key={text} onClick={() => setTab(String(t))}>
                    <span>{text}</span>
                    <strong>{money(Number(n))}</strong>
                  </button>
                ));
              })()}
            </div>
          )}
          {kind === "invoices" && (
            <FinancialDocument
              state={state}
              kind={kind}
              r={r}
              onNavigate={onNavigate}
            />
          )}
          {(kind === "credits" || kind === "receipts") && (
            <FinancialDocument
              state={state}
              kind={kind}
              r={r}
              onNavigate={onNavigate}
            />
          )}
          <div className="detail-grid">
            <div className="panel">
              <h3>Record details</h3>
              <dl>
                {Object.entries(r)
                  .filter(
                    ([k, v]) =>
                      !["history", "lines", "shares", "terms"].includes(k) &&
                      v !== undefined &&
                      typeof v !== "object",
                  )
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt>
                        {fields[kind]?.find((f) => f.key === k)?.label ||
                          k.replace(/([A-Z])/g, " $1")}
                      </dt>
                      <dd>
                        {k.endsWith("Id") && refKind(k) ? (
                          <button
                            className="record-link"
                            onClick={() => onNavigate(refKind(k)!, String(v))}
                          >
                            {label(state, refKind(k)!, String(v))}
                            <ArrowUpRight size={13} />
                          </button>
                        ) : [
                            "date",
                            "due",
                            "actual",
                            "expected",
                            "ended",
                            "deadline",
                            "guaranteeEnd",
                            "followUp",
                            "response",
                            "promise",
                            "plannedIssue",
                            "reversed",
                            "originalDue",
                            "triggerDate",
                            "resolved",
                          ].includes(k) ? (
                          date(String(v))
                        ) : [
                            "salary",
                            "amount",
                            "minSalary",
                            "maxSalary",
                            "currentSalary",
                          ].includes(k) ? (
                          money(Number(v))
                        ) : typeof v === "boolean" ? (
                          v ? (
                            "Yes"
                          ) : (
                            "No"
                          )
                        ) : (
                          String(v)
                        )}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
            <div className="panel">
              <h3>{r.terms ? "Commercial snapshot" : "Connected context"}</h3>
              {r.terms ? (
                <dl>
                  {Object.entries(r.terms).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>
                        {k === "value"
                          ? r.terms!.method === "Fixed"
                            ? money(Number(v))
                            : v + "%"
                          : String(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="muted">
                  Use related tabs to inspect linked records. Changes are
                  reflected throughout this workspace.
                </p>
              )}
              {r.shares && (
                <>
                  <h3>Stored fee attribution</h3>
                  {r.shares.map((sh) => (
                    <p key={sh.userId}>
                      {label(state, "users", sh.userId)} · {sh.percent}%
                    </p>
                  ))}
                </>
              )}
              {kind === "jobs" && (
                <>
                  <div className="stage-counts">
                    {[
                      "New",
                      "Screening",
                      "Shortlisted",
                      "Submitted to Client",
                      "Interviewing",
                      "Selected",
                      "Offer Sent",
                      "Offer Accepted",
                      "Joined",
                    ].map((stage) => (
                      <p key={stage}>
                        {stage}:{" "}
                        {
                          state.data.applications.filter(
                            (a) => a.jobId === id && a.stage === stage,
                          ).length
                        }
                      </p>
                    ))}
                  </div>
                  <p>
                    {vacancies(state, r).filled} filled ·{" "}
                    {vacancies(state, r).remaining} remaining · Reference fee{" "}
                    {money(
                      fee(
                        r.terms!,
                        ((r.minSalary || 0) + (r.maxSalary || 0)) / 2,
                      ),
                    )}
                  </p>
                  <p>
                    Replacement Pending:{" "}
                    {
                      state.data.replacements.filter(
                        (rp) =>
                          rp.jobId === id &&
                          !["Fulfilled", "Rejected", "Closed"].includes(
                            rp.status,
                          ),
                      ).length
                    }{" "}
                    reserved original slots. Terms source:{" "}
                    {r.preferences || "Client defaults snapshotted in seed"}
                  </p>
                </>
              )}
              {kind === "replacements" && (
                <p>
                  Guarantee ends{" "}
                  {date(find(state, "placements", r.originalId)?.guaranteeEnd)}{" "}
                  · Restart {r.restart ? "agreed" : "not agreed"}
                </p>
              )}
              {kind === "offers" && (
                <p>
                  Estimated fee{" "}
                  {money(
                    fee(
                      find(
                        state,
                        "jobs",
                        find(state, "applications", r.applicationId)?.jobId,
                      )!.terms!,
                      r.salary || 0,
                    ),
                  )}{" "}
                  · Latest version{" "}
                  {currentOffer(state, r.applicationId!)?.version}
                </p>
              )}
              {kind === "applications" && (
                <p className="notice">
                  {daysBetween(
                    r.history?.at(-1)?.date || r.date,
                    state.settings.asOf,
                  )}{" "}
                  days in stage.{" "}
                  {r.followUp && r.followUp < state.settings.asOf
                    ? "Follow-up overdue."
                    : "Follow-up " + date(r.followUp)}
                </p>
              )}
            </div>
          </div>
          {kind === "candidates" && (
            <div className="panel">
              <h3>
                <FileText size={18} /> Resume and supporting file
              </h3>
              <p className="muted">
                Sample resume is bundled. Selected file contents stay in this
                browser tab only; metadata persists. Refresh clears the local
                preview. No upload or parsing.
              </p>
              <label>
                Select local file
                <input
                  type="file"
                  accept="application/pdf,image/*,.txt"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (fileUrl) URL.revokeObjectURL(fileUrl);
                    setFileUrl(URL.createObjectURL(file));
                    setFileType(file.type);
                    run((s) => {
                      find(s, "candidates", id)!.documents = [
                        ...(find(s, "candidates", id)!.documents || []),
                        {
                          name: file.name,
                          size: file.size,
                          type: file.type,
                          attached: s.settings.asOf,
                        },
                      ];
                      find(s, "candidates", id)!.resume =
                        `${file.name} · ${file.size} bytes · metadata only`;
                      log(
                        s,
                        "candidates",
                        id,
                        "Local file metadata attached",
                        file.name,
                      );
                    });
                  }}
                />
              </label>
              {r.documents?.map((f, i) => (
                <p key={i}>
                  {f.name} · {f.size} bytes · {date(f.attached)} · metadata only
                </p>
              ))}
              {fileUrl ? (
                fileType.startsWith("image/") ? (
                  <img
                    className="resume-preview"
                    src={fileUrl}
                    alt="Locally selected supporting file"
                  />
                ) : (
                  <iframe
                    title="Local resume preview"
                    className="resume-preview"
                    src={fileUrl}
                  />
                )
              ) : (
                <iframe
                  className="resume-preview"
                  title="Bundled fictional resume"
                  src="./sample-resume.html"
                />
              )}
            </div>
          )}
          <div className="panel">
            <h3>Recent activity</h3>
            <Timeline state={state} kind={kind} id={id} />
          </div>
        </>
      )}
    </>
  );
}
function refKind(key: string): Kind | undefined {
  return (
    {
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
    } as Record<string, Kind>
  )[key];
}
function FinancialDocument({
  state,
  kind,
  r,
  onNavigate,
}: {
  state: State;
  kind: Kind;
  r: RecordData;
  onNavigate: (k: string, id?: string) => void;
}) {
  const i =
    kind === "invoices"
      ? r
      : kind === "credits"
        ? find(state, "invoices", r.invoiceId)
        : undefined;
  const n = i ? invoiceNumbers(state, i) : undefined;
  return (
    <div className="panel financial-document">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{state.settings.agency}</p>
          <h2>{r.name}</h2>
        </div>
        <button onClick={() => window.print()}>
          <Printer size={16} />
          Print{" "}
          {kind === "receipts"
            ? "receipt"
            : kind === "credits"
              ? "credit note"
              : "invoice"}
        </button>
      </div>
      <p>Fictional local demonstration · INR · {date(r.date)}</p>
      <p>
        {state.settings.branding ||
          "Permanent recruitment · Illustrative business document"}{" "}
        {state.settings.contact}
      </p>
      <p>
        {label(state, "clients", r.clientId || i?.clientId)} ·{" "}
        {find(state, "clients", r.clientId || i?.clientId)?.address}
      </p>
      {i && (
        <p>
          Payment terms: {i.terms?.days} calendar days from {i.terms?.trigger} (
          {date(i.triggerDate)}) · Due {date(i.due)}
        </p>
      )}
      {r.lines && (
        <table>
          <thead>
            <tr>
              <th>Placement / annual salary basis</th>
              <th>Gross fee</th>
              <th>Discount</th>
              <th>Tax</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {r.lines.map((l) => (
              <tr key={l.placementId}>
                <td>
                  <button
                    className="record-link"
                    onClick={() => onNavigate("placements", l.placementId)}
                  >
                    {label(state, "placements", l.placementId)}
                  </button>
                  <small>
                    {money(
                      find(state, "placements", l.placementId)?.salary || 0,
                    )}{" "}
                    ·{" "}
                    {
                      find(state, "placements", l.placementId)?.terms
                        ?.salaryBasis
                    }
                  </small>
                </td>
                <td>{money(l.fee)}</td>
                <td>{money(l.discount)}</td>
                <td>{l.tax}% illustrative</td>
                <td>{money((l.fee - l.discount) * (1 + l.tax / 100))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {kind === "invoices" && n && (
        <div className="document-totals">
          <span>Net fee {money(n.net)}</span>
          <span>Tax {money(n.tax)}</span>
          <strong>Total {money(n.total)}</strong>
          <span>Issued credits {money(n.credit)}</span>
          <span>Net allocated {money(n.allocated)}</span>
          <strong>Outstanding {money(n.outstanding)}</strong>
          <span>Client credit {money(n.clientCredit)}</span>
          <Badge>{r.status}</Badge>
          <Badge>{n.settlement}</Badge>
          <span>
            Ageing {n.bucket} · {n.overdue} days
          </span>
        </div>
      )}
      {kind === "receipts" && (
        <div className="document-totals">
          <strong>Received {money(r.amount || 0)}</strong>
          <span>Available credit {money(receiptAvailable(state, r))}</span>
          <span>
            {r.method} · {r.reference}
          </span>
          <span>
            {r.reversed
              ? "Reversed " + date(r.reversed)
              : "Local receipt recorded"}
          </span>
        </div>
      )}
      {kind === "credits" && (
        <p>
          Credit {money(r.amount || 0)} · {r.status} · {r.reason}
        </p>
      )}
    </div>
  );
}
