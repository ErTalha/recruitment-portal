import { useState } from "react";
import {
  ArrowUpRight,
  Briefcase,
  Users,
  IndianRupee,
  TrendingUp,
  Calendar,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { useStore } from "./store";
import {
  type State,
  type RecordData,
  type Kind,
  totals,
  invoiceNumbers,
  attribution,
  forecast,
  find,
  date,
  money,
  sum,
  billing,
  vacancies,
  collectionDate,
  receiptAvailable,
  daysBetween,
  currentOffer,
  fee,
  periodFees,
} from "./model";
import { Table, Badge, type Column, refColumn } from "./components";
import { RecordList, columns } from "./Records";
import RecordActions from "./RecordActions";
import { label } from "./schema";
type Nav = (k: string, id?: string, filter?: string) => void;
export function clientReport(
  s: State,
  start = "0000-01-01",
  end = s.settings.asOf,
): RecordData[] {
  return s.data.clients.map((c) => {
    const ps = s.data.placements.filter(
      (p) => p.clientId === c.id && p.date >= start && p.date <= end,
    );
    const inv = s.data.invoices.filter(
      (i) =>
        i.clientId === c.id &&
        i.status === "Issued" &&
        i.date <= s.settings.asOf,
    );
    const nums = inv.map((i) => invoiceNumbers(s, i));
    const periodInv = inv.filter((i) => i.date >= start && i.date <= end),
      periodNums = periodInv.map((i) => invoiceNumbers(s, i));
    const periodCredits = s.data.credits.filter(
      (cr) =>
        cr.status === "Issued" &&
        cr.date >= start &&
        cr.date <= end &&
        find(s, "invoices", cr.invoiceId)?.clientId === c.id,
    );
    return {
      ...c,
      amount: periodFees(s, start, end, undefined, c.id),
      salary: sum(periodInv.flatMap((i) => (i.lines || []).map((l) => l.fee))),
      currentSalary: sum(periodNums.map((n) => n.tax)),
      openings: ps.filter((p) => !p.originalId).length,
      round: ps.filter((p) => p.originalId && !p.billable).length,
      notice: sum(
        periodCredits.flatMap((cr) =>
          (cr.lines || []).map((l) => l.fee - l.discount),
        ),
      ),
      experience: sum(
        periodInv.flatMap((i) => (i.lines || []).map((l) => l.discount)),
      ),
      reference: money(sum(periodNums.map((n) => n.total))),
      rating: sum(nums.map((n) => n.allocated)),
      probability: sum(nums.map((n) => n.outstanding)),
      duration: sum(
        nums.filter((n) => n.overdue > 0).map((n) => n.outstanding),
      ),
      minSalary:
        sum(
          s.data.receipts
            .filter((r) => r.clientId === c.id)
            .map((r) => Math.max(0, receiptAvailable(s, r))),
        ) + sum(nums.map((n) => n.clientCredit)),
    };
  });
}
export function recruiterReport(
  s: State,
  start = "0000-01-01",
  end = s.settings.asOf,
): RecordData[] {
  return s.data.users
    .filter((u) => u.role === "Recruiter")
    .map((u) => {
      const apps = s.data.applications.filter((a) => a.userId === u.id);
      const interviews = s.data.interviews.filter(
        (i) =>
          i.status === "Completed" &&
          apps.some((a) => a.id === i.applicationId),
      );
      const a = attribution(s, u.id);
      return {
        ...u,
        amount: periodFees(s, start, end, u.id),
        salary: a.collected,
        openings: s.data.placements.filter(
          (p) => !p.originalId && p.shares?.some((sh) => sh.userId === u.id),
        ).length,
        round: apps.filter((a) =>
          [
            "Submitted to Client",
            "Interviewing",
            "Selected",
            "Offer Sent",
            "Offer Accepted",
            "Joined",
          ].includes(a.stage || ""),
        ).length,
        experience: interviews.length,
        notice: apps.filter((a) =>
          ["Selected", "Offer Sent", "Offer Accepted", "Joined"].includes(
            a.stage || "",
          ),
        ).length,
        rating: apps.filter((a) => currentOffer(s, a.id)?.status === "Accepted")
          .length,
        duration: s.data.placements.filter(
          (p) => p.originalId && p.userId === u.id,
        ).length,
        failedJoinings: s.data.joinings.filter(
          (j) =>
            j.status === "Failed to Join" &&
            apps.some((a) => a.id === j.applicationId),
        ).length,
        activeReplacements: s.data.replacements.filter(
          (r) =>
            r.userId === u.id &&
            !["Fulfilled", "Rejected", "Closed"].includes(r.status),
        ).length,
        targetAchievement: (() => {
          const targets = s.data.targets.filter(
            (t) => t.userId === u.id && t.targetType === "Net fees",
          );
          const target = sum(targets.map((t) => t.amount || 0));
          return target
            ? (
                (sum(targets.map((t) => targetActual(s, t))) / target) *
                100
              ).toFixed(1) + "%"
            : "Not Set";
        })(),
        minSalary: s.data.candidates.filter((c) => c.userId === u.id).length,
        maxSalary: apps.filter(
          (a) => !["Joined", "Rejected", "Withdrawn"].includes(a.stage || ""),
        ).length,
      };
    });
}
const m = (key: string, title: string): Column => ({
  key,
  title,
  render: (r) =>
    money(Number((r as unknown as Record<string, unknown>)[key]) || 0),
  exportValue: (r) =>
    Number((r as unknown as Record<string, unknown>)[key]) || 0,
});
const clientCols: Column[] = [
  { key: "name", title: "Client" },
  { key: "openings", title: "Original placements" },
  { key: "round", title: "Free replacements" },
  m("salary", "Gross fees"),
  m("experience", "Discounts"),
  m("notice", "Fee credits"),
  m("amount", "Net invoiced fees"),
  m("currentSalary", "Tax"),
  { key: "reference", title: "Billed total" },
  m("rating", "Allocated collections"),
  m("minSalary", "Client credit"),
  m("probability", "Outstanding"),
  m("duration", "Overdue"),
];
const recruiterCols: Column[] = [
  { key: "name", title: "Recruiter" },
  { key: "minSalary", title: "Sourced profiles" },
  { key: "maxSalary", title: "Active applications" },
  { key: "round", title: "Submissions reached" },
  { key: "experience", title: "Completed interviews" },
  { key: "notice", title: "Selections reached" },
  { key: "rating", title: "Accepted offers" },
  { key: "openings", title: "Original joinings" },
  { key: "duration", title: "Replacements" },
  { key: "failedJoinings", title: "Failed joinings" },
  { key: "activeReplacements", title: "Active cases" },
  { key: "targetAchievement", title: "Fee target progress" },
  m("amount", "Net attributed fees"),
  m("salary", "Allocated fee collections"),
];
export function Metric({
  title,
  value,
  caption,
  onClick,
  icon,
}: {
  title: string;
  value: string;
  caption?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button className="metric" onClick={onClick}>
      <div>
        <span>{title}</span>
        {icon || <ArrowUpRight size={17} />}
      </div>
      <strong>{value}</strong>
      <small>{caption || "As of demonstration date"}</small>
    </button>
  );
}
function Chart({
  title,
  data,
  x,
  bars,
  onNavigate,
}: {
  title: string;
  data: Record<string, string | number>[];
  x: string;
  bars: string[];
  onNavigate?: () => void;
}) {
  return (
    <section className="panel chart-panel">
      <div className="section-heading">
        <h3>{title}</h3>
        {onNavigate && (
          <button className="text" onClick={onNavigate}>
            View records <ArrowUpRight size={14} />
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={235}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e8ecea"
          />
          <XAxis dataKey={x} tickLine={false} axisLine={false} fontSize={11} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickFormatter={(n) => (n >= 1000 ? Math.round(n / 1000) + "k" : n)}
          />
          <Tooltip
            formatter={(v) =>
              typeof v === "number" && v > 1000 ? money(v) : v
            }
          />
          <Legend />
          {bars.map((b, i) => (
            <Bar
              key={b}
              name={b}
              dataKey={b}
              fill={["#25756b", "#a2c2b7", "#d9b97c"][i % 3]}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
export function Dashboard({ onNavigate }: { onNavigate: Nav }) {
  const { state } = useStore();
  const [client, setClient] = useState(""),
    [recruiter, setRecruiter] = useState(""),
    [team, setTeam] = useState("");
  const filtered = scope(state, client, recruiter, team);
  const t = totals(filtered);
  const metrics = [
    [
      "Capacity-weighted pipeline",
      money(t.pipeline),
      "forecast",
      "Competing candidates capped by vacancies",
    ],
    [
      "Billable uninvoiced fees",
      money(t.uninvoiced),
      "invoices",
      `${money(t.draft)} already in drafts`,
    ],
    [
      "Net invoiced fees",
      money(t.netFees),
      "reports",
      "Credits deducted · tax excluded",
    ],
    [
      "Net cash collected",
      money(t.cash),
      "payments",
      "Receipts less reversals and refunds",
    ],
    [
      "Outstanding receivables",
      money(t.outstanding),
      "collections",
      "Includes disputed balances",
    ],
    [
      "Overdue receivables",
      money(t.overdue),
      "collections",
      "Contractual due dates",
    ],
  ];
  const stageData = [
    "Screening",
    "Shortlisted",
    "Submitted to Client",
    "Interviewing",
    "Selected",
    "Offer Sent",
    "Offer Accepted",
  ].map((st) => ({
    stage: st.replace("Submitted to Client", "Submitted"),
    Applications: filtered.data.applications.filter((a) => a.stage === st)
      .length,
  }));
  const months = [
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
    "2026-11",
  ];
  const monthly = months.map((month) => ({
    month: new Date(month + "-01T00:00Z").toLocaleString("en-GB", {
      month: "short",
      timeZone: "UTC",
    }),
    "Net fees":
      sum(
        filtered.data.invoices
          .filter((i) => i.status === "Issued" && i.date.startsWith(month))
          .map((i) => invoiceNumbers(filtered, i).net),
      ) -
      sum(
        filtered.data.credits
          .filter((c) => c.status === "Issued" && c.date.startsWith(month))
          .flatMap((c) => (c.lines || []).map((l) => l.fee - l.discount)),
      ),
    Receipts:
      sum(
        filtered.data.receipts
          .filter((r) => r.date.startsWith(month))
          .map((r) => r.amount || 0),
      ) -
      sum(
        filtered.data.receipts
          .filter((r) => r.reversed?.startsWith(month))
          .map((r) => r.amount || 0),
      ) -
      sum(
        filtered.data.refunds
          .filter((r) => r.date.startsWith(month))
          .map((r) => r.amount || 0),
      ),
  }));
  const exceptions = notifications(filtered);
  return (
    <>
      <div className="welcome">
        <div>
          <p className="eyebrow">
            {new Date(state.settings.asOf + "T00:00Z").toLocaleDateString(
              "en-GB",
              { weekday: "long", timeZone: "UTC" },
            )}
            , {date(state.settings.asOf)}
          </p>
          <h1>Your agency, in focus.</h1>
          <p>A connected view of people, placements and collections.</p>
        </div>
        <span className="workspace-tag">
          Founder overview <TrendingUp size={17} />
        </span>
      </div>
      <FilterStrip
        state={state}
        client={client}
        recruiter={recruiter}
        team={team}
        setClient={setClient}
        setRecruiter={setRecruiter}
        setTeam={setTeam}
      />
      <div className="metric-grid">
        {metrics.map(([title, value, k, caption]) => (
          <Metric
            key={title}
            title={title}
            value={value}
            caption={caption}
            onClick={() => onNavigate(k, undefined, client)}
            icon={title.includes("cash") ? <Wallet size={17} /> : undefined}
          />
        ))}
      </div>
      <div className="operational-strip">
        {[
          [
            "Active clients",
            filtered.data.clients.filter((c) => c.status === "Active").length,
            "clients",
          ],
          [
            "Open jobs",
            filtered.data.jobs.filter((j) => j.status === "Open").length,
            "jobs",
          ],
          [
            "Remaining vacancies",
            sum(
              filtered.data.jobs
                .filter((j) => j.status === "Open")
                .map((j) => vacancies(filtered, j).remaining),
            ),
            "jobs",
          ],
          [
            "Active applications",
            filtered.data.applications.filter(
              (a) =>
                !["Joined", "Rejected", "Withdrawn"].includes(a.stage || ""),
            ).length,
            "pipeline",
          ],
          [
            "Interviews due",
            filtered.data.interviews.filter(
              (i) =>
                ["Scheduled", "Rescheduled"].includes(i.status) &&
                i.date === state.settings.asOf,
            ).length,
            "interviews",
          ],
          [
            "Accepted offers",
            filtered.data.offers.filter(
              (o) =>
                o.status === "Accepted" &&
                currentOffer(filtered, o.applicationId!)?.id === o.id,
            ).length,
            "offers",
          ],
          [
            "Original placements",
            filtered.data.placements.filter((p) => !p.originalId).length,
            "joinings",
          ],
          [
            "Upcoming joinings",
            filtered.data.joinings.filter((j) =>
              ["Expected", "Deferred"].includes(j.status),
            ).length,
            "joinings",
          ],
          [
            "Open replacements",
            filtered.data.replacements.filter(
              (r) => !["Fulfilled", "Rejected", "Closed"].includes(r.status),
            ).length,
            "replacements",
          ],
        ].map(([n, v, k]) => (
          <button
            key={n}
            onClick={() => onNavigate(String(k), undefined, client)}
          >
            <strong>{v}</strong>
            <span>{n}</span>
            <ArrowUpRight size={13} />
          </button>
        ))}
      </div>
      <div className="two-col">
        <Chart
          title="Recruitment funnel"
          data={stageData}
          x="stage"
          bars={["Applications"]}
          onNavigate={() => onNavigate("pipeline")}
        />
        <Chart
          title="Fees & actual collections · INR"
          data={monthly}
          x="month"
          bars={["Net fees", "Receipts"]}
          onNavigate={() => onNavigate("reports")}
        />
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="section-heading">
            <h3>Needs your attention</h3>
            <span className="badge amber">
              {exceptions.length} local alerts
            </span>
          </div>
          {exceptions.slice(0, 6).map((a) => (
            <button
              className="alert-row"
              key={a.id}
              onClick={() => onNavigate(a.kind, a.recordId)}
            >
              <span className="alert-icon">
                <Calendar size={16} />
              </span>
              <span>
                <strong>{a.title}</strong>
                <small>{a.description}</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h3>Client revenue contribution</h3>
            <button className="text" onClick={() => onNavigate("reports")}>
              Client report <ArrowUpRight size={14} />
            </button>
          </div>
          {clientReport(filtered)
            .sort((a, b) => b.amount! - a.amount!)
            .slice(0, 5)
            .map((c, i) => (
              <button
                className="rank-row"
                key={c.id}
                onClick={() => onNavigate("clients", c.id)}
              >
                <span className="avatar">{c.name[0]}</span>
                <span>
                  <strong>{c.name}</strong>
                  <small>{c.openings} original placements</small>
                </span>
                <strong>{money(c.amount || 0)}</strong>
              </button>
            ))}
        </section>
      </div>
      <div className="two-col">
        <Chart
          title="Payment-cycle receivable exposure · INR"
          data={[30, 45, 60, 90].map((days) => ({
            cycle: days + " days",
            Outstanding: sum(
              filtered.data.invoices
                .filter((i) => i.status === "Issued" && i.terms?.days === days)
                .map((i) => invoiceNumbers(filtered, i).outstanding),
            ),
          }))}
          x="cycle"
          bars={["Outstanding"]}
          onNavigate={() => onNavigate("collections")}
        />
        <Chart
          title="Recruiter target progress · net fee INR"
          data={recruiterReport(filtered).map((u) => ({
            name: u.name.split(" ")[0],
            Actual: u.amount || 0,
            Target: sum(
              filtered.data.targets
                .filter((t) => t.userId === u.id && t.targetType === "Net fees")
                .map((t) => t.amount || 0),
            ),
          }))}
          x="name"
          bars={["Actual", "Target"]}
          onNavigate={() => onNavigate("performance")}
        />
      </div>
    </>
  );
}
export interface Notification {
  id: string;
  kind: Kind;
  recordId: string;
  title: string;
  description: string;
}
export function notifications(s: State): Notification[] {
  const a: Notification[] = [];
  function add(k: Kind, r: RecordData, t: string, desc: string) {
    a.push({
      id: k + "-" + r.id,
      kind: k,
      recordId: r.id,
      title: t,
      description: desc,
    });
  }
  for (const t of s.data.tasks.filter(
    (t) =>
      !["Completed", "Cancelled"].includes(t.status) &&
      t.due! <= s.settings.asOf,
  ))
    add("tasks", t, t.name, "Due " + date(t.due));
  for (const j of s.data.joinings.filter(
    (j) =>
      ["Expected", "Deferred"].includes(j.status) &&
      j.expected! <= s.settings.asOf,
  ))
    add("joinings", j, "Joining delayed", j.name + " · " + date(j.expected));
  for (const i of s.data.invoices.filter(
    (i) => i.status === "Issued" && invoiceNumbers(s, i).outstanding > 0,
  )) {
    if (i.promise && i.promise < s.settings.asOf)
      add(
        "invoices",
        i,
        "Missed collection promise",
        i.name + " · " + date(i.promise),
      );
    else if (invoiceNumbers(s, i).overdue > 0)
      add(
        "invoices",
        i,
        "Invoice overdue",
        i.name + " · " + money(invoiceNumbers(s, i).outstanding),
      );
  }
  for (const p of s.data.placements.filter(
    (p) =>
      p.guaranteeEnd! >= s.settings.asOf &&
      daysBetween(s.settings.asOf, p.guaranteeEnd!) <= s.settings.reminder,
  ))
    add(
      "placements",
      p,
      "Guarantee expiring",
      p.name + " · " + date(p.guaranteeEnd),
    );
  for (const i of s.data.interviews.filter(
    (i) =>
      ["Scheduled", "Rescheduled"].includes(i.status) &&
      Math.abs(daysBetween(s.settings.asOf, i.date)) <= s.settings.reminder,
  ))
    add("interviews", i, "Interview follow-up", date(i.date) + " · " + i.name);
  for (const p of s.data.placements.filter(
    (p) => billing(s, p) === "Billable Uninvoiced",
  ))
    add(
      "placements",
      p,
      "Placement ready to invoice",
      p.name + " · " + money(p.amount || 0),
    );
  for (const app of s.data.applications.filter(
    (app) =>
      !["Joined", "Rejected", "Withdrawn"].includes(app.stage || "") &&
      ((app.followUp && app.followUp < s.settings.asOf) ||
        daysBetween(app.history?.at(-1)?.date || app.date, s.settings.asOf) >
          s.settings.stageAge),
  ))
    add(
      "applications",
      app,
      "Application follow-up / stage ageing",
      app.name + " · " + date(app.followUp),
    );
  return a;
}
function scope(s: State, client: string, recruiter: string, team: string) {
  const next = structuredClone(s);
  const users = s.data.users
    .filter(
      (u) => (!recruiter || u.id === recruiter) && (!team || u.teamId === team),
    )
    .map((u) => u.id);
  const jobs = s.data.jobs.filter(
    (j) =>
      (!client || j.clientId === client) &&
      ((!recruiter && !team) ||
        users.includes(j.userId || "") ||
        users.includes(j.ownerId || "")),
  );
  const ids = jobs.map((j) => j.id);
  next.data.jobs = jobs;
  next.data.clients = s.data.clients.filter((c) => !client || c.id === client);
  next.data.applications = s.data.applications.filter(
    (a) =>
      ids.includes(a.jobId || "") &&
      ((!recruiter && !team) || users.includes(a.userId || "")),
  );
  const apps = next.data.applications.map((a) => a.id);
  for (const k of ["joinings", "interviews", "offers"] as Kind[])
    next.data[k] = s.data[k].filter((x) =>
      apps.includes(x.applicationId || ""),
    );
  next.data.placements = s.data.placements.filter(
    (p) =>
      (!client || p.clientId === client) &&
      ((!recruiter && !team) ||
        p.shares?.some((sh) => users.includes(sh.userId))),
  );
  const pids = next.data.placements.map((p) => p.id);
  next.data.invoices = s.data.invoices.filter(
    (i) =>
      (!client || i.clientId === client) &&
      ((!recruiter && !team) ||
        i.lines?.some((l) => pids.includes(l.placementId))),
  );
  const invIds = next.data.invoices.map((i) => i.id);
  next.data.credits = s.data.credits.filter((c) =>
    invIds.includes(c.invoiceId || ""),
  );
  next.data.receipts = s.data.receipts.filter(
    (r) =>
      (!client || r.clientId === client) &&
      ((!recruiter && !team) ||
        s.data.allocations.some(
          (a) => a.receiptId === r.id && invIds.includes(a.invoiceId || ""),
        )),
  );
  const rcids = next.data.receipts.map((r) => r.id);
  next.data.refunds = s.data.refunds.filter((r) =>
    rcids.includes(r.receiptId || ""),
  );
  return next;
}
function FilterStrip({
  state,
  client,
  recruiter,
  team,
  setClient,
  setRecruiter,
  setTeam,
}: {
  state: State;
  client: string;
  recruiter: string;
  team: string;
  setClient: (v: string) => void;
  setRecruiter: (v: string) => void;
  setTeam: (v: string) => void;
}) {
  return (
    <div className="filter-strip">
      <span>Agency to date · as of {date(state.settings.asOf)}</span>
      {(
        [
          ["clients", client, setClient],
          ["users", recruiter, setRecruiter],
          ["teams", team, setTeam],
        ] as [Kind, string, (v: string) => void][]
      ).map(([k, value, set]) => (
        <select
          key={k}
          aria-label={"Filter " + k}
          value={value}
          onChange={(e) => set(e.target.value)}
        >
          <option value="">All {k === "users" ? "recruiters" : k}</option>
          {state.data[k].map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
export function Forecast({ onNavigate }: { onNavigate: Nav }) {
  const { state } = useStore();
  const rows = forecast(state).map((a) => ({
    ...a,
    amount: a.weighted,
    currentSalary: a.estimate,
    reference: a.expected?.slice(0, 7) || "Unscheduled",
    rating: a.scale,
  }));
  const t = totals(state);
  const [group, setGroup] = useState("Client");
  const key =
    group === "Client"
      ? "clientId"
      : group === "Recruiter"
        ? "userId"
        : group === "Job"
          ? "jobId"
          : "reference";
  const grouped = Object.entries(
    Object.groupBy(rows, (r) =>
      String((r as unknown as Record<string, unknown>)[key] || "Unscheduled"),
    ),
  ).map(([id, rs]) => ({
    name:
      key === "reference"
        ? id
        : label(
            state,
            key === "clientId" ? "clients" : key === "jobId" ? "jobs" : "users",
            id,
          ),
    Weighted: sum((rs || []).map((r) => r.amount || 0)),
  }));
  return (
    <>
      <div className="metric-grid three">
        <Metric
          title="Capacity-weighted pipeline"
          value={money(t.pipeline)}
          onClick={() => onNavigate("pipeline")}
        />
        <Metric
          title="Billable uninvoiced"
          value={money(t.uninvoiced)}
          caption={"Draft-linked subset " + money(t.draft)}
          onClick={() => onNavigate("invoices")}
        />
        <Metric
          title="Unweighted vacancy opportunity"
          value={money(
            sum(
              state.data.jobs
                .filter((j) => j.status === "Open")
                .map(
                  (j) =>
                    vacancies(state, j).remaining *
                    fee(
                      j.terms!,
                      ((j.minSalary || 0) + (j.maxSalary || 0)) / 2,
                    ),
                ),
            ),
          )}
          onClick={() => onNavigate("jobs")}
        />
      </div>
      <div className="notice">
        For each job: Σ(fee × probability) × min(1, remaining vacancies ÷
        Σprobability). Capacity is applied before grouping. Closed and held
        jobs, joined, terminal, held and replacement applications are excluded.
        Missing expected dates are Unscheduled.
      </div>
      <select
        aria-label="Forecast breakdown"
        value={group}
        onChange={(e) => setGroup(e.target.value)}
      >
        {["Client", "Job", "Recruiter", "Month"].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <Chart
        title={"Weighted pipeline by " + group.toLowerCase()}
        data={grouped}
        x="name"
        bars={["Weighted"]}
      />
      <Table
        rows={rows}
        title="forecast contributions"
        columns={[
          { key: "name", title: "Application" },
          refColumn(state, "clientId", "Client", "clients"),
          refColumn(state, "userId", "Recruiter", "users"),
          { key: "reference", title: "Expected month" },
          m("currentSalary", "Estimated fee"),
          { key: "probability", title: "Probability" },
          { key: "rating", title: "Capacity scale" },
          m("amount", "Weighted contribution"),
        ]}
        onOpen={(r) => onNavigate("applications", r.id)}
      />
      <RecordList
        kind="placements"
        rows={state.data.placements.filter(
          (p) => p.billable && billing(state, p) !== "Invoiced",
        )}
        onNavigate={onNavigate}
      />
    </>
  );
}
export function Collections({
  onNavigate,
  filter,
}: {
  onNavigate: Nav;
  filter?: string;
}) {
  const { state } = useStore();
  const [cycle, setCycle] = useState(""),
    [bucket, setBucket] = useState(""),
    [period, setPeriod] = useState("All due"),
    [client, setClient] = useState(filter || "");
  const invoices = state.data.invoices.filter(
    (i) =>
      i.status === "Issued" &&
      invoiceNumbers(state, i).outstanding > 0 &&
      (!cycle || i.terms?.days === Number(cycle)) &&
      (!client || i.clientId === client) &&
      (!bucket || invoiceNumbers(state, i).bucket === bucket) &&
      (period === "All due" || period === "Overdue"
        ? period !== "Overdue" || i.due! < state.settings.asOf
        : period === "Due this week"
          ? daysBetween(state.settings.asOf, i.due!) >= 0 &&
            daysBetween(state.settings.asOf, i.due!) <= 7
          : i.due?.slice(0, 7) === state.settings.asOf.slice(0, 7)),
  );
  const t = totals(state);
  return (
    <>
      <div className="metric-grid three">
        <Metric
          title="Outstanding"
          value={money(t.outstanding)}
          onClick={() => setBucket("")}
        />
        <Metric
          title="Overdue"
          value={money(t.overdue)}
          onClick={() => setPeriod("Overdue")}
        />
        <Metric
          title="Disputed balance"
          value={money(t.disputed)}
          onClick={() => onNavigate("invoices")}
        />
      </div>
      <div className="filter-strip">
        <select
          aria-label="Payment cycle"
          value={cycle}
          onChange={(e) => setCycle(e.target.value)}
        >
          <option value="">All payment cycles</option>
          {[30, 45, 60, 90].map((n) => (
            <option key={n} value={n}>
              {n} days
            </option>
          ))}
        </select>
        <select
          aria-label="Ageing bucket"
          value={bucket}
          onChange={(e) => setBucket(e.target.value)}
        >
          <option value="">All ageing buckets</option>
          {["Current", "1–30", "31–60", "61–90", "Over 90"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Due view"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {["All due", "Overdue", "Due this week", "Due this month"].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
        <select
          aria-label="Client"
          value={client}
          onChange={(e) => setClient(e.target.value)}
        >
          <option value="">All clients</option>
          {state.data.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <Table
        rows={invoices}
        title="due invoices"
        columns={[
          ...columns(state, "invoices"),
          {
            key: "age",
            title: "Days overdue",
            render: (r) => invoiceNumbers(state, r).overdue,
          },
          {
            key: "bucket",
            title: "Ageing",
            render: (r) => invoiceNumbers(state, r).bucket,
          },
          {
            key: "promise",
            title: "Promise",
            render: (r) => (
              <span
                className={
                  r.promise && r.promise < state.settings.asOf ? "danger" : ""
                }
              >
                {date(r.promise)}
              </span>
            ),
          },
          {
            key: "forecast",
            title: "Forecast date",
            render: (r) => date(collectionDate(state, r)),
          },
        ]}
        onOpen={(r) => onNavigate("invoices", r.id)}
      />
    </>
  );
}
export function CashFlow({ onNavigate }: { onNavigate: Nav }) {
  const { state } = useStore();
  const t = totals(state);
  const [outlook, setOutlook] = useState(90);
  const issued = state.data.invoices.filter(
    (i) => i.status === "Issued" && invoiceNumbers(state, i).outstanding > 0,
  );
  const unscheduled = sum(
    issued
      .filter((i) => !collectionDate(state, i))
      .map((i) => invoiceNumbers(state, i).outstanding),
  );
  const expected = sum(
    issued
      .filter((i) => {
        const d = collectionDate(state, i);
        return (
          d &&
          daysBetween(state.settings.asOf, d) >= 0 &&
          daysBetween(state.settings.asOf, d) <= outlook
        );
      })
      .map((i) => invoiceNumbers(state, i).outstanding * (i.probability ?? 1)),
  );
  const actualOut = sum(
    state.data.cash
      .filter((c) => c.status === "Actual" && c.date <= state.settings.asOf)
      .map((c) => c.amount || 0),
  );
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(state.settings.asOf + "T00:00Z");
    d.setUTCMonth(d.getUTCMonth() + i - 2);
    const month = d.toISOString().slice(0, 7);
    return {
      month,
      Receipts:
        sum(
          state.data.receipts
            .filter((r) => r.date.startsWith(month))
            .map((r) => r.amount || 0),
        ) -
        sum(
          state.data.receipts
            .filter((r) => r.reversed?.startsWith(month))
            .map((r) => r.amount || 0),
        ) -
        sum(
          state.data.refunds
            .filter((r) => r.date.startsWith(month))
            .map((r) => r.amount || 0),
        ),
      Forecast: sum(
        issued
          .filter((inv) => collectionDate(state, inv)?.startsWith(month))
          .map(
            (inv) =>
              invoiceNumbers(state, inv).outstanding * (inv.probability ?? 1),
          ),
      ),
      Outflows: sum(
        state.data.cash
          .filter((c) => c.date.startsWith(month))
          .map((c) => c.amount || 0),
      ),
    };
  });
  return (
    <>
      <div className="metric-grid">
        <Metric
          title="Gross receipts"
          value={money(t.gross)}
          onClick={() => onNavigate("payments")}
        />
        <Metric
          title="Reversals / refunds"
          value={money(t.reversals + t.refunds)}
          onClick={() => onNavigate("payments")}
        />
        <Metric
          title="Actual net collections"
          value={money(t.cash)}
          onClick={() => onNavigate("payments")}
        />
        <Metric
          title="Actual cash balance"
          value={money(state.settings.openingCash + t.cash - actualOut)}
          caption={
            "Opening cash " +
            money(state.settings.openingCash) +
            "; manual actual outflows deducted"
          }
          onClick={() => onNavigate("cash")}
        />
        <Metric
          title={outlook + "-day expected receipts"}
          value={money(expected)}
          caption="Issued balances × collection probability"
          onClick={() => onNavigate("collections")}
        />
        <Metric
          title="Unscheduled overdue"
          value={money(unscheduled)}
          onClick={() => onNavigate("collections")}
        />
      </div>
      <div className="filter-strip">
        <label>
          Outlook
          <select
            value={outlook}
            onChange={(e) => setOutlook(Number(e.target.value))}
          >
            {[30, 60, 90].map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </select>
        </label>
        <span>
          Projected closing cash:{" "}
          {money(
            state.settings.openingCash +
              t.cash -
              actualOut +
              expected -
              sum(
                state.data.cash
                  .filter(
                    (c) =>
                      c.status === "Forecast" &&
                      daysBetween(state.settings.asOf, c.date) >= 0 &&
                      daysBetween(state.settings.asOf, c.date) <= outlook,
                  )
                  .map((c) => c.amount || 0),
              ),
          )}
        </span>
      </div>
      <Chart
        title="Monthly management cash movements · INR"
        data={monthly}
        x="month"
        bars={["Receipts", "Forecast", "Outflows"]}
      />
      <div className="panel">
        <h3>Lower-confidence uninvoiced collections</h3>
        <p>
          Planned issue dates and snapshotted terms determine these dates. These
          values are separate from issued receivables.
        </p>
        <Table
          title="uninvoiced forecast"
          rows={state.data.placements
            .filter((p) => billing(state, p) !== "Invoiced" && p.billable)
            .map((p) => ({
              ...p,
              expected:
                p.plannedIssue && p.terms?.trigger === "Invoice date"
                  ? new Date(
                      Date.parse(p.plannedIssue + "T00:00Z") +
                        p.terms.days * 86400000,
                    )
                      .toISOString()
                      .slice(0, 10)
                  : p.terms?.trigger === "Joining date"
                    ? p.actual &&
                      new Date(
                        Date.parse(p.actual + "T00:00Z") +
                          p.terms.days * 86400000,
                      )
                        .toISOString()
                        .slice(0, 10)
                    : undefined,
            }))}
          columns={[
            { key: "name", title: "Placement" },
            {
              key: "plannedIssue",
              title: "Planned issue",
              render: (r) => date(r.plannedIssue),
            },
            { key: "expected", title: "Indicative collection date" },
            { key: "amount", title: "Fee" },
          ]}
          onOpen={(r) => onNavigate("placements", r.id)}
        />
      </div>
      <Chart
        title="Client receipt concentration · gross INR"
        data={state.data.clients.map((c) => ({
          name: c.name.split(" ")[0],
          Receipts: sum(
            state.data.receipts
              .filter(
                (r) => r.clientId === c.id && r.date <= state.settings.asOf,
              )
              .map((r) => r.amount || 0),
          ),
        }))}
        x="name"
        bars={["Receipts"]}
        onNavigate={() => onNavigate("payments")}
      />
      <RecordList kind="cash" onNavigate={onNavigate} />
    </>
  );
}
export function Performance({ onNavigate }: { onNavigate: Nav }) {
  const { state } = useStore();
  const report = recruiterReport(state);
  return (
    <>
      <Chart
        title="Recruiter fee attribution · INR"
        data={report.map((r) => ({
          name: r.name.split(" ")[0],
          "Net fees": r.amount || 0,
          "Fee collections": r.salary || 0,
        }))}
        x="name"
        bars={["Net fees", "Fee collections"]}
      />
      <Table
        rows={report}
        columns={recruiterCols}
        title="recruiter comparison"
        onOpen={(r) => onNavigate("users", r.id)}
      />
      <div className="panel">
        <h3>Targets and achievement</h3>
        <RecordActions kind="targets" onNavigate={onNavigate} />
        <Table
          rows={state.data.targets}
          title="targets"
          columns={[
            { key: "name", title: "Target" },
            refColumn(state, "userId", "Recruiter", "users"),
            { key: "date", title: "Period start" },
            { key: "due", title: "Period end" },
            {
              key: "amount",
              title: "Target",
              render: (r) =>
                r.targetType === "Net fees" ? money(r.amount || 0) : r.amount,
            },
            {
              key: "actual",
              title: "Actual",
              render: (r) => targetActual(state, r),
            },
            {
              key: "achievement",
              title: "Achievement",
              render: (r) =>
                r.amount
                  ? ((targetActual(state, r) / r.amount) * 100).toFixed(1) + "%"
                  : "Not Set",
            },
          ]}
          onOpen={(r) => onNavigate("targets", r.id)}
        />
        <p className="muted">
          Targets use the displayed date cohort. Free replacements are separate
          activity. Historical fees follow stored shares.
        </p>
      </div>
      <div className="panel">
        <h3>
          Application cohort conversion · all created to{" "}
          {date(state.settings.asOf)}
        </h3>
        {state.data.users
          .filter((u) => u.role === "Recruiter")
          .map((u) => {
            const a = state.data.applications.filter(
              (a) => a.userId === u.id && a.date <= state.settings.asOf,
            );
            const reached = (stage: string) =>
              a.filter(
                (x) =>
                  x.stage === stage ||
                  x.history?.some((h) => h.action.includes(stage)),
              ).length;
            const denominator = reached("Screening");
            const originals = state.data.placements.filter(
              (p) => !p.originalId && p.userId === u.id,
            );
            return (
              <p key={u.id}>
                {u.name}: screening → selection{" "}
                {denominator
                  ? ((reached("Selected") / denominator) * 100).toFixed(1) + "%"
                  : "Not Available"}{" "}
                · Mean time to fill{" "}
                {originals.length
                  ? Math.round(
                      sum(
                        originals.map((p) =>
                          daysBetween(
                            find(state, "jobs", p.jobId)!.date,
                            p.actual!,
                          ),
                        ),
                      ) / originals.length,
                    ) + " days"
                  : "Not Available"}
              </p>
            );
          })}
      </div>
    </>
  );
}
function targetActual(s: State, t: RecordData) {
  const within = (d: string) => d >= t.date && d <= (t.due || s.settings.asOf);
  const apps = s.data.applications.filter((a) => a.userId === t.userId);
  if (t.targetType === "Interviews")
    return s.data.interviews.filter(
      (i) =>
        i.status === "Completed" &&
        within(i.date) &&
        apps.some((a) => a.id === i.applicationId),
    ).length;
  if (t.targetType === "Placements")
    return s.data.placements.filter(
      (p) =>
        !p.originalId &&
        p.billable &&
        within(p.actual!) &&
        p.shares?.some((sh) => sh.userId === t.userId),
    ).length;
  if (t.targetType === "Submissions")
    return apps.filter(
      (a) =>
        a.history?.some(
          (h) => h.action.includes("Submitted to Client") && within(h.date),
        ) ||
        (a.actual && within(a.actual)),
    ).length;
  return periodFees(s, t.date, t.due || s.settings.asOf, t.userId!);
}
export function Reports({
  onNavigate,
  filter,
}: {
  onNavigate: Nav;
  filter?: string;
}) {
  const { state } = useStore();
  const [report, setReport] = useState("Client revenue"),
    [client, setClient] = useState(filter || ""),
    [recruiter, setRecruiter] = useState(""),
    [team, setTeam] = useState(""),
    [start, setStart] = useState("2026-01-01"),
    [end, setEnd] = useState(state.settings.asOf),
    [status, setStatus] = useState(""),
    [job, setJob] = useState("");
  const catalog: Record<string, Kind | undefined> = {
    "Client revenue": undefined,
    "Recruiter performance": undefined,
    "Open jobs & vacancy ageing": "jobs",
    "Pipeline funnel": "applications",
    "Interview outcomes": "interviews",
    "Offer acceptance": "offers",
    "Joining outcomes": "joinings",
    "Replacement register": "replacements",
    "Invoice register": "invoices",
    "Receipt register": "receipts",
    "Receivable ageing": "invoices",
    "Revenue forecast": "applications",
  };
  const s = scope(state, client, recruiter, team);
  const kind = catalog[report];
  const basis =
    report === "Receipt register"
      ? "Receipt transaction date"
      : report.includes("Invoice") ||
          report === "Client revenue" ||
          report === "Recruiter performance" ||
          report === "Receivable ageing"
        ? "Invoice / credit issue date"
        : report === "Joining outcomes"
          ? "Expected / actual joining date"
          : "Record creation / event date";
  let rows: RecordData[], cols: Column[];
  if (!kind) {
    rows =
      report === "Client revenue"
        ? clientReport(s, start, end)
        : recruiterReport(s, start, end);
    cols = report === "Client revenue" ? clientCols : recruiterCols;
  } else {
    rows =
      report === "Revenue forecast"
        ? forecast(s).map((a) => ({ ...a, amount: a.weighted }))
        : s.data[kind];
    rows = rows.filter((r) => {
      const d =
        report === "Joining outcomes"
          ? r.actual || r.expected || r.date
          : r.date;
      return (
        d >= start &&
        d <= end &&
        (!status || (r.stage || r.status) === status) &&
        (!job ||
          r.jobId === job ||
          (kind === "jobs" && r.id === job) ||
          (kind === "invoices" &&
            r.lines?.some(
              (l) => find(s, "placements", l.placementId)?.jobId === job,
            )) ||
          (r.applicationId &&
            find(s, "applications", r.applicationId)?.jobId === job))
      );
    });
    if (report === "Open jobs & vacancy ageing")
      rows = rows.filter((j) => j.status === "Open");
    cols = columns(s, kind);
    if (report === "Receivable ageing")
      cols = [
        ...cols,
        {
          key: "bucket",
          title: "Ageing",
          render: (r) => invoiceNumbers(s, r).bucket,
        },
      ];
    if (report === "Revenue forecast")
      cols = [...cols, m("amount", "Weighted fee")];
  }
  const amountTotal = sum(
    rows.map((r) =>
      kind === "invoices"
        ? invoiceNumbers(s, r).net - invoiceNumbers(s, r).creditFee
        : r.amount || 0,
    ),
  );
  return (
    <>
      <div className="report-catalog">
        {Object.keys(catalog).map((n) => (
          <button
            key={n}
            className={report === n ? "selected" : ""}
            onClick={() => setReport(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <FilterStrip
        state={state}
        client={client}
        recruiter={recruiter}
        team={team}
        setClient={setClient}
        setRecruiter={setRecruiter}
        setTeam={setTeam}
      />
      <div className="filter-strip">
        <label>
          From
          <input
            type="date"
            value={start}
            onInput={(e) => setStart(e.currentTarget.value)}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={end}
            onInput={(e) => setEnd(e.currentTarget.value)}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        {kind && (
          <label>
            Job
            <select value={job} onChange={(e) => setJob(e.target.value)}>
              <option value="">All jobs</option>
              {state.data.jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name} · {j.id}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind && (
          <label>
            Status
            <input
              placeholder="All statuses"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </label>
        )}
      </div>
      <div className="panel">
        <h2>{report}</h2>
        <p>
          Client: {label(state, "clients", client) || "All"} · Recruiter:{" "}
          {label(state, "users", recruiter) || "All"} · Team:{" "}
          {label(state, "teams", team) || "All"}
          {kind &&
            ` · Job: ${label(state, "jobs", job)} · Status: ${status || "All"}`}
        </p>
        <p>
          Date basis: {basis} · {date(start)} – {date(end)} · Generated{" "}
          {date(state.settings.asOf)}
        </p>
        <p>
          {rows.length} rows ·{" "}
          {kind === "invoices" || !kind
            ? "Net fees"
            : kind === "receipts"
              ? "Gross receipt amount"
              : "Record amounts"}{" "}
          total {money(amountTotal)}. Outstanding remains point-in-time as of{" "}
          {date(state.settings.asOf)}.
        </p>
        {report === "Offer acceptance" && (
          <p>
            Final response cohort:{" "}
            {rows.filter((o) => ["Accepted", "Declined"].includes(o.status))
              .length
              ? (
                  (rows.filter((o) => o.status === "Accepted").length /
                    rows.filter((o) =>
                      ["Accepted", "Declined"].includes(o.status),
                    ).length) *
                  100
                ).toFixed(1) + "%"
              : "Not Available"}
          </p>
        )}
        <Table
          rows={rows}
          columns={cols}
          title={report}
          context={`Client=${client || "All"}; recruiter=${recruiter || "All"}; team=${team || "All"}; job=${job || "All"}; dateBasis=${basis}; from=${start}; to=${end}`}
          onOpen={(r) =>
            onNavigate(
              kind || (report === "Client revenue" ? "clients" : "users"),
              r.id,
            )
          }
        />
      </div>
    </>
  );
}
