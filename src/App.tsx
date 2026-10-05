import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  BriefcaseBusiness,
  UsersRound,
  Columns3,
  CalendarDays,
  FileCheck2,
  Flag,
  RefreshCw,
  ChartNoAxesCombined,
  FileText,
  Wallet,
  AlarmClock,
  TrendingUp,
  ArrowLeftRight,
  ClipboardList,
  ListTodo,
  ShieldCheck,
  Settings2,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  ChevronDown,
  Plus,
  Command,
  Check,
  Compass,
} from "lucide-react";
import { useStore } from "./store";
import { type Kind, type State, date, find } from "./model";
import { modules } from "./schema";
import { Modal, Badge, Timeline } from "./components";
import { RecordList, Detail, destination } from "./Records";
import {
  Dashboard,
  Forecast,
  Collections,
  CashFlow,
  Performance,
  Reports,
  notifications,
} from "./Analytics";
import { Pipeline, Interviews } from "./WorkflowViews";
import { Settings, Users, Scenarios } from "./Settings";
import RecordActions from "./RecordActions";
import { Clients, Candidates } from "./TalentViews";
const icons = [
  LayoutDashboard,
  Building2,
  BriefcaseBusiness,
  UsersRound,
  Columns3,
  CalendarDays,
  FileCheck2,
  Flag,
  RefreshCw,
  ChartNoAxesCombined,
  FileText,
  Wallet,
  AlarmClock,
  TrendingUp,
  ArrowLeftRight,
  ClipboardList,
  ListTodo,
  ShieldCheck,
  Settings2,
];
function readRoute() {
  const raw = location.hash.slice(1) || "/dashboard";
  const [path, query] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  return {
    module: parts[0] || "dashboard",
    id: parts[1],
    kind: parts[2],
    filter: new URLSearchParams(query).get("client") || undefined,
  };
}
export default function App() {
  const { state, error, run } = useStore();
  const [route, setRoute] = useState(readRoute),
    [collapsed, setCollapsed] = useState(false),
    [search, setSearch] = useState(""),
    [alerts, setAlerts] = useState(false),
    [quick, setQuick] = useState(false),
    [guide, setGuide] = useState(false);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document
          .querySelector<HTMLInputElement>(
            '[aria-label="Global record search"]',
          )
          ?.focus();
      }
    };
    document.addEventListener("keydown", shortcut);
    const fn = () => {
      setRoute(readRoute());
      setSearch("");
    };
    window.addEventListener("hashchange", fn);
    return () => {
      window.removeEventListener("hashchange", fn);
      document.removeEventListener("keydown", shortcut);
    };
  }, []);
  function navigate(k: string, id?: string, filter?: string) {
    const dest = destination(k);
    location.hash =
      "/" +
      dest +
      (id ? "/" + id + (dest !== k ? "/" + k : "") : "") +
      (filter ? "?client=" + encodeURIComponent(filter) : "");
  }
  const kind = (route.kind ||
    { pipeline: "applications", payments: "receipts" }[route.module] ||
    route.module) as Kind;
  const title = modules.find(([k]) => k === route.module)?.[1] || route.module;
  const alertsList = notifications(state);
  const results =
    search.length > 1
      ? (
          [
            "clients",
            "jobs",
            "candidates",
            "applications",
            "invoices",
            "receipts",
            "placements",
            "users",
          ] as Kind[]
        ).flatMap((k) =>
          state.data[k]
            .filter((r) =>
              JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
            )
            .slice(0, 4)
            .map((r) => ({ k, r })),
        )
      : [];
  let content: React.ReactNode;
  if (route.id)
    content = (
      <Detail
        key={kind + route.id}
        kind={kind}
        id={route.id}
        onNavigate={navigate}
      />
    );
  else
    switch (route.module) {
      case "clients":
        content = <Clients onNavigate={navigate} filter={route.filter} />;
        break;
      case "candidates":
        content = <Candidates onNavigate={navigate} />;
        break;
      case "dashboard":
        content = <Dashboard onNavigate={navigate} />;
        break;
      case "pipeline":
        content = <Pipeline onNavigate={navigate} filter={route.filter} />;
        break;
      case "interviews":
        content = <Interviews onNavigate={navigate} />;
        break;
      case "collections":
        content = <Collections onNavigate={navigate} filter={route.filter} />;
        break;
      case "forecast":
        content = <Forecast onNavigate={navigate} />;
        break;
      case "cashflow":
        content = <CashFlow onNavigate={navigate} />;
        break;
      case "performance":
        content = <Performance onNavigate={navigate} />;
        break;
      case "reports":
        content = <Reports onNavigate={navigate} filter={route.filter} />;
        break;
      case "users":
        content = <Users onNavigate={navigate} />;
        break;
      case "settings":
        content = <Settings onNavigate={navigate} />;
        break;
      case "joinings":
        content = (
          <>
            <RecordList
              kind="joinings"
              rows={
                route.filter
                  ? state.data.joinings.filter(
                      (j) =>
                        find(
                          state,
                          "jobs",
                          find(state, "applications", j.applicationId)?.jobId,
                        )?.clientId === route.filter,
                    )
                  : undefined
              }
              onNavigate={navigate}
            />
            <RecordList
              kind="placements"
              rows={
                route.filter
                  ? state.data.placements.filter(
                      (p) => p.clientId === route.filter,
                    )
                  : undefined
              }
              onNavigate={navigate}
            />
          </>
        );
        break;
      case "payments":
        content = (
          <>
            <RecordList
              kind="receipts"
              rows={
                route.filter
                  ? state.data.receipts.filter(
                      (r) => r.clientId === route.filter,
                    )
                  : undefined
              }
              onNavigate={navigate}
            />
            <RecordList kind="refunds" onNavigate={navigate} />
          </>
        );
        break;
      case "invoices":
        content = (
          <>
            <RecordList
              kind="invoices"
              rows={
                route.filter
                  ? state.data.invoices.filter(
                      (i) => i.clientId === route.filter,
                    )
                  : undefined
              }
              clientFilter={route.filter}
              onNavigate={navigate}
            />
            <RecordList kind="credits" onNavigate={navigate} />
          </>
        );
        break;
      case "tasks":
        content = (
          <>
            <RecordList kind="tasks" onNavigate={navigate} />
            <RecordList kind="activities" onNavigate={navigate} />
          </>
        );
        break;
      default:
        content = state.data[kind] ? (
          <RecordList
            kind={kind}
            rows={
              route.filter
                ? state.data[kind].filter(
                    (r) =>
                      r.clientId === route.filter ||
                      r.id === route.filter ||
                      find(
                        state,
                        "jobs",
                        r.jobId ||
                          find(state, "applications", r.applicationId)?.jobId,
                      )?.clientId === route.filter,
                  )
                : undefined
            }
            onNavigate={navigate}
          />
        ) : (
          <div className="empty">
            Unknown destination.{" "}
            <button onClick={() => navigate("dashboard")}>Open overview</button>
          </div>
        );
    }
  return (
    <div className={"workspace " + (collapsed ? "collapsed" : "")}>
      <aside className="sidebar">
        <a href="#/dashboard" className="brand">
          <span className="brand-mark">
            n<span>✦</span>
          </span>
          {!collapsed && (
            <span>
              northstar<small>RECRUITMENT WORKSPACE</small>
            </span>
          )}
        </a>
        <div className="workspace-selector">
          {!collapsed && (
            <>
              <span className="mini-avatar">N</span>
              <span>
                Talent Partners<small>Super Admin workspace</small>
              </span>
              <ChevronDown size={14} />
            </>
          )}
        </div>
        <p className="nav-label">{collapsed ? "•••" : "WORKSPACE"}</p>
        <nav>
          {modules.map(([k, n], i) => {
            const Icon = icons[i];
            return (
              <a
                key={k}
                href={"#/" + k}
                className={route.module === k ? "active" : ""}
                title={n}
              >
                <Icon size={18} />
                {!collapsed && <span>{n}</span>}
                {k === "tasks" && !collapsed && (
                  <small>
                    {
                      state.data.tasks.filter((t) => t.status === "Pending")
                        .length
                    }
                  </small>
                )}
              </a>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button
            aria-label="Demonstration guide"
            onClick={() => setGuide(true)}
          >
            <Compass size={18} />
            {!collapsed && <span>Demonstration guide</span>}
          </button>
          <div className="demo-indicator">
            <span />
            {!collapsed && "DEMO · LOCAL DATA"}
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>
          <div className="breadcrumbs">
            <a href="#/dashboard">Workspace</a>
            <span>/</span>
            <span>{title}</span>
            {route.id && (
              <>
                <span>/</span>
                <strong>{find(state, kind, route.id)?.name || route.id}</strong>
              </>
            )}
          </div>
          <div className="global-search">
            <Search size={17} />
            <input
              aria-label="Global record search"
              placeholder="Search the workspace…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span>
              <Command size={12} /> K
            </span>
            {search.length > 1 && (
              <div className="search-results">
                {results.map(({ k, r }) => (
                  <button key={k + r.id} onClick={() => navigate(k, r.id)}>
                    <span>{r.name}</span>
                    <small>
                      {k} · {r.id}
                    </small>
                  </button>
                ))}
                {!results.length && <p>No matching records.</p>}
              </div>
            )}
          </div>
          <button
            aria-label="Quick create"
            className="quick-button"
            onClick={() => setQuick(true)}
          >
            <Plus size={17} />
            <span>Quick create</span>
          </button>
          <button
            className="notification-button"
            aria-label="Notifications"
            onClick={() => setAlerts(true)}
          >
            <Bell size={19} />
            {alertsList.some((a) => !state.settings.read.includes(a.id)) && (
              <i />
            )}
          </button>
          <span className="avatar admin">SA</span>
        </header>
        <div className="demo-bar">
          <span>
            <i />
            Frontend demonstration · fictional records · no external sending or
            payments
          </span>
          <label>
            As of
            <input
              aria-label="Demo as-of date"
              type="date"
              value={state.settings.asOf}
              onInput={(e) => {
                if (e.currentTarget.value)
                  run((s) => (s.settings.asOf = e.currentTarget.value));
              }}
              onChange={(e) => {
                if (e.target.value)
                  run((s) => (s.settings.asOf = e.target.value));
              }}
            />
          </label>
        </div>
        {error && (
          <div role="alert" className="error persistence-error">
            {error}
          </div>
        )}
        <main key={route.module + (route.filter || "")}>{content}</main>
        <footer className="workspace-footer">
          <span>Northstar Talent Partners · Super Admin</span>
          <span>Local demonstration / INR / Asia–Calcutta</span>
        </footer>
      </div>
      {alerts && (
        <Modal
          title="Internal notifications"
          onClose={() => setAlerts(false)}
          wide
        >
          <p>Calculated from the demo date. No messages are transmitted.</p>
          {alertsList.map((a) => (
            <div key={a.id} className="alert-row">
              <button
                className="text"
                onClick={() => {
                  navigate(a.kind, a.recordId);
                  setAlerts(false);
                }}
              >
                <span>
                  <strong>{a.title}</strong>
                  <small>{a.description}</small>
                </span>
              </button>
              <button
                disabled={state.settings.read.includes(a.id)}
                onClick={() => run((s) => s.settings.read.push(a.id))}
              >
                <Check size={14} />
                {state.settings.read.includes(a.id) ? "Read" : "Mark read"}
              </button>
            </div>
          ))}
          {!alertsList.length && (
            <p>No notifications at the current demo date.</p>
          )}
        </Modal>
      )}
      {quick && (
        <Modal title="Quick create" onClose={() => setQuick(false)}>
          <div className="quick-grid">
            {(
              [
                "clients",
                "jobs",
                "candidates",
                "applications",
                "interviews",
                "offers",
                "invoices",
                "receipts",
                "tasks",
              ] as Kind[]
            ).map((k) => (
              <div key={k}>
                <RecordActions
                  kind={k}
                  onNavigate={(k, id) => {
                    navigate(k, id);
                    setQuick(false);
                  }}
                />
              </div>
            ))}
          </div>
        </Modal>
      )}
      {guide && (
        <Modal
          title="Three guided business scenarios"
          onClose={() => setGuide(false)}
          wide
        >
          <Scenarios
            onNavigate={(k, id) => {
              navigate(k, id);
              setGuide(false);
            }}
          />
          <p className="notice">
            Start at 5 October 2026. Changes persist as browser JSON; Reset Demo
            restores the seed. Selected file contents clear on refresh. Source
            documentation includes detailed steps, assumptions and verification.
          </p>
        </Modal>
      )}
    </div>
  );
}
