import { useState, useEffect } from "react";
import { useStore } from "./store";
import { roles, permissionActions, type RecordData, date } from "./model";
import { Form, Modal, Badge, Table } from "./components";
import { termFields, modules } from "./schema";
import { RecordList } from "./Records";
import RecordActions from "./RecordActions";
import { log, validateTerms } from "./actions";
export function Scenarios({
  onNavigate,
}: {
  onNavigate: (k: string, id?: string) => void;
}) {
  return (
    <div className="scenario-grid">
      {[
        {
          title: "01 · New placement to collection",
          description:
            "Start with an accepted offer, confirm actual joining, prepare and issue an invoice, then allocate a partial receipt and settle.",
          links: [
            ["joinings", "jo17", "Confirm joining"],
            ["invoices", "", "Prepare invoice"],
            ["payments", "", "Record & allocate receipt"],
          ],
        },
        {
          title: "02 · Replacement without duplicate revenue",
          description:
            "Approve the free replacement for placement 13, assign a candidate, progress its application and confirm joining. The original fee and vacancy stay counted once.",
          links: [
            ["replacements", "rp1", "Review guarantee case"],
            ["pipeline", "", "Progress replacement"],
            ["joinings", "", "Confirm replacement joining"],
          ],
        },
        {
          title: "03 · Collection exception",
          description:
            "Inspect the overdue invoice, record a promise and dispute, prepare and issue a credit, allocate a receipt, then reverse it or release credit and refund.",
          links: [
            ["invoices", "iv3", "Review overdue invoice"],
            ["invoices", "iv1", "Paid invoice & credit"],
            ["payments", "rc2", "Allocate or reverse receipt"],
          ],
        },
      ].map((sc) => (
        <article className="panel" key={sc.title}>
          <h3>{sc.title}</h3>
          <p>{sc.description}</p>
          {sc.links.map(([k, id, text]) => (
            <button
              className="text"
              key={text}
              onClick={() => onNavigate(k, id || undefined)}
            >
              {text} ↗
            </button>
          ))}
        </article>
      ))}
    </div>
  );
}
export function Settings({
  onNavigate,
}: {
  onNavigate: (k: string, id?: string) => void;
}) {
  const { state, run, reset } = useStore();
  const [edit, setEdit] = useState(false),
    [confirm, setConfirm] = useState(false),
    [master, setMaster] = useState("Industries"),
    [name, setName] = useState(""),
    [message, setMessage] = useState("");
  return (
    <>
      <div className="section-heading">
        <div>
          <h1>Workspace settings</h1>
          <p className="muted">Demo configuration · no external connections</p>
        </div>
        <button className="primary" onClick={() => setEdit(true)}>
          Edit agency & defaults
        </button>
      </div>
      <div className="two-col">
        <div className="panel">
          <h3>Demonstration controls</h3>
          <label>
            As-of date
            <input
              type="date"
              value={state.settings.asOf}
              onInput={(e) => {
                const value = e.currentTarget.value;
                if (value) run((s) => (s.settings.asOf = value));
              }}
              onChange={(e) => {
                if (e.target.value)
                  run((s) => (s.settings.asOf = e.target.value));
              }}
            />
          </label>
          <p>
            Changes ageing, guarantee expiry, forecast alerts and point-in-time
            cash. It does not rewrite stored dates or terms.
          </p>
          <button className="danger-button" onClick={() => setConfirm(true)}>
            Reset Demo
          </button>
          <p className="muted">
            Version 1 seed · JSON persists locally when storage is available. No
            authentication, backend, payment processing or message delivery.
          </p>
        </div>
        <div className="panel">
          <h3>Commercial defaults</h3>
          <p>{state.settings.agency} · INR · Asia/Calcutta · DD MMM YYYY</p>
          <p>
            Fee {state.settings.defaultTerms.value}
            {state.settings.defaultTerms.method === "Percentage"
              ? "%"
              : " INR"}{" "}
            · Annual fixed CTC
          </p>
          <p>
            Payment duration {state.settings.defaultTerms.days} calendar days ·{" "}
            {state.settings.defaultTerms.trigger}
          </p>
          <p>
            Guarantee {state.settings.defaultTerms.guarantee} days · No
            automatic restart for replacement
          </p>
          <p>Opening cash INR {state.settings.openingCash}</p>
        </div>
      </div>
      <div className="two-col">
        <div className="panel">
          <h3>Stage forecast probabilities</h3>
          <div className="form-grid">
            {Object.entries(state.settings.probabilities).map(([stage, p]) => (
              <label key={stage}>
                {stage} %
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(p * 100)}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (n >= 0 && n <= 100)
                      run((s) => (s.settings.probabilities[stage] = n / 100));
                  }}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Master options</h3>
          <select
            aria-label="Master category"
            value={master}
            onChange={(e) => setMaster(e.target.value)}
          >
            {Object.keys(state.settings.masters).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <div className="master-list">
            {state.settings.masters[master].map((m, i) => (
              <div key={i}>
                <span>{m.name}</span>
                <Badge>{m.active ? "Active" : "Inactive"}</Badge>
                <button
                  onClick={() =>
                    run((s) => {
                      s.settings.masters[master][i].active = !m.active;
                    })
                  }
                >
                  {m.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            ))}
          </div>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                run((s) =>
                  s.settings.masters[master].push({
                    name: name.trim(),
                    active: true,
                  }),
                );
                setName("");
              }
            }}
          >
            <input
              aria-label="New master option"
              value={name}
              placeholder="Add option"
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button>Add</button>
          </form>
          <p className="muted">
            Historical labels are retained when an option is deactivated.
          </p>
        </div>
      </div>
      <h2>Guided demonstration</h2>
      <Scenarios onNavigate={onNavigate} />
      {edit && (
        <Form
          state={state}
          title="Agency profile and commercial defaults"
          initial={{
            id: "settings",
            name: state.settings.agency,
            status: "Active",
            date: state.settings.asOf,
            reference: state.settings.prefix,
            amount: state.settings.openingCash,
            notice: state.settings.reminder,
            experience: state.settings.stageAge,
            terms: state.settings.defaultTerms,
            email: state.settings.contact,
            notes: state.settings.branding,
          }}
          fields={[
            { key: "name", label: "Agency name", required: true },
            { key: "reference", label: "Invoice prefix", required: true },
            { key: "email", label: "Agency contact (example address)" },
            {
              key: "notes",
              label: "Sample branding / contact text",
              type: "textarea",
            },
            { key: "amount", label: "Opening cash INR", type: "number" },
            {
              key: "notice",
              label: "Reminder threshold (days)",
              type: "number",
            },
            {
              key: "experience",
              label: "Stage-age threshold (days)",
              type: "number",
            },
            ...termFields,
          ]}
          onSave={(v) =>
            run((s) => {
              validateTerms(v.terms!);
              s.settings.contact = v.email;
              s.settings.branding = v.notes;
              s.settings.agency = v.name;
              s.settings.prefix = v.reference!;
              s.settings.openingCash = v.amount || 0;
              s.settings.reminder = v.notice || 7;
              s.settings.stageAge = v.experience || 14;
              s.settings.defaultTerms = v.terms!;
            })
          }
          onClose={() => setEdit(false)}
        />
      )}{" "}
      {confirm && (
        <Modal
          title="Reset all local demonstration changes?"
          onClose={() => setConfirm(false)}
        >
          <p>
            This restores every record to the fictional 5 October 2026 seed.
            Your local edits and activities will be replaced.
          </p>
          <footer>
            <button onClick={() => setConfirm(false)}>Keep changes</button>
            <button
              className="danger-button"
              onClick={() => {
                reset();
                setConfirm(false);
                setMessage("Demo reset to consistent version 1 seed.");
              }}
            >
              Confirm Reset Demo
            </button>
          </footer>
        </Modal>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </>
  );
}
export function Users({
  onNavigate,
}: {
  onNavigate: (k: string, id?: string) => void;
}) {
  const { state, run } = useStore();
  const [role, setRole] = useState("Recruiter"),
    [scope, setScope] = useState(
      state.settings.roleScopes?.Recruiter || "Assigned records",
    ),
    [module, setModule] = useState("all");
  useEffect(
    () =>
      setScope(
        state.settings.roleScopes?.[role] ||
          (role === "Super Admin" ? "All records" : "Assigned records"),
      ),
    [role],
  );
  return (
    <>
      <RecordList kind="users" onNavigate={onNavigate} />
      <div className="panel">
        <h3>Permission configuration & preview</h3>
        <div className="filter-strip">
          <label>
            Role preset
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Module
            <select value={module} onChange={(e) => setModule(e.target.value)}>
              <option value="all">All modules</option>
              {modules.map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Record scope preview
            <select
              value={scope}
              disabled={role === "Super Admin"}
              onChange={(e) => {
                const value = e.target.value;
                setScope(value);
                run((s) => {
                  s.settings.roleScopes ??= {};
                  s.settings.roleScopes[role] = value;
                });
              }}
            >
              {["All records", "Managed teams", "Assigned records"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="permission-grid">
          {permissionActions.map((action) => {
            const key = module === "all" ? action : module + ":" + action;
            const allowed =
              role === "Super Admin" ||
              (state.settings.permissions[role][key] ??
                state.settings.permissions[role][action]);
            return (
              <label key={action}>
                <input
                  type="checkbox"
                  disabled={role === "Super Admin"}
                  checked={allowed}
                  onChange={(e) =>
                    run(
                      (s) =>
                        (s.settings.permissions[role][key] = e.target.checked),
                    )
                  }
                />
                {action}
                <Badge>{allowed ? "Allowed" : "Restricted"}</Badge>
              </label>
            );
          })}
        </div>
        <p className="notice">
          Preview: {role} · {scope}.{" "}
          {scope === "All records"
            ? "All agency records would be visible."
            : scope === "Managed teams"
              ? "Only managed-team records would be visible."
              : "Only assigned job and application records would be visible."}{" "}
          Super Admin retains full access to every module.
        </p>
        <p className="muted">
          Configuration only. Invitations and password resets create unsent
          local previews. No passwords, tokens or sessions are stored.
        </p>
      </div>
      <RecordList kind="teams" onNavigate={onNavigate} />
    </>
  );
}
