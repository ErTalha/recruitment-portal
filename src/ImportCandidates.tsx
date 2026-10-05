import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Modal, csv } from "./components";
import { useStore } from "./store";
import { type RecordData } from "./model";
import { save, uid } from "./actions";
export function parseCSV(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (quoted) throw Error("CSV contains an unclosed quote.");
  return rows;
}
export default function ImportCandidates() {
  const { state, run } = useStore();
  const [open, setOpen] = useState(false),
    [rows, setRows] = useState<string[][]>([]),
    [mapping, setMapping] = useState<Record<string, number>>({
      name: 0,
      email: 1,
      phone: 2,
      skills: 3,
      location: 4,
    }),
    [error, setError] = useState(""),
    [summary, setSummary] = useState("");
  const keys = ["name", "email", "phone", "skills", "location"];
  const seen = new Set(
    state.data.candidates
      .filter((c) => !c.archived)
      .map((c) => c.email?.trim().toLowerCase()),
  );
  const preview = rows.slice(1).map((cells, i) => {
    const values = Object.fromEntries(
      keys.map((k) => [k, cells[mapping[k]] || ""]),
    );
    let issue = !values.name
      ? "Name missing"
      : !/^\S+@\S+\.\S+$/.test(values.email)
        ? "Invalid email"
        : seen.has(values.email.toLowerCase())
          ? "Duplicate email — review existing profile"
          : "";
    if (
      !issue &&
      values.phone &&
      state.data.candidates.some(
        (c) => c.phone?.replace(/\W/g, "") === values.phone.replace(/\W/g, ""),
      )
    )
      issue = "Duplicate telephone";
    if (!issue) seen.add(values.email.toLowerCase());
    return { values, issue, row: i + 2 };
  });
  return (
    <>
      <button onClick={() => setOpen(true)}>
        <Upload size={15} />
        Import CSV
      </button>
      <button
        onClick={() =>
          csv(
            [
              {
                id: "template",
                name: "Taylor Fictional",
                email: "csv-candidate@example.com",
                phone: "DEMO-CSV-1",
                skills: "React, TypeScript",
                location: "Demo Pune",
                status: "Active",
                date: state.settings.asOf,
              },
            ],
            keys.map((key) => ({ key, title: key })),
            "candidate-template.csv",
          )
        }
      >
        <FileText size={15} />
        CSV template
      </button>
      {open && (
        <Modal
          title="Import candidates · local preview"
          wide
          onClose={() => {
            setOpen(false);
            setSummary("");
          }}
        >
          <label>
            Choose CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={async (e) => {
                try {
                  const text = await e.target.files?.[0]?.text();
                  if (text) {
                    const parsed = parseCSV(text.replace(/^\uFEFF/, ""));
                    setRows(parsed);
                    setMapping(
                      Object.fromEntries(
                        keys.map((k, i) => [
                          k,
                          Math.max(
                            0,
                            parsed[0].findIndex((h) => h.toLowerCase() === k) >=
                              0
                              ? parsed[0].findIndex(
                                  (h) => h.toLowerCase() === k,
                                )
                              : i,
                          ),
                        ]),
                      ),
                    );
                    setSummary("");
                    setError("");
                  }
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
          </label>
          {rows.length > 0 && (
            <>
              <div className="form-grid">
                {keys.map((k) => (
                  <label key={k}>
                    Map {k}
                    <select
                      value={mapping[k]}
                      onChange={(e) =>
                        setMapping({ ...mapping, [k]: Number(e.target.value) })
                      }
                    >
                      {rows[0].map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p) => (
                      <tr key={p.row}>
                        <td>{p.row}</td>
                        <td>{p.values.name}</td>
                        <td>{p.values.email}</td>
                        <td>{p.issue || "Eligible for local import"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="notice">
                {preview.filter((p) => !p.issue).length} valid rows;{" "}
                {preview.filter((p) => p.issue).length} excluded. Duplicate rows
                are excluded and can be reviewed through Candidate → Review /
                merge duplicate.
              </p>
              <button
                className="primary"
                disabled={!preview.some((p) => !p.issue) || !!summary}
                onClick={() => {
                  try {
                    run((s) =>
                      preview
                        .filter((p) => !p.issue)
                        .forEach((p) =>
                          save(s, "candidates", {
                            ...p.values,
                            id: uid("candidate"),
                            date: s.settings.asOf,
                            status: "Active",
                            consent: "Unknown",
                            availability: "Available",
                            source: "CSV",
                          } as RecordData),
                        ),
                    );
                    setSummary(
                      `${preview.filter((p) => !p.issue).length} candidates imported; ${preview.filter((p) => p.issue).length} rows skipped.`,
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Confirm eligible rows
              </button>
            </>
          )}
          {error && <p className="error">{error}</p>}
          {summary && (
            <p role="status" className="notice">
              {summary}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
