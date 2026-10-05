import { useState } from "react";
import { Columns3, List, CalendarDays } from "lucide-react";
import { useStore } from "./store";
import { type RecordData, stages, find, date, daysBetween } from "./model";
import { Table, Badge, Modal, Form, refColumn } from "./components";
import { columns, RecordList } from "./Records";
import RecordActions from "./RecordActions";
import { label } from "./schema";
import * as A from "./actions";
type Nav = (k: string, id?: string) => void;
export function Pipeline({
  onNavigate,
  filter,
}: {
  onNavigate: Nav;
  filter?: string;
}) {
  const { state, run } = useStore();
  const [view, setView] = useState("Board"),
    [job, setJob] = useState(""),
    [user, setUser] = useState(""),
    [client, setClient] = useState(filter || ""),
    [stageFilter, setStageFilter] = useState(""),
    [source, setSource] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [bulk, setBulk] = useState(false),
    [move, setMove] = useState<{ id: string; next: string }>(),
    [summary, setSummary] = useState<
      { id: string; ok: boolean; message: string }[]
    >([]);
  const [bulkCommit, setBulkCommit] = useState<
    ((s: typeof state) => void) | null
  >(null);
  const rows = state.data.applications.filter(
    (a) =>
      (!job || a.jobId === job) &&
      (!user || a.userId === user) &&
      (!client || find(state, "jobs", a.jobId)?.clientId === client) &&
      (!stageFilter || a.stage === stageFilter) &&
      (!source ||
        find(state, "candidates", a.candidateId)?.source === source) &&
      (!from || a.date >= from) &&
      (!to || a.date <= to),
  );
  return (
    <>
      <div className="section-heading">
        <div>
          <h1>Candidate pipeline</h1>
          <p className="muted">
            Each card is an application. Profiles are shared across jobs.
          </p>
        </div>
        <RecordActions kind="applications" onNavigate={onNavigate} />
      </div>
      <div className="filter-strip">
        <div className="segmented">
          <button
            className={view === "Board" ? "active" : ""}
            onClick={() => setView("Board")}
          >
            <Columns3 size={16} />
            Board
          </button>
          <button
            className={view === "Table" ? "active" : ""}
            onClick={() => setView("Table")}
          >
            <List size={16} />
            Table
          </button>
        </div>
        {(
          [
            ["Client", "clients", client, setClient],
            ["Job", "jobs", job, setJob],
            ["Recruiter", "users", user, setUser],
          ] as const
        ).map(([name, k, v, set]) => (
          <select
            aria-label={name}
            key={k}
            value={v}
            onChange={(e) => set(e.target.value)}
          >
            <option value="">All {name.toLowerCase()}s</option>
            {state.data[k].map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.id}
              </option>
            ))}
          </select>
        ))}
        <select
          aria-label="Pipeline stage"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="">All stages</option>
          {stages.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">All sources</option>
          {["Referral", "Direct", "CSV", "Job board", "Other"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label>
          Created from
          <input
            type="date"
            value={from}
            onInput={(e) => setFrom(e.currentTarget.value)}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            onInput={(e) => setTo(e.currentTarget.value)}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button disabled={!selected.length} onClick={() => setBulk(true)}>
          Bulk action ({selected.length})
        </button>
      </div>
      {view === "Table" ? (
        <Table
          rows={rows}
          title="applications"
          columns={columns(state, "applications")}
          onOpen={(r) => onNavigate("applications", r.id)}
          selected={selected}
          onSelect={setSelected}
        />
      ) : (
        <div className="kanban">
          {stages.map((st) => (
            <section
              className="kanban-column"
              key={st}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setMove({ id: e.dataTransfer.getData("text/plain"), next: st });
              }}
            >
              <header>
                <span>{st}</span>
                <Badge>{rows.filter((a) => a.stage === st).length}</Badge>
              </header>
              {rows
                .filter((a) => a.stage === st)
                .map((a) => (
                  <article
                    key={a.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", a.id)
                    }
                  >
                    <div className="card-top">
                      <input
                        type="checkbox"
                        aria-label={"Select " + a.name}
                        checked={selected.includes(a.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, a.id]
                              : selected.filter((id) => id !== a.id),
                          )
                        }
                      />
                      <small>{a.id}</small>
                    </div>
                    <button
                      className="card-title"
                      onClick={() => onNavigate("applications", a.id)}
                    >
                      {label(state, "candidates", a.candidateId)}
                    </button>
                    <p>{label(state, "jobs", a.jobId)}</p>
                    <span className="muted">
                      {label(state, "users", a.userId)}
                    </span>
                    <div className="card-bottom">
                      <span
                        className={
                          a.followUp && a.followUp < state.settings.asOf
                            ? "danger"
                            : ""
                        }
                      >
                        Follow-up {date(a.followUp)}
                      </span>
                      <small>
                        {daysBetween(
                          a.history?.at(-1)?.date || a.date,
                          state.settings.asOf,
                        )}{" "}
                        days
                      </small>
                    </div>
                    <select
                      aria-label={"Change stage for " + a.name}
                      value={a.stage}
                      onChange={(e) =>
                        setMove({ id: a.id, next: e.target.value })
                      }
                    >
                      {stages.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </article>
                ))}
            </section>
          ))}
        </div>
      )}
      {move && (
        <Form
          state={state}
          title={"Move application to " + move.next}
          initial={{
            id: move.id,
            name: "Stage change",
            status: "Active",
            date: state.settings.asOf,
          }}
          fields={[
            {
              key: "reason",
              label: "Reason / fast-track explanation",
              type: "textarea",
            },
            {
              key: "restart",
              label: "Admin fast-track exception",
              type: "checkbox",
            },
          ]}
          onSave={(v) => {
            if (move.next === "Joined") {
              const joining = state.data.joinings.find(
                (j) => j.applicationId === move.id,
              );
              if (!joining)
                throw Error(
                  "Accept an offer first to create a joining tracker.",
                );
              onNavigate("joinings", joining.id + "?confirm=joining");
              return;
            }
            run((s) =>
              A.stage(s, move.id, move.next, v.reason || "", v.restart),
            );
          }}
          onClose={() => setMove(undefined)}
        />
      )}{" "}
      {bulk && (
        <Form
          state={state}
          title="Review bulk action eligibility"
          initial={{
            id: "bulk",
            name: "Bulk",
            status: "Active",
            date: state.settings.asOf,
            stage: "Screening",
          }}
          fields={[
            {
              key: "stage",
              label: "Stage (leave recruiter empty to use)",
              options: stages,
            },
            { key: "userId", label: "Assign recruiter instead", ref: "users" },
            { key: "reason", label: "Reason", type: "textarea" },
          ]}
          onSave={(v) => {
            const trial = structuredClone(state);
            const results = A.bulk(
              trial,
              selected,
              v.stage!,
              v.userId || "",
              v.reason || "",
            );
            setSummary(results);
            setBulkCommit(() => (s: typeof state) => {
              A.bulk(
                s,
                results.filter((r) => r.ok).map((r) => r.id),
                v.stage!,
                v.userId || "",
                v.reason || "",
              );
            });
            setBulk(false);
          }}
          onClose={() => setBulk(false)}
        />
      )}{" "}
      {!!summary.length && (
        <Modal title="Bulk validation summary" onClose={() => setSummary([])}>
          {summary.map((r) => (
            <p key={r.id}>
              {r.id} · {r.ok ? "Eligible" : r.message}
            </p>
          ))}
          <p>
            Eligible records will be committed together. Invalid records stay
            unchanged.
          </p>
          <button
            className="primary"
            onClick={() => {
              if (bulkCommit) run(bulkCommit);
              setSummary([]);
              setBulkCommit(null);
            }}
          >
            Confirm eligible records
          </button>
        </Modal>
      )}
    </>
  );
}
export function Interviews({ onNavigate }: { onNavigate: Nav }) {
  const { state } = useStore();
  const [calendar, setCalendar] = useState(false),
    [month, setMonth] = useState(state.settings.asOf.slice(0, 7));
  const start = month + "-01";
  const first = new Date(start + "T00:00Z");
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(
    first.getUTCFullYear(),
    first.getUTCMonth() + 1,
    0,
  ).getDate();
  return (
    <>
      <div className="section-heading">
        <h1>Interviews</h1>
        <div className="actions">
          <button onClick={() => setCalendar(!calendar)}>
            <CalendarDays size={16} />
            {calendar ? "List view" : "Calendar view"}
          </button>
          <RecordActions kind="interviews" onNavigate={onNavigate} />
        </div>
      </div>
      {calendar ? (
        <div className="panel">
          <label>
            Calendar month
            <input
              type="month"
              value={month}
              onInput={(e) => setMonth(e.currentTarget.value)}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <div className="calendar">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <strong key={d}>{d}</strong>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={"blank" + i} />
            ))}
            {Array.from({ length: count }, (_, i) => {
              const d = month + "-" + String(i + 1).padStart(2, "0");
              return (
                <div
                  className={
                    "calendar-day " + (d === state.settings.asOf ? "today" : "")
                  }
                  key={d}
                >
                  <strong>{i + 1}</strong>
                  {state.data.interviews
                    .filter((r) => r.date === d)
                    .map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onNavigate("interviews", r.id)}
                      >
                        {r.time} ·{" "}
                        {label(
                          state,
                          "candidates",
                          find(state, "applications", r.applicationId)
                            ?.candidateId,
                        )}
                        <Badge>{r.status}</Badge>
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <RecordList kind="interviews" onNavigate={onNavigate} />
      )}
    </>
  );
}
