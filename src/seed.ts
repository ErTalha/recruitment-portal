import {
  type State,
  type RecordData,
  type Terms,
  kinds,
  stages,
  roles,
  permissionActions,
  addDays,
  fee,
} from "./model";
export function seed(): State {
  const asOf = "2026-10-05";
  const d = (n: number) => addDays(asOf, n);
  const terms: Terms = {
    method: "Percentage",
    value: 8.33,
    days: 30,
    trigger: "Invoice date",
    guarantee: 90,
    conditions:
      "Employment ends within guarantee; client confirms eligibility.",
    salaryBasis: "Annual fixed CTC",
  };
  const s: State = {
    version: 1,
    data: Object.fromEntries(
      kinds.map((k) => [k, []]),
    ) as unknown as State["data"],
    settings: {
      asOf,
      agency: "Northstar Talent Partners",
      prefix: "NST",
      openingCash: 250000,
      reminder: 7,
      stageAge: 14,
      defaultTerms: terms,
      probabilities: {
        New: 0,
        Screening: 0.1,
        Shortlisted: 0.2,
        "Submitted to Client": 0.3,
        Interviewing: 0.5,
        Selected: 0.7,
        "Offer Sent": 0.8,
        "Offer Accepted": 0.9,
      },
      masters: Object.fromEntries(
        [
          "Industries",
          "Skills",
          "Qualifications",
          "Sources",
          "Priorities",
          "Interview types",
          "Rejection reasons",
          "Replacement reasons",
          "Activity types",
          "Outflow categories",
        ].map((k) => [
          k,
          ["Technology", "Operations", "General"].map((name) => ({
            name,
            active: true,
          })),
        ]),
      ),
      permissions: Object.fromEntries(
        roles.map((r) => [
          r,
          Object.fromEntries(
            permissionActions.map((a) => [
              a,
              r === "Super Admin" ||
                r === "Founder or Admin" ||
                (r === "Finance Executive"
                  ? [
                      "view",
                      "export",
                      "issue invoice",
                      "record receipt",
                      "create credit note",
                      "financial visibility",
                    ].includes(a)
                  : ["view", "create", "edit", "assign", "export"].includes(a)),
            ]),
          ),
        ]),
      ),
      read: [],
      savedFilters: [],
    },
  };
  s.settings.contact = "agency@example.com";
  s.settings.branding = "Permanent recruitment · Fictional local demonstration";
  s.settings.masters = Object.fromEntries(
    Object.entries({
      Industries: ["Technology", "Services", "Manufacturing"],
      Skills: ["React", "TypeScript", "Operations", "Analysis"],
      Qualifications: ["Degree", "Diploma", "Professional certificate"],
      Sources: ["Referral", "Direct", "CSV", "Job board", "Other"],
      Priorities: ["Low", "Normal", "High", "Urgent"],
      "Interview types": ["Screening", "Technical", "Manager", "Client"],
      "Rejection reasons": [
        "Skills mismatch",
        "Salary mismatch",
        "Client decision",
      ],
      "Replacement reasons": [
        "Employment ended",
        "Candidate resignation",
        "Client request",
      ],
      "Activity types": [
        "Note",
        "Call",
        "Unsent email",
        "Unsent SMS",
        "Unsent WhatsApp",
      ],
      "Outflow categories": ["Operations", "Sourcing", "Office", "Other"],
    }).map(([k, values]) => [
      k,
      values.map((name) => ({ name, active: true })),
    ]),
  );
  s.data.teams = [
    { id: "t1", name: "Technology desk", status: "Active", date: d(-180) },
    { id: "t2", name: "Business desk", status: "Active", date: d(-180) },
  ];
  ["Aster", "Briar", "Cedar", "Dune", "Ember"].forEach((name, i) =>
    s.data.users.push({
      id: "u" + (i + 1),
      name: name + " Demo",
      status: "Active",
      date: d(-180),
      role: "Recruiter",
      teamId: i % 2 ? "t2" : "t1",
      managerId: "u6",
      email: name.toLowerCase() + "@example.com",
      scope: "Assigned records",
    }),
  );
  s.data.users.push(
    {
      id: "u6",
      name: "Morgan Demo",
      status: "Active",
      date: d(-180),
      role: "Recruitment Manager",
      teamId: "t1",
      email: "manager@example.com",
      scope: "Managed teams",
    },
    {
      id: "admin",
      name: "Super Admin",
      status: "Active",
      date: d(-180),
      role: "Super Admin",
      email: "admin@example.com",
      scope: "All records",
    },
  );
  [
    "Asterwave Labs",
    "Birchline Systems",
    "Cloudmere Works",
    "Dawnfield Studio",
    "Everpine Digital",
    "Fernbridge Industries",
    "Glimmerstone Group",
    "Harbourleaf Ventures",
  ].forEach((name, i) => {
    const id = "c" + (i + 1);
    s.data.clients.push({
      id,
      name,
      date: d(-180),
      status: "Active",
      industry: i % 2 ? "Technology" : "Services",
      ownerId: "u" + ((i % 5) + 1),
      teamId: i % 2 ? "t2" : "t1",
      email: `billing${i + 1}@example.com`,
      phone: `DEMO-CLIENT-${i + 1}`,
      address: `${i + 1} Fictional Avenue, Demo City`,
      location: "Demo City",
      currency: "INR",
      terms: {
        ...terms,
        days: [30, 45, 60, 90][i % 4],
        method: i % 3 ? "Percentage" : "Fixed",
        value: i % 3 ? 8.33 : 100000,
      },
    });
    ["Hiring", "Billing"].forEach((designation, k) =>
      s.data.contacts.push({
        id: `ct${i}-${k}`,
        clientId: id,
        name: `Contact ${i + 1} ${designation}`,
        designation,
        email: `contact${i}-${k}@example.com`,
        phone: `DEMO-CONTACT-${i}-${k}`,
        preferences: "Unsent email preview",
        status: k ? "Billing" : "Primary",
        date: d(-180),
      }),
    );
  });
  for (let i = 0; i < 20; i++) {
    const c = s.data.clients[i % 8];
    s.data.jobs.push({
      id: "j" + (i + 1),
      name: [
        "Product Engineer",
        "Operations Lead",
        "Data Analyst",
        "Design Specialist",
        "Delivery Manager",
      ][i % 5],
      clientId: c.id,
      status: i === 19 ? "On Hold" : "Open",
      date: d(-120 + i * 3),
      expected: d(20 + i),
      openings: 3,
      minSalary: 900000,
      maxSalary: 1500000,
      skills: "Strategy, collaboration, analysis",
      location: i % 2 ? "Demo Bengaluru" : "Demo Pune",
      userId: "u" + ((i % 5) + 1),
      teamId: c.teamId,
      ownerId: c.ownerId,
      priority: i % 3 ? "Normal" : "High",
      terms: { ...c.terms! },
      notes: "Permanent recruitment. Hybrid. Annual salary range.",
    });
  }
  const names = [
    "Alex",
    "Blake",
    "Casey",
    "Drew",
    "Ellis",
    "Finley",
    "Gray",
    "Harper",
    "Indigo",
    "Jules",
    "Kai",
    "Lane",
  ];
  for (let i = 0; i < 60; i++)
    s.data.candidates.push({
      id: "ca" + (i + 1),
      name: `${names[i % 12]} Sample ${String(i + 1).padStart(2, "0")}`,
      date: d(-80 + i),
      status: "Active",
      email: `candidate${i + 1}@example.com`,
      phone: `DEMO-CANDIDATE-${i + 1}`,
      location: i % 2 ? "Demo Pune" : "Demo Bengaluru",
      skills:
        i % 3
          ? "React, TypeScript, analysis"
          : "Operations, stakeholder management",
      tags: i % 2 ? "Priority, Technology" : "Business",
      experience: 2 + (i % 10),
      salary: 1200000,
      currentSalary: 900000,
      notice: 30,
      availability: "Available",
      consent: "Recorded",
      source: ["Referral", "Direct", "CSV"][i % 3],
      userId: "u" + ((i % 5) + 1),
      resume: "sample-resume.html",
      notes: "Fictional profile for client demonstration.",
    });
  for (let i = 0; i < 80; i++)
    s.data.applications.push({
      id: "a" + (i + 1),
      name: `APP-${String(i + 1).padStart(3, "0")}`,
      date: d(-60 + (i % 40)),
      candidateId: "ca" + ((i % 60) + 1),
      jobId: "j" + ((i % 20) + 1),
      userId: "u" + ((i % 5) + 1),
      stage: i < 16 ? "Joined" : i < 20 ? "Offer Accepted" : stages[i % 8],
      status: "Active",
      expected: i % 9 === 0 ? undefined : d((i % 30) - 5),
      followUp: d((i % 12) - 4),
      history: [{ date: d(-30), action: "New", reason: "Seed application" }],
    });
  // Avoid candidate/job conflicts for repeat candidate profiles.
  for (let i = 60; i < 80; i++)
    s.data.applications[i].jobId = "j" + (((i + 1) % 20) + 1);
  for (let i = 0; i < 30; i++)
    s.data.interviews.push({
      id: "int" + (i + 1),
      name: `Round ${(i % 3) + 1}`,
      applicationId: "a" + (i < 20 ? i + 1 : i + 5),
      date: d(i < 20 ? -40 + i : i - 24),
      status: i < 20 ? "Completed" : i % 3 ? "Scheduled" : "Rescheduled",
      round: (i % 3) + 1,
      time: "10:00",
      duration: 45,
      userId: "u" + ((i % 5) + 1),
      interviewer: "Fictional panel",
      mode: "Video preview",
      feedback: i < 20 ? "Strong structured evidence." : "",
      recommendation: i < 20 ? "Proceed" : "",
      rating: 4,
      history:
        i % 3 === 0
          ? [
              {
                date: d(-10),
                action: "Rescheduled",
                reason: "Client availability; previous slot retained.",
              },
            ]
          : [],
    });
  for (let i = 0; i < 20; i++) {
    s.data.offers.push({
      id: "o" + (i + 1),
      name: `Offer ${i + 1}`,
      applicationId: "a" + (i + 1),
      status: i < 20 ? "Accepted" : "Sent",
      date: d(-45 + i),
      salary: 1200000 + i * 10000,
      version: 1,
      response: d(-35 + i),
      expected: d(i < 16 ? -150 + i * 9 : 5 + i),
      deadline: d(10),
      notes: "Annual fixed CTC; illustrative offer.",
    });
    s.data.joinings.push({
      id: "jo" + (i + 1),
      name: `Joining ${i + 1}`,
      applicationId: "a" + (i + 1),
      offerId: "o" + (i + 1),
      status: i < 16 ? "Joining Confirmed" : i === 17 ? "Deferred" : "Expected",
      expected: d(i < 16 ? -150 + i * 9 : 5 + i),
      actual: i < 16 ? d(-150 + i * 9) : undefined,
      date: d(-30),
      notes: i === 17 ? "Joining delayed for notice period." : "",
    });
  }
  for (let i = 0; i < 16; i++) {
    const a = s.data.applications[i],
      j = s.data.jobs[i];
    const actual = d(-150 + i * 9);
    s.data.placements.push({
      id: "p" + (i + 1),
      name: `Placement ${i + 1}`,
      applicationId: a.id,
      jobId: j.id,
      candidateId: a.candidateId,
      clientId: j.clientId,
      userId: a.userId,
      status: "Active",
      date: actual,
      actual,
      salary: 1200000 + i * 10000,
      amount: fee(j.terms!, 1200000 + i * 10000),
      terms: { ...j.terms! },
      shares:
        i === 0
          ? [
              { userId: "u1", percent: 60 },
              { userId: "u2", percent: 40 },
            ]
          : [{ userId: a.userId!, percent: 100 }],
      billable: true,
      currency: "INR",
      guaranteeEnd: addDays(actual, j.terms!.guarantee),
      plannedIssue: d(2),
    });
  }
  for (let i = 0; i < 12; i++) {
    const p = s.data.placements[i];
    const issue = d(
      -p.terms!.days - [0, 15, 45, 75, 110, 7, 35, 65, 95, 20, 5, 0][i],
    );
    s.data.invoices.push({
      id: "iv" + (i + 1),
      name: `NST-2026-${String(i + 1).padStart(3, "0")}`,
      clientId: p.clientId,
      status: "Issued",
      date: issue,
      due: addDays(issue, p.terms!.days),
      triggerDate: issue,
      currency: "INR",
      terms: { ...p.terms! },
      lines: [{ placementId: p.id, fee: p.amount!, discount: 0, tax: 18 }],
      promise: i === 1 ? d(-3) : undefined,
      probability: 0.85,
      disputed: i === 2,
      disputeReason: i === 2 ? "Client reviewing guarantee claim." : undefined,
    });
  }
  for (let i = 0; i < 10; i++) {
    const iv = s.data.invoices[i];
    const amount =
      iv.lines![0].fee * 1.18 * (i === 0 ? 1.2 : i % 3 === 0 ? 1 : 0.4);
    s.data.receipts.push({
      id: "rc" + (i + 1),
      name: `REC-${String(i + 1).padStart(3, "0")}`,
      clientId: iv.clientId,
      status: "Recorded",
      date: d(-20 + i),
      amount,
      currency: "INR",
      method: "Bank transfer (fictional)",
      reference: "DEMO-" + i,
    });
    s.data.allocations.push({
      id: "al" + (i + 1),
      name: "Allocation",
      invoiceId: iv.id,
      receiptId: "rc" + (i + 1),
      amount: Math.min(amount, iv.lines![0].fee * 1.18),
      status: "Active",
      date: d(-20 + i),
    });
  }
  s.data.receipts[8].reversed = d(-2);
  s.data.receipts[8].reversalReason = "Demonstration correction";
  s.data.credits.push({
    id: "cr1",
    name: "CN-001",
    invoiceId: "iv1",
    status: "Issued",
    date: d(-5),
    amount: 11800,
    lines: [{ placementId: "p1", fee: 10000, discount: 0, tax: 18 }],
    reason: "Agreed fee reduction",
  });
  s.data.refunds.push({
    id: "rf1",
    name: "Refund 1",
    receiptId: "rc1",
    clientId: "c1",
    status: "Recorded",
    date: d(-3),
    amount: 5000,
    method: "Fictional bank refund",
    reference: "DEMO-REFUND",
    reason: "Unapplied excess receipt",
  });
  for (let i = 0; i < 4; i++) {
    const p = s.data.placements[12 + i];
    s.data.replacements.push({
      id: "rp" + (i + 1),
      name: `Guarantee case ${i + 1}`,
      originalId: p.id,
      clientId: p.clientId,
      jobId: p.jobId,
      userId: p.userId,
      status: i === 1 ? "Approved" : "Requested",
      date: d(-2),
      ended: d(-8),
      treatment: i === 2 ? "Billable replacement" : "Free replacement",
      eligibility: "Within guarantee",
      restart: false,
      reason: "Employment ended; client requests replacement",
      deadline: d(30),
    });
    p.ended = d(-8);
    p.status = "Employment Ended";
  }
  for (let i = 0; i < 18; i++)
    s.data.tasks.push({
      id: "ta" + (i + 1),
      name: [
        "Candidate follow-up",
        "Collect outstanding invoice",
        "Interview reminder",
      ][i % 3],
      date: d(-8),
      due: d(i - 4),
      userId: "u" + ((i % 5) + 1),
      status: i % 6 === 0 ? "Completed" : "Pending",
      priority: i % 3 ? "Normal" : "High",
      linkedKind: i % 3 === 1 ? "invoices" : "applications",
      linkedId: i % 3 === 1 ? "iv" + ((i % 12) + 1) : "a" + (i + 1),
      notes: "Local internal task",
    });
  for (let i = 0; i < 5; i++)
    ["Submissions", "Interviews", "Placements", "Net fees"].forEach(
      (targetType, k) =>
        s.data.targets.push({
          id: `tg${i}-${k}`,
          name: targetType,
          userId: "u" + (i + 1),
          date: "2026-10-01",
          due: "2026-10-31",
          targetType,
          amount: [12, 8, 3, 300000][k],
          status: "Active",
        }),
    );
  s.data.cash = [
    {
      id: "cash1",
      name: "Office operations",
      status: "Actual",
      date: d(-10),
      amount: 35000,
      category: "Operations",
      currency: "INR",
    },
    {
      id: "cash2",
      name: "Planned sourcing budget",
      status: "Forecast",
      date: d(20),
      amount: 25000,
      category: "Sourcing",
      currency: "INR",
    },
  ];
  // Chronology: each original invoice follows its genuinely confirmed joining.
  for (const j of s.data.jobs) j.date = d(-300);
  for (let i = 0; i < 12; i++) {
    const p = s.data.placements[i],
      iv = s.data.invoices[i],
      actual = addDays(iv.date, -7);
    p.actual = actual;
    p.date = actual;
    p.guaranteeEnd = addDays(actual, p.terms!.guarantee);
    s.data.joinings[i].actual = actual;
    s.data.joinings[i].expected = actual;
    s.data.offers[i].date = addDays(actual, -14);
    s.data.offers[i].response = addDays(actual, -10);
    s.data.offers[i].expected = actual;
    s.data.interviews[i].date = addDays(actual, -20);
    s.data.applications[i].date = addDays(actual, -30);
  }
  for (let i = 0; i < 80; i++) {
    const a = s.data.applications[i];
    const rank = stages.indexOf(a.stage!);
    a.history = stages
      .slice(0, rank >= 0 && rank < 9 ? rank + 1 : 1)
      .map((stage, index) => ({
        date: addDays(a.date, index),
        action: "Stage: " + stage,
        reason: "Fictional seed progression",
      }));
  }
  for (let i = 20; i < 25; i++) {
    const a = s.data.applications[i];
    a.stage = i === 22 ? "Rejected" : i === 23 ? "Withdrawn" : "Offer Sent";
    s.data.interviews.push({
      id: "int-extra" + i,
      name: "Decision round",
      applicationId: a.id,
      status: "Completed",
      date: d(-12),
      feedback: "Illustrative feedback recorded",
      recommendation: "Proceed",
      time: "11:00",
      userId: a.userId,
      duration: 45,
    });
    s.data.offers.push({
      id: "o" + (i + 1),
      name: "Offer " + (i + 1),
      applicationId: a.id,
      status: ["Sent", "Draft", "Declined", "Expired", "Sent"][i - 20],
      date: d(-5),
      salary: 1300000,
      version: 1,
      deadline: d(i === 23 ? -1 : 7),
      expected: d(15),
      reason:
        i === 22
          ? "Candidate declined"
          : i === 23
            ? "Deadline passed"
            : undefined,
    });
  }
  // A completed free replacement keeps the original slot and fee; billable treatment is explicit.
  for (const [i, caseIndex] of [
    [80, 1],
    [81, 2],
  ]) {
    const rp = s.data.replacements[caseIndex],
      original = findPlacement(rp.originalId!),
      candidateId = "ca" + (45 + caseIndex);
    const a: RecordData = {
      id: "a" + (i + 1),
      name: "Replacement application " + (caseIndex + 1),
      candidateId,
      jobId: original.jobId,
      userId: original.userId,
      replacementId: rp.id,
      stage: "Joined",
      status: "Active",
      date: d(-12),
      history: [
        {
          date: d(-12),
          action: "Replacement assigned",
          reason: "Approved contractual treatment",
        },
      ],
    };
    s.data.applications.push(a);
    s.data.offers.push({
      id: "o-r" + i,
      name: "Replacement offer",
      applicationId: a.id,
      status: "Accepted",
      date: d(-8),
      response: d(-6),
      expected: d(-1),
      salary: 1300000,
      version: 1,
    });
    s.data.joinings.push({
      id: "jo-r" + i,
      name: "Replacement joining",
      applicationId: a.id,
      offerId: "o-r" + i,
      status: "Joining Confirmed",
      date: d(-6),
      expected: d(-1),
      actual: d(-1),
    });
    const billable = caseIndex === 2;
    const p: RecordData = {
      ...original,
      id: "p-r" + i,
      name: billable ? "Billable replacement" : "Free replacement",
      applicationId: a.id,
      candidateId,
      originalId: original.id,
      replacementId: rp.id,
      date: d(-1),
      actual: d(-1),
      salary: 1300000,
      billable,
      amount: billable ? fee(original.terms!, 1300000) : 0,
      shares: [...original.shares!],
      terms: { ...original.terms! },
      status: "Active",
      ended: undefined,
    };
    s.data.placements.push(p);
    rp.status = "Fulfilled";
    rp.applicationId = a.id;
    rp.placementId = p.id;
  }
  function findPlacement(id: string) {
    return s.data.placements.find((p) => p.id === id)!;
  }
  s.data.candidates.push({
    ...s.data.candidates[0],
    id: "ca61",
    name: "Alex Sample Duplicate",
    notes: "Duplicate email seeded for reviewed merge; no applications.",
  });
  const failed: RecordData = {
    id: "a83",
    name: "Failed joining example",
    candidateId: "ca58",
    jobId: "j6",
    userId: "u2",
    stage: "Withdrawn",
    status: "Active",
    date: d(-25),
    reason: "Candidate failed to join",
  };
  s.data.applications.push(failed);
  s.data.offers.push({
    id: "o-failed",
    name: "Accepted offer — failed joining",
    applicationId: failed.id,
    date: d(-15),
    response: d(-10),
    expected: d(-3),
    status: "Accepted",
    salary: 1250000,
    version: 1,
  });
  s.data.joinings.push({
    id: "jo-failed",
    name: "Failed joining example",
    applicationId: failed.id,
    offerId: "o-failed",
    status: "Failed to Join",
    date: d(-10),
    expected: d(-3),
    reason: "No-show on planned start",
  });
  s.data.activities = [
    {
      id: "act1",
      name: "Version 1 seed restored",
      status: "Recorded",
      date: asOf,
      userId: "admin",
      notes: "All records are fictional. No external service is connected.",
    },
  ];
  return s;
}
