import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  Printer,
} from "lucide-react";
import { type RecordData, type Kind, type State, date, money } from "./model";
import { type Field, get, label } from "./schema";
import { useStore } from "./store";
import { flushSync } from "react-dom";
import { buildCSV } from "./export";
export function Badge({ children }: { children: ReactNode }) {
  const t = String(children);
  return (
    <span
      className={
        "badge " +
        (/Paid|Accepted|Joined|Completed|Active|Fulfilled|Recorded|Confirmed/.test(
          t,
        )
          ? "green"
          : /Overdue|Rejected|Declined|Cancelled|No Show|Withdrawn|Inactive|Ended/.test(
                t,
              )
            ? "red"
            : /Draft|Hold|Expected|Pending|Review|Unpaid/.test(t)
              ? "amber"
              : "blue")
      }
    >
      {children}
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current
      ?.querySelector<HTMLElement>("input,select,textarea,button")
      ?.focus();
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll<HTMLElement>(
          "button,input,textarea,select,a[href]",
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
      >
        <header>
          <h2>{title}</h2>
          <button
            aria-label="Close dialogue"
            className="icon"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export function Form({
  state,
  title,
  initial,
  fields,
  onSave,
  onClose,
  children,
}: {
  state: State;
  title: string;
  initial: RecordData;
  fields: Field[];
  onSave: (r: RecordData) => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const [value, setValue] = useState(structuredClone(initial));
  const activeFields = fields.map((f) => {
    const category = (
      {
        industry: "Industries",
        source: "Sources",
        priority: "Priorities",
      } as Record<string, string>
    )[f.key];
    return category
      ? {
          ...f,
          options: state.settings.masters[category]
            .filter((m) => m.active || m.name === get(value, f.key))
            .map((m) => m.name),
        }
      : f;
  });
  const [error, setError] = useState("");
  function change(path: string, v: unknown) {
    setValue((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let o = next as unknown as Record<string, unknown>;
      while (keys.length > 1) {
        const key = keys.shift()!;
        o[key] ??= {};
        o = o[key] as Record<string, unknown>;
      }
      o[keys[0]] = v;
      return next;
    });
  }
  return (
    <Modal title={title} onClose={onClose} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onSave(value);
            onClose();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <div className="form-grid">
          {activeFields.map((f) => (
            <label key={f.key}>
              {f.label}
              {f.required ? " *" : ""}
              {f.ref || f.options ? (
                <select
                  aria-label={f.label}
                  required={f.required}
                  value={String(get(value, f.key) || "")}
                  onChange={(e) =>
                    change(
                      f.key,
                      f.key === "terms.days"
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                >
                  <option value="">Select…</option>
                  {f.ref
                    ? state.data[f.ref]
                        .filter((r) => !r.archived)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} · {r.id}
                          </option>
                        ))
                    : f.options?.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  aria-label={f.label}
                  value={String(get(value, f.key) || "")}
                  required={f.required}
                  onChange={(e) => change(f.key, e.target.value)}
                />
              ) : (
                <input
                  aria-label={f.label}
                  type={f.type || "text"}
                  step="any"
                  required={f.required}
                  checked={
                    f.type === "checkbox"
                      ? Boolean(get(value, f.key))
                      : undefined
                  }
                  value={
                    f.type === "checkbox"
                      ? undefined
                      : String(get(value, f.key) ?? "")
                  }
                  onInput={(e) => {
                    if (f.type === "date" || f.type === "time")
                      change(f.key, e.currentTarget.value);
                  }}
                  onChange={(e) =>
                    change(
                      f.key,
                      f.type === "number"
                        ? e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                        : f.type === "checkbox"
                          ? e.target.checked
                          : e.target.value,
                    )
                  }
                />
              )}
            </label>
          ))}
        </div>
        {children}
        {(title.includes("candidate") || title.includes("clients")) &&
          state.data[
            title.includes("candidate") ? "candidates" : "clients"
          ].some(
            (r) =>
              r.id !== value.id &&
              ((value.email &&
                r.email?.toLowerCase() === value.email.toLowerCase()) ||
                (value.phone &&
                  r.phone?.replace(/\W/g, "") ===
                    value.phone.replace(/\W/g, "")) ||
                (value.name.length > 3 &&
                  r.name.toLowerCase().includes(value.name.toLowerCase()))),
          ) && (
            <p className="notice">
              Possible duplicate name, email or telephone. Review the existing
              profile before creating another record. Candidate merge is
              available from the profile action menu.
            </p>
          )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">Save locally</button>
        </footer>
      </form>
    </Modal>
  );
}
export interface Column {
  key: string;
  title: string;
  render?: (r: RecordData) => ReactNode;
  exportValue?: (r: RecordData) => unknown;
}
export function csv(
  rows: RecordData[],
  columns: Column[],
  filename = "demo-export.csv",
  context = "",
) {
  const output = buildCSV(
    rows,
    columns.map((c) => ({
      title: c.title,
      value: (r: RecordData) => {
        if (c.exportValue) return c.exportValue(r);
        if (c.render) {
          const rendered = c.render(r);
          if (typeof rendered === "string" || typeof rendered === "number")
            return rendered;
        }
        return get(r, c.key);
      },
    })),
    context,
    !filename.includes("template"),
  );
  const blob = new Blob([output], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Table({
  rows,
  columns,
  onOpen,
  title = "records",
  extra,
  selected,
  onSelect,
  context = "",
}: {
  rows: RecordData[];
  columns: Column[];
  onOpen?: (r: RecordData) => void;
  title?: string;
  extra?: ReactNode;
  selected?: string[];
  onSelect?: (ids: string[]) => void;
  context?: string;
}) {
  const { state, run } = useStore();
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true)),
      after = () => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  const key = "filter-" + title;
  const [q, setQ] = useState(() => sessionStorageSafe(key));
  const [status, statusChange] = useState(() =>
    sessionStorageSafe(key + "-status"),
  );
  const setStatus = (v: string) => {
    statusChange(v);
    try {
      sessionStorage.setItem(key + "-status", v);
    } catch {}
  };
  const [sort, setSort] = useState({ key: "date", desc: true });
  const [page, setPage] = useState(0);
  const statuses = [...new Set(rows.map((r) => r.stage || r.status))].filter(
    Boolean,
  );
  const filtered = rows
    .filter(
      (r) =>
        (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) &&
        (!status || (r.stage || r.status) === status),
    )
    .sort((a, b) => {
      const x = get(a, sort.key),
        y = get(b, sort.key);
      return (
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x || "").localeCompare(String(y || ""))) *
        (sort.desc ? -1 : 1)
      );
    });
  const size = 10;
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  useEffect(() => setPage(0), [q, status]);
  return (
    <section className="table-panel">
      <div className="table-toolbar">
        <div className="search">
          <Search size={16} />
          <input
            aria-label={"Search " + title}
            placeholder={"Search " + title + "…"}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              try {
                sessionStorage.setItem(key, e.target.value);
              } catch {
                /* memory only */
              }
            }}
          />
        </div>
        <select
          aria-label="Filter status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {(q || status) && (
          <button
            onClick={() => {
              setQ("");
              setStatus("");
              try {
                sessionStorage.removeItem(key);
              } catch {}
            }}
          >
            Clear
          </button>
        )}
        <div className="toolbar-spacer" />
        {title === "candidates" && (
          <>
            <button
              disabled={!q}
              onClick={() =>
                run((s) => {
                  if (!s.settings.savedFilters.some((f) => f.query === q))
                    s.settings.savedFilters.push({ name: q, query: q });
                })
              }
            >
              Save search
            </button>
            <select
              aria-label="Saved candidate searches"
              value=""
              onChange={(e) => setQ(e.target.value)}
            >
              <option value="">Saved searches</option>
              {state.settings.savedFilters.map((f) => (
                <option key={f.query} value={f.query}>
                  {f.name}
                </option>
              ))}
            </select>
          </>
        )}
        {extra}
        <button
          onClick={() =>
            csv(
              filtered,
              columns,
              title + ".csv",
              `As of ${state.settings.asOf}; ${title}; search=${q}; status=${status}; route=${location.hash}; ${context}`,
            )
          }
        >
          <Download size={15} />
          Export CSV
        </button>
        <button onClick={() => window.print()}>
          <Printer size={15} />
          Print
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {onSelect && (
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select filtered rows"
                    checked={
                      filtered.length > 0 &&
                      filtered.every((r) => selected?.includes(r.id))
                    }
                    onChange={(e) =>
                      onSelect(
                        e.target.checked ? filtered.map((r) => r.id) : [],
                      )
                    }
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key}>
                  <button
                    onClick={() =>
                      setSort({
                        key: c.key,
                        desc: sort.key === c.key ? !sort.desc : false,
                      })
                    }
                  >
                    {c.title}
                    <ArrowUpDown size={12} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(printing
              ? filtered
              : filtered.slice(
                  Math.min(page, pages - 1) * size,
                  (Math.min(page, pages - 1) + 1) * size,
                )
            ).map((r) => (
              <tr key={r.id}>
                {onSelect && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={"Select " + r.name}
                      checked={selected?.includes(r.id) || false}
                      onChange={(e) =>
                        onSelect(
                          e.target.checked
                            ? [...(selected || []), r.id]
                            : (selected || []).filter((id) => id !== r.id),
                        )
                      }
                    />
                  </td>
                )}
                {columns.map((c, i) => (
                  <td key={c.key}>
                    {i === 0 && onOpen ? (
                      <button className="record-link" onClick={() => onOpen(r)}>
                        {c.render ? c.render(r) : String(get(r, c.key) || "—")}
                      </button>
                    ) : c.render ? (
                      c.render(r)
                    ) : c.key === "date" ||
                      c.key === "due" ||
                      c.key === "expected" ? (
                      date(String(get(r, c.key) || ""))
                    ) : c.key === "amount" ? (
                      money(Number(get(r, c.key)))
                    ) : (
                      String(get(r, c.key) ?? "—")
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="empty">
            No matching {title}. Clear the filters or add a record.
          </div>
        )}
      </div>
      <footer className="pagination">
        <span>
          {filtered.length} {title} · Page {Math.min(page, pages - 1) + 1} of{" "}
          {pages}
        </span>
        <button
          className="icon"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          className="icon"
          aria-label="Next page"
          disabled={page >= pages - 1}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </footer>
    </section>
  );
}
function sessionStorageSafe(key: string) {
  try {
    return sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}
export function refColumn(
  state: State,
  key: string,
  title: string,
  k: Kind,
): Column {
  return {
    key,
    title,
    render: (r) => label(state, k, get(r, key) as string),
    exportValue: (r) => label(state, k, get(r, key) as string),
  };
}
export function Timeline({
  state,
  kind,
  id,
}: {
  state: State;
  kind: Kind;
  id: string;
}) {
  const rows = state.data.activities.filter(
    (a) => a.linkedKind === kind && a.linkedId === id,
  );
  return (
    <div className="timeline">
      {rows.map((a) => (
        <article key={a.id}>
          <span className="timeline-dot" />
          <div>
            <strong>{a.name}</strong>
            <p>{a.notes || "Recorded locally by Super Admin"}</p>
            <small>
              {date(a.date)} · {label(state, "users", a.userId)}
            </small>
          </div>
        </article>
      ))}
      {!rows.length && (
        <p className="muted">No activity yet. Material changes appear here.</p>
      )}
    </div>
  );
}
