import { useState, useEffect } from "react";
import { Plus, Edit3, MoreHorizontal } from "lucide-react";
import { useStore } from "./store";
import {
  type Kind,
  type RecordData,
  type State,
  find,
  date,
  fee,
  billing,
  invoiceNumbers,
  receiptAvailable,
  currentOffer,
  addDays,
} from "./model";
import { fields, termFields, type Field } from "./schema";
import { Form, Modal } from "./components";
import * as A from "./actions";
interface Spec {
  title: string;
  fields: Field[];
  initial?: Partial<RecordData>;
  apply: (s: State, v: RecordData) => void;
  message?: string;
}
const f = (
  key: string,
  label: string,
  options?: string[],
  ref?: Kind,
  type?: Field["type"],
  required = false,
): Field => ({ key, label, options, ref, type, required });
const why = f(
    "reason",
    "Reason / decision notes",
    undefined,
    undefined,
    "textarea",
    true,
  ),
  amount = f("amount", "Amount (INR)", undefined, undefined, "number", true),
  when = f("date", "Transaction date", undefined, undefined, "date", true);
export default function RecordActions({
  kind,
  record,
  onNavigate,
}: {
  kind: Kind;
  record?: RecordData;
  onNavigate: (k: string, id?: string) => void;
}) {
  const { state, run } = useStore();
  const [spec, setSpec] = useState<Spec>();
  const [menu, setMenu] = useState(false);
  const [preview, setPreview] = useState("");
  const r = record;
  function open(
    title: string,
    fs: Field[],
    apply: Spec["apply"],
    initial: Partial<RecordData> = {},
    message?: string,
  ) {
    setSpec({ title, fields: fs, apply, initial, message });
    setMenu(false);
  }
  function edit() {
    if (!r) return;
    open(
      "Edit " + kind,
      [...(fields[kind] || []), ...(r.terms ? termFields : [])],
      (s, v) => {
        if (kind === "placements") {
          if (
            s.data.invoices.some(
              (i) =>
                i.status === "Issued" &&
                i.lines?.some((l) => l.placementId === r.id),
            )
          )
            v.notes =
              (v.notes || "") +
              " · Issued invoice unchanged; review a credit or separate adjustment.";
          v.amount = v.billable ? fee(v.terms!, v.salary!) : 0;
          v.guaranteeEnd = addDays(v.actual!, v.terms!.guarantee);
        }
        if (
          kind === "users" &&
          v.status === "Inactive" &&
          r.status === "Active"
        ) {
          if (!v.reason)
            throw Error(
              "Record a deactivation reason and use Reassign open work. Historical shares remain unchanged.",
            );
        }
        A.save(s, kind, v);
      },
      { ...r },
      kind === "placements"
        ? "Reasoned snapshot amendment. Issued invoices retain their values; financial corrections require separate credit actions."
        : undefined,
    );
  }
  const buttons: { name: string; fn: () => void }[] = [];
  const add = (name: string, fn: () => void) => buttons.push({ name, fn });
  if (!r && fields[kind] && !["placements", "applications"].includes(kind))
    add("Add " + (kind === "cash" ? "outflow" : kind.slice(0, -1)), () =>
      open(
        "Create " + kind,
        fields[kind]!.concat(
          ["clients", "jobs"].includes(kind) ? termFields : [],
        ),
        (s, v) => A.save(s, kind, v),
        {
          terms: ["clients", "jobs"].includes(kind)
            ? { ...state.settings.defaultTerms }
            : undefined,
          status:
            kind === "jobs"
              ? "Open"
              : kind === "tasks"
                ? "Pending"
                : kind === "cash"
                  ? "Actual"
                  : "Active",
          ...(kind === "candidates"
            ? { consent: "Unknown", availability: "Available", userId: "u1" }
            : kind === "users"
              ? { role: "Recruiter", scope: "Assigned records" }
              : kind === "jobs"
                ? { openings: 1, userId: "u1", clientId: "c1" }
                : kind === "interviews"
                  ? { time: "10:00", duration: 45, round: 1 }
                  : {}),
          name: "",
        },
      ),
    );
  if (r && fields[kind] && !(kind === "users" && r.id === "admin"))
    add("Edit record", edit);
  if (!r && kind === "applications")
    add("New application", () =>
      open(
        "Link candidate to job",
        [
          f(
            "candidateId",
            "Candidate",
            undefined,
            "candidates",
            undefined,
            true,
          ),
          f("jobId", "Job", undefined, "jobs", undefined, true),
          f("userId", "Recruiter", undefined, "users"),
        ],
        (s, v) => {
          const a = A.applyCandidate(s, v.candidateId!, v.jobId!, v.userId!);
          onNavigate("pipeline", a.id);
        },
      ),
    );
  if (!r && kind === "offers")
    add("Create offer", () =>
      open(
        "Prepare selected candidate offer",
        [
          f(
            "applicationId",
            "Selected application",
            undefined,
            "applications",
            undefined,
            true,
          ),
          f(
            "salary",
            "Annual salary (INR)",
            undefined,
            undefined,
            "number",
            true,
          ),
          f("expected", "Expected joining date", undefined, undefined, "date"),
          f("deadline", "Acceptance deadline", undefined, undefined, "date"),
          f("notes", "Offer terms", undefined, undefined, "textarea"),
        ],
        (s, v) => {
          const offer = A.makeOffer(s, v.applicationId!, v);
          onNavigate("offers", offer.id);
        },
        { salary: 1200000, expected: addDays(state.settings.asOf, 20) },
      ),
    );
  if (!r && kind === "replacements")
    add("Request replacement", () =>
      open(
        "Assess guarantee request",
        [
          f(
            "placementId",
            "Original placement",
            undefined,
            "placements",
            undefined,
            true,
          ),
          f("ended", "Employment end date", undefined, undefined, "date", true),
          why,
          f(
            "restart",
            "Distinct request override",
            undefined,
            undefined,
            "checkbox",
          ),
        ],
        (s, v) =>
          A.replacement(s, v.placementId!, v.ended!, v.reason!, v.restart),
      ),
    );
  if (!r && kind === "invoices")
    add("Prepare invoice", () =>
      open(
        "Select eligible placements",
        [
          f(
            "notes",
            "Placement IDs (comma separated)",
            undefined,
            undefined,
            "textarea",
            true,
          ),
          f("date", "Planned issue date", undefined, undefined, "date", true),
          f("round", "Payment days", ["30", "45", "60", "90"]),
          f("mode", "Trigger", [
            "Invoice date",
            "Joining date",
            "Client acceptance",
          ]),
          f(
            "triggerDate",
            "Client acceptance date",
            undefined,
            undefined,
            "date",
          ),
          f(
            "amount",
            "Discount per line (INR)",
            undefined,
            undefined,
            "number",
          ),
          f("rating", "Illustrative tax %", undefined, undefined, "number"),
        ],
        (s, v) =>
          A.draftInvoice(
            s,
            v.notes!.split(",").map((x) => x.trim()),
            {
              days: Number(v.round),
              trigger: v.mode as never,
              triggerDate: v.triggerDate!,
              date: v.date,
              discount: v.amount || 0,
              tax: v.rating || 0,
            },
          ),
        {
          notes: state.data.placements
            .filter((p) => billing(state, p) === "Billable Uninvoiced")
            .slice(0, 1)
            .map((p) => p.id)
            .join(","),
          round: 30,
          mode: "Invoice date",
          rating: 18,
          amount: 0,
        },
        "Eligible IDs are listed below the register. Group only matching client, currency, duration and trigger date.",
      ),
    );
  if (!r && kind === "receipts")
    add("Record fictional receipt", () =>
      open(
        "Record fictional receipt",
        [
          f("clientId", "Client", undefined, "clients", undefined, true),
          amount,
          when,
          f("method", "Method", ["Bank transfer", "Cheque", "Cash", "Other"]),
          f("reference", "Fictional transaction reference"),
          f("notes", "Notes"),
        ],
        (s, v) => A.recordReceipt(s, v),
        {
          name: "REC-" + (state.data.receipts.length + 1),
          method: "Bank transfer",
        },
      ),
    );
  if (r) {
    if (
      ["clients", "candidates", "jobs", "users"].includes(kind) &&
      r.id !== "admin"
    )
      add("Archive / deactivate", () =>
        open(
          "Confirm archive or deactivation",
          [why],
          (s, v) => {
            const target = find(s, kind, r.id)!;
            if (
              kind === "clients" &&
              (s.data.jobs.some(
                (j) => j.clientId === r.id && j.status === "Open",
              ) ||
                s.data.invoices.some(
                  (i) =>
                    i.clientId === r.id && invoiceNumbers(s, i).outstanding > 0,
                ))
            )
              v.notes = "Open work and balances remain available.";
            target.archived = true;
            target.status =
              kind === "users"
                ? "Inactive"
                : kind === "clients"
                  ? "Inactive"
                  : "Archived";
            A.log(s, kind, r.id, "Record archived", v.reason);
          },
          {},
          "Historical records and foreign-key references remain available.",
        ),
      );
    if (kind === "clients")
      add("Add contact", () =>
        open(
          "Create linked contact",
          fields.contacts!,
          (s, v) => A.save(s, "contacts", v),
          { clientId: r.id, status: "Hiring" },
        ),
      );
    if (kind === "jobs") {
      add("Duplicate job", () =>
        open(
          "Duplicate job",
          [f("name", "New title", undefined, undefined, undefined, true)],
          (s, v) =>
            A.save(s, "jobs", {
              ...r,
              id: A.uid("job"),
              name: v.name,
              date: s.settings.asOf,
              status: "Draft",
              history: [],
            }),
          { name: r.name + " (copy)" },
          "Applications, interviews and invoices are not copied.",
        ),
      );
      add("Change job status", () =>
        open(
          "Change job status",
          [
            f("status", "Status", ["Open", "On Hold", "Closed", "Cancelled"]),
            why,
          ],
          (s, v) => {
            Object.assign(find(s, "jobs", r.id)!, { status: v.status });
            A.log(s, "jobs", r.id, "Job " + v.status, v.reason);
          },
          { status: "Closed" },
        ),
      );
    }
    if (kind === "candidates") {
      add("Apply to job", () =>
        open(
          "Create independent application",
          [
            f("jobId", "Open job", undefined, "jobs", undefined, true),
            f("userId", "Recruiter", undefined, "users"),
          ],
          (s, v) => A.applyCandidate(s, r.id, v.jobId!, v.userId!),
          { userId: r.userId },
        ),
      );
      add("Review / merge duplicate", () =>
        open(
          "Review candidate merge",
          [
            f(
              "candidateId",
              "Duplicate profile to archive",
              undefined,
              "candidates",
              undefined,
              true,
            ),
            why,
          ],
          (s, v) => A.mergeCandidates(s, r.id, v.candidateId!, v.reason!),
          {},
          "Applications and placement references move to this profile; notes are preserved. Conflicting active candidate-job applications block the merge.",
        ),
      );
      add("Preview sample resume", () =>
        setPreview(
          `Sample CV — ${r.name}\n${r.skills}\nExperience: ${r.experience} years\n${r.location}\nFictional demonstration only. No resume parsing.`,
        ),
      );
    }
    if (kind === "applications") {
      add("Change stage", () =>
        open(
          "Validated stage transition",
          [
            f("stage", "New stage", undefined, undefined),
            why,
            f(
              "restart",
              "Admin fast-track (no interview)",
              undefined,
              undefined,
              "checkbox",
            ),
          ].map((x) =>
            x.key === "stage"
              ? {
                  ...x,
                  options: [
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
                  ],
                }
              : { ...x, required: x.key === "reason" ? false : x.required },
          ),
          (s, v) => {
            if (v.stage === "Joined") {
              const joining = s.data.joinings.find(
                (j) => j.applicationId === r.id,
              );
              if (!joining)
                throw Error("Accept an offer before joining confirmation.");
              onNavigate("joinings", joining.id + "?confirm=joining");
            } else A.stage(s, r.id, v.stage!, v.reason || "", v.restart);
          },
          { stage: "Screening" },
          "Joined must be confirmed through Joinings. Submission is local only.",
        ),
      );
      add("Submission / communication preview", () =>
        open(
          "Unsent communication preview",
          [
            f("mode", "Channel", ["Email", "SMS", "WhatsApp"]),
            f(
              "notes",
              "Unsent message",
              undefined,
              undefined,
              "textarea",
              true,
            ),
          ],
          (s, v) =>
            A.log(
              s,
              "applications",
              r.id,
              "Unsent " + v.mode + " preview",
              v.notes,
            ),
          {
            mode: "Email",
            notes: `Candidate ${find(state, "candidates", r.candidateId)?.name} for ${find(state, "jobs", r.jobId)?.name}. Draft only — no delivery.`,
          },
        ),
      );
      add("Schedule interview", () =>
        open(
          "Schedule interview",
          fields.interviews!,
          (s, v) => A.save(s, "interviews", v),
          {
            applicationId: r.id,
            name: "Technical discussion",
            status: "Scheduled",
            userId: r.userId,
            time: "10:00",
            duration: 45,
            round: 1,
          },
        ),
      );
      add("Prepare offer", () =>
        open(
          "Prepare offer",
          [
            f(
              "salary",
              "Annual salary basis (INR)",
              undefined,
              undefined,
              "number",
              true,
            ),
            f(
              "expected",
              "Expected joining date",
              undefined,
              undefined,
              "date",
            ),
            f("deadline", "Acceptance deadline", undefined, undefined, "date"),
            f("notes", "Terms / decision notes"),
          ],
          (s, v) => {
            const offer = A.makeOffer(s, r.id, v);
            onNavigate("offers", offer.id);
          },
          {
            salary: 1200000,
            expected: addDays(state.settings.asOf, 15),
            deadline: addDays(state.settings.asOf, 7),
          },
        ),
      );
    }
    if (kind === "interviews") {
      add("Invitation preview / reminder", () =>
        open(
          "Unsent invitation",
          [
            f(
              "notes",
              "Draft invitation",
              undefined,
              undefined,
              "textarea",
              true,
            ),
          ],
          (s, v) => {
            A.log(s, kind, r.id, "Unsent invitation preview", v.notes);
            A.save(s, "tasks", {
              id: A.uid("task"),
              name: "Interview follow-up",
              date: s.settings.asOf,
              status: "Pending",
              due: r.date,
              userId: r.userId,
              linkedKind: kind,
              linkedId: r.id,
            });
          },
          {
            notes: `Interview ${r.name} on ${date(r.date)} at ${r.time} (Asia/Calcutta). Local preview only.`,
          },
        ),
      );
      add("Cancel / no-show", () =>
        open(
          "Confirm interview outcome",
          [f("status", "Outcome", ["Cancelled", "No Show"]), why],
          (s, v) => {
            find(s, kind, r.id)!.status = v.status;
            A.log(s, kind, r.id, "Interview " + v.status, v.reason);
          },
        ),
      );
    }
    if (kind === "offers") {
      add("Revise offer", () =>
        open(
          "New offer version",
          [
            f(
              "salary",
              "Revised annual salary",
              undefined,
              undefined,
              "number",
              true,
            ),
            f("expected", "Expected joining", undefined, undefined, "date"),
            f("deadline", "Acceptance deadline", undefined, undefined, "date"),
            why,
          ],
          (s, v) => {
            const offer = A.makeOffer(s, r.applicationId!, v);
            onNavigate("offers", offer.id);
          },
          { salary: r.salary, expected: r.expected, deadline: r.deadline },
        ),
      );
      add("Record offer outcome", () =>
        open(
          "Offer decision",
          [
            f("status", "Outcome", [
              "Sent",
              "Accepted",
              "Declined",
              "Expired",
              "Withdrawn",
            ]),
            f(
              "response",
              "Candidate response date",
              undefined,
              undefined,
              "date",
            ),
            f("expected", "Expected joining", undefined, undefined, "date"),
            { ...why, required: false },
          ],
          (s, v) =>
            A.offerDecision(
              s,
              r.id,
              v.status,
              v.reason || "",
              v.response,
              v.expected,
            ),
          {
            status: "Accepted",
            response: state.settings.asOf,
            expected: r.expected,
          },
        ),
      );
      add("Preview offer", () =>
        setPreview(
          `${r.name} · version ${r.version}\nAnnual salary INR ${r.salary}\nExpected joining ${date(r.expected)}\n${r.notes || ""}\nUnsent illustrative terms.`,
        ),
      );
    }
    if (kind === "joinings") {
      add("Confirm actual joining", () =>
        open(
          "Confirm joining and placement",
          [
            f(
              "actual",
              "Actual joining date",
              undefined,
              undefined,
              "date",
              true,
            ),
            f(
              "salary",
              "Final annual salary (INR)",
              undefined,
              undefined,
              "number",
              true,
            ),
            f(
              "userId",
              "Primary recruiter",
              undefined,
              "users",
              undefined,
              true,
            ),
            f("ownerId", "Split contributor (optional)", undefined, "users"),
            f(
              "amount",
              "Primary recruiter share %",
              undefined,
              undefined,
              "number",
              true,
            ),
            { ...why, required: false },
            f("restart", "Admin exception", undefined, undefined, "checkbox"),
          ],
          (s, v) =>
            A.confirmJoining(s, r.id, {
              actual: v.actual!,
              salary: v.salary!,
              shares: v.ownerId
                ? [
                    { userId: v.userId!, percent: v.amount! },
                    { userId: v.ownerId, percent: 100 - v.amount! },
                  ]
                : [{ userId: v.userId!, percent: v.amount! }],
              reason: v.reason,
              exception: v.restart,
            }),
          {
            actual: state.settings.asOf,
            salary: currentOffer(state, r.applicationId!)?.salary,
            userId: find(state, "applications", r.applicationId)?.userId,
            amount: 100,
          },
        ),
      );
      add("Defer / failed joining", () =>
        open(
          "Joining outcome",
          [
            f("status", "Outcome", ["Deferred", "Failed to Join"]),
            f(
              "expected",
              "Revised expected date",
              undefined,
              undefined,
              "date",
            ),
            why,
          ],
          (s, v) => {
            const jo = find(s, kind, r.id)!;
            if (
              s.data.placements.some((p) => p.applicationId === r.applicationId)
            )
              throw Error(
                "Already confirmed; record employment end on the placement instead.",
              );
            if (v.status === "Deferred" && !v.expected)
              throw Error("Revised expected date required.");
            jo.status = v.status;
            jo.expected = v.expected;
            const app = find(s, "applications", r.applicationId)!;
            app.expected = v.expected;
            if (v.status === "Failed to Join") app.stage = "Withdrawn";
            A.log(s, kind, r.id, v.status, v.reason);
          },
          { status: "Deferred", expected: addDays(state.settings.asOf, 7) },
        ),
      );
    }
    if (kind === "placements") {
      add("Employment ended / guarantee request", () =>
        open(
          "Record employment end",
          [
            f(
              "ended",
              "Employment end date",
              undefined,
              undefined,
              "date",
              true,
            ),
            why,
          ],
          (s, v) => A.replacement(s, r.id, v.ended!, v.reason!),
          { ended: state.settings.asOf },
        ),
      );
      add("Reopen original vacancy", () =>
        open("Explicit vacancy reopening", [why], (s, v) => {
          if (
            s.data.replacements.some(
              (x) =>
                x.originalId === r.id &&
                !["Closed", "Rejected", "Fulfilled"].includes(x.status),
            )
          )
            throw Error("Close or reject the replacement case first.");
          find(s, "placements", r.id)!.vacant = true;
          A.log(s, kind, r.id, "Original vacancy reopened", v.reason);
        }),
      );
    }
    if (kind === "replacements") {
      add("Review eligibility / treatment", () =>
        open(
          "Replacement decision",
          [
            f("status", "Case status", [
              "Under Review",
              "Approved",
              "In Progress",
              "Rejected",
              "Closed",
            ]),
            f("treatment", "Financial treatment", [
              "Free replacement",
              "Billable replacement",
              "Credit",
              "Refund",
              "No financial adjustment",
            ]),
            f(
              "restart",
              "Restart guarantee on replacement joining",
              undefined,
              undefined,
              "checkbox",
            ),
            why,
          ],
          (s, v) =>
            A.reviewReplacement(
              s,
              r.id,
              v.status,
              v.treatment!,
              v.reason!,
              !!v.restart,
            ),
          { status: "Approved", treatment: r.treatment, restart: r.restart },
          `Original guarantee ends ${date(find(state, "placements", r.originalId)?.guaranteeEnd)}. Employment ended ${date(r.ended)}. Any override needs a reason. Credits and refunds require separate finance actions.`,
        ),
      );
      add("Assign replacement candidate", () =>
        open(
          "Assign replacement application",
          [
            f(
              "candidateId",
              "Replacement candidate",
              undefined,
              "candidates",
              undefined,
              true,
            ),
            f("userId", "Recruiter", undefined, "users", undefined, true),
          ],
          (s, v) => {
            const rp = find(s, "replacements", r.id)!;
            if (!["Approved", "In Progress"].includes(rp.status))
              throw Error("Approve the case first.");
            if (rp.applicationId)
              throw Error("A replacement application is already assigned.");
            const a = A.applyCandidate(
              s,
              v.candidateId!,
              r.jobId!,
              v.userId!,
              r.id,
            );
            rp.applicationId = a.id;
            rp.status = "In Progress";
            A.log(s, kind, r.id, "Replacement candidate assigned");
          },
          { userId: r.userId },
        ),
      );
    }
    if (kind === "invoices") {
      if (r.status === "Draft") {
        add("Issue invoice", () =>
          open(
            "Confirm invoice issue",
            [{ ...why, required: false }],
            (s) => A.issueInvoice(s, r.id),
            {},
            "Issuing locks line values and creates a local receivable. No document is sent.",
          ),
        );
        add("Edit draft line", () =>
          open(
            "Review / edit draft line",
            [
              f(
                "placementId",
                "Placement line",
                undefined,
                "placements",
                undefined,
                true,
              ),
              amount,
              f("rating", "Tax %", undefined, undefined, "number"),
            ],
            (s, v) => {
              const i = find(s, kind, r.id)!;
              const l = i.lines!.find((x) => x.placementId === v.placementId);
              if (!l) throw Error("Placement is not in this draft.");
              if (v.amount! < 0 || v.amount! > l.fee || v.rating! < 0)
                throw Error("Discount must be between zero and line fee.");
              l.discount = v.amount!;
              l.tax = v.rating || 0;
              A.log(s, kind, r.id, "Draft line amended");
            },
            { placementId: r.lines?.[0].placementId, amount: 0, rating: 18 },
          ),
        );
        add("Remove draft line", () =>
          open(
            "Remove draft line",
            [
              f(
                "placementId",
                "Line placement ID",
                undefined,
                "placements",
                undefined,
                true,
              ),
              why,
            ],
            (s, v) => {
              const i = find(s, kind, r.id)!;
              i.lines = i.lines!.filter((l) => l.placementId !== v.placementId);
              A.log(s, kind, r.id, "Draft line removed", v.reason);
            },
          ),
        );
      }
      add("Cancel invoice", () =>
        open(
          "Confirm invoice cancellation",
          [why],
          (s, v) => A.cancelInvoice(s, r.id, v.reason!),
          {},
          "Payments or issued credits block cancellation. History and number are retained.",
        ),
      );
      if (r.status === "Issued") {
        add("Prepare credit note", () =>
          open(
            "Prepare line credit",
            [
              amount,
              f(
                "placementId",
                "Specific line (optional)",
                undefined,
                "placements",
              ),
              why,
            ],
            (s, v) =>
              A.creditInvoice(
                s,
                r.id,
                v.amount!,
                v.reason!,
                false,
                v.placementId,
              ),
            {},
            "Draft credit has no financial effect until issued.",
          ),
        );
        add("Collection promise / dispute", () =>
          open(
            "Collection follow-up",
            [
              f(
                "promise",
                "Expected / promised collection date",
                undefined,
                undefined,
                "date",
              ),
              f(
                "probability",
                "Collection probability (0–1)",
                undefined,
                undefined,
                "number",
              ),
              f("disputed", "Disputed", undefined, undefined, "checkbox"),
              f("disputeReason", "Dispute reason / resolution"),
              f("ownerId", "Dispute / collection owner", undefined, "users"),
              f("followUp", "Next follow-up", undefined, undefined, "date"),
              why,
            ],
            (s, v) => {
              if (
                v.probability !== undefined &&
                (v.probability < 0 || v.probability > 1)
              )
                throw Error("Probability must be between 0 and 1.");
              if (v.disputed && !v.disputeReason)
                throw Error("Dispute reason required.");
              Object.assign(find(s, kind, r.id)!, {
                promise: v.promise,
                probability: v.probability,
                disputed: v.disputed,
                disputeReason: v.disputeReason,
                ownerId: v.ownerId,
                followUp: v.followUp,
                resolved: !v.disputed ? s.settings.asOf : undefined,
              });
              A.log(s, kind, r.id, "Collection follow-up", v.reason);
            },
            {
              promise: r.promise,
              probability: r.probability ?? 1,
              disputed: r.disputed,
              disputeReason: r.disputeReason,
              ownerId: r.ownerId,
            },
          ),
        );
        add("Amend contractual due date", () =>
          open(
            "Reasoned contractual amendment",
            [
              f(
                "due",
                "New contractual due date",
                undefined,
                undefined,
                "date",
                true,
              ),
              why,
            ],
            (s, v) => {
              const i = find(s, kind, r.id)!;
              i.originalDue ??= i.due;
              i.due = v.due;
              A.log(s, kind, r.id, "Contractual due date amended", v.reason);
            },
            { due: r.due },
          ),
        );
        add("Release over-settlement", () =>
          open(
            "Release invoice credit to receipt",
            [
              f(
                "receiptId",
                "Original receipt",
                undefined,
                "receipts",
                undefined,
                true,
              ),
              amount,
              why,
            ],
            (s, v) =>
              A.releaseCredit(s, r.id, v.receiptId!, v.amount!, v.reason!),
            {},
            "Releases an allocation explicitly; receipt cash is unchanged. Available credit can then be refunded or allocated to another invoice.",
          ),
        );
      }
      add("Unsent billing / reminder", () =>
        open(
          "Unsent billing message",
          [f("notes", "Draft message", undefined, undefined, "textarea", true)],
          (s, v) => A.log(s, kind, r.id, "Unsent billing preview", v.notes),
          {
            notes: `${r.name}: outstanding INR ${invoiceNumbers(state, r).outstanding}. Due ${date(r.due)}. Draft only.`,
          },
        ),
      );
    }
    if (kind === "credits" && r.status === "Draft")
      add("Issue credit note", () =>
        open(
          "Confirm credit issue",
          [why],
          (s) => A.issueCredit(s, r.id),
          {},
          "This local adjustment reduces invoice fees and receivables. It does not record a cash refund.",
        ),
      );
    if (kind === "receipts") {
      add("Allocate receipt", () =>
        open(
          "Allocate available receipt credit",
          [
            f(
              "invoiceId",
              "Same-client invoice",
              undefined,
              "invoices",
              undefined,
              true,
            ),
            amount,
          ],
          (s, v) => A.allocate(s, r.id, v.invoiceId!, v.amount!),
          { amount: Math.max(0, receiptAvailable(state, r)) },
          "Availability and invoice outstanding are checked. Allocation does not create another cash event.",
        ),
      );
      add("Reverse receipt", () =>
        open(
          "Confirm receipt reversal",
          [why],
          (s, v) => A.reverseReceipt(s, r.id, v.reason!),
          {},
          "Preserves the original receipt and allocations; reopens balances and records cash reversal on the demo date.",
        ),
      );
      add("Record fictional refund", () =>
        open(
          "Confirm fictional refund",
          [
            amount,
            when,
            f("method", "Method", ["Bank transfer", "Cash", "Other"]),
            f("reference", "Fictional reference"),
            why,
          ],
          (s, v) =>
            A.refund(
              s,
              r.id,
              v.amount!,
              v.reason!,
              v.date,
              v.method!,
              v.reference!,
            ),
          { method: "Bank transfer" },
          "Refunds are limited to available receipt credit. Invoice over-settlement must be explicitly released first.",
        ),
      );
    }
    if (kind === "users") {
      add("Unsent invitation / password reset", () =>
        open(
          "Account communication preview",
          [
            f("mode", "Action", ["Invitation", "Password reset"]),
            f("notes", "Unsent preview", undefined, undefined, "textarea"),
          ],
          (s, v) => A.log(s, kind, r.id, "Unsent " + v.mode, v.notes),
          {
            mode: "Invitation",
            notes: `Illustrative account action for ${r.email}. No password, session or transmission.`,
          },
        ),
      );
      add("Reassign open work", () =>
        open(
          "Reassign active work",
          [
            f("userId", "New recruiter", undefined, "users", undefined, true),
            why,
          ],
          (s, v) => {
            A.reassignOpenWork(s, r.id, v.userId!, v.reason!);
          },
          {},
          "Historical placement shares remain unchanged.",
        ),
      );
    }
    if (
      ![
        "credits",
        "allocations",
        "refunds",
        "activities",
        "teams",
        "targets",
      ].includes(kind)
    )
      add("Add linked task / communication", () =>
        open(
          "Local task and activity",
          [
            f("name", "Task title", undefined, undefined, undefined, true),
            f("due", "Due date", undefined, undefined, "date", true),
            f("userId", "Owner", undefined, "users"),
            f(
              "notes",
              "Local communication log",
              undefined,
              undefined,
              "textarea",
            ),
          ],
          (s, v) => {
            A.save(s, "tasks", {
              ...v,
              linkedKind: kind,
              linkedId: r.id,
              status: "Pending",
            });
            A.log(s, kind, r.id, "Local communication / follow-up", v.notes);
          },
          {
            name: "Follow up " + r.name,
            due: addDays(state.settings.asOf, 2),
            userId: r.userId || "u1",
          },
        ),
      );
  }
  useEffect(() => {
    if (kind === "joinings" && r && location.hash.includes("confirm=joining"))
      buttons.find((b) => b.name === "Confirm actual joining")?.fn();
  }, [kind, r?.id]);
  if (!buttons.length) return null;
  return (
    <>
      <div className="actions">
        <button className="primary" onClick={() => buttons[0]?.fn()}>
          {r ? <Edit3 size={15} /> : <Plus size={16} />}{" "}
          {buttons[0]?.name || "Actions"}
        </button>
        {buttons.length > 1 && (
          <div className="action-menu">
            <button onClick={() => setMenu(!menu)} aria-expanded={menu}>
              <MoreHorizontal size={18} />
              All actions
            </button>
            {menu && (
              <div className="menu">
                {buttons.map((b) => (
                  <button key={b.name} onClick={b.fn}>
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {spec && (
        <Form
          title={spec.title}
          state={state}
          initial={{
            id: A.uid(kind),
            name: "Local record",
            status: "Active",
            date: state.settings.asOf,
            ...spec.initial,
          }}
          fields={spec.fields}
          onSave={(v) => run((s) => spec.apply(s, v))}
          onClose={() => setSpec(undefined)}
        >
          {spec.message && <p className="notice">{spec.message}</p>}
        </Form>
      )}
      {preview && (
        <Modal title="Local document preview" onClose={() => setPreview("")}>
          <pre className="document">{preview}</pre>
          <button onClick={() => window.print()}>Print preview</button>
        </Modal>
      )}
    </>
  );
}
