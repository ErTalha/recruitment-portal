import { useState } from "react";
import { useStore } from "./store";
import { RecordList } from "./Records";
import { invoiceNumbers } from "./model";
type Nav = (k: string, id?: string) => void;
export function Clients({
  onNavigate,
  filter,
}: {
  onNavigate: Nav;
  filter?: string;
}) {
  const { state } = useStore();
  const [owner, setOwner] = useState(""),
    [industry, setIndustry] = useState(""),
    [balance, setBalance] = useState(false);
  return (
    <>
      <div className="filter-strip">
        <label>
          Account owner
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">All owners</option>
            {state.data.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Industry
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">All industries</option>
            {[...new Set(state.data.clients.map((c) => c.industry))]
              .filter(Boolean)
              .map((i) => (
                <option key={i}>{i}</option>
              ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={balance}
            onChange={(e) => setBalance(e.target.checked)}
          />
          Positive outstanding balance
        </label>
      </div>
      <RecordList
        kind="clients"
        rows={state.data.clients.filter(
          (c) =>
            (!filter || c.id === filter) &&
            (!owner || c.ownerId === owner) &&
            (!industry || c.industry === industry) &&
            (!balance ||
              state.data.invoices.some(
                (i) =>
                  i.clientId === c.id &&
                  invoiceNumbers(state, i).outstanding > 0,
              )),
        )}
        onNavigate={onNavigate}
      />
    </>
  );
}
export function Candidates({ onNavigate }: { onNavigate: Nav }) {
  const { state } = useStore();
  const [location, setLocation] = useState(""),
    [source, setSource] = useState(""),
    [min, setMin] = useState(""),
    [salary, setSalary] = useState(""),
    [notice, setNotice] = useState(""),
    [available, setAvailable] = useState("");
  const rows = state.data.candidates.filter(
    (c) =>
      (!location ||
        c.location?.toLowerCase().includes(location.toLowerCase())) &&
      (!source || c.source === source) &&
      (!min || (c.experience || 0) >= Number(min)) &&
      (!salary || (c.salary || 0) <= Number(salary)) &&
      (!notice || (c.notice || 0) <= Number(notice)) &&
      (!available || (c.expected && c.expected <= available)),
  );
  return (
    <>
      <div className="filter-strip">
        <label>
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Any location"
          />
        </label>
        <label>
          Source
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">All sources</option>
            {["Referral", "Direct", "CSV", "Job board", "Other"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Minimum experience
          <input
            type="number"
            min="0"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
        </label>
        <label>
          Max expected salary INR
          <input
            type="number"
            min="0"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </label>
        <label>
          Max notice days
          <input
            type="number"
            min="0"
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
          />
        </label>
        <label>
          Available by
          <input
            type="date"
            value={available}
            onChange={(e) => setAvailable(e.target.value)}
          />
        </label>
        <button
          onClick={() => {
            setLocation("");
            setSource("");
            setMin("");
            setSalary("");
            setNotice("");
            setAvailable("");
          }}
        >
          Clear ATS filters
        </button>
      </div>
      <p className="muted">
        Search below also matches name, email, telephone, skills, tags and
        profile notes. Save searches for reuse.
      </p>
      <RecordList kind="candidates" rows={rows} onNavigate={onNavigate} />
    </>
  );
}
