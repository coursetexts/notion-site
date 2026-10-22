"""Project Management curated-course seed generator."""
from _seedlib import write_seed

DESC = (
    "Frame project management as the disciplined coordination of scope, time, cost, quality, risk, "
    "stakeholders, resources, and value delivery. Topics cover selection and strategic alignment, "
    "stakeholders and chartering, requirements and work breakdown, scheduling, cost and earned value, "
    "resources, risk, quality and benefits, communication and leadership, procurement, delivery "
    "approaches, monitoring and control, project information systems, ethics, and an integrated project plan."
)

UNITS = [
    (
        "Project Management as a Discipline and Operating System",
        "Frame project management as the disciplined coordination of scope, time, cost, quality, risk, stakeholders, resources, and value delivery.",
        [
            (
                "Project versus operations",
                "Gist: Students learn why projects need different governance than ongoing operations.",
                [
                    "Temporary endeavor",
                    "Unique deliverable",
                    "Progressive elaboration",
                    "Operational handoff",
                ],
            ),
            (
                "Core constraints",
                "Gist: The discipline balances competing constraints while protecting value.",
                [
                    "Scope",
                    "Schedule",
                    "Cost",
                    "Quality",
                ],
            ),
            (
                "Lifecycle thinking",
                "Gist: Project work moves through phases, gates, feedback loops, and closure.",
                [
                    "Initiation",
                    "Planning",
                    "Execution",
                    "Monitoring and control",
                ],
            ),
        ],
    ),
    (
        "Project Selection, Business Case, and Strategic Alignment",
        "Teach students how organizations choose projects and connect them to strategy, benefits, constraints, and portfolio priorities.",
        [
            (
                "Project selection",
                "Gist: Organizations should choose projects based on value, feasibility, risk, and strategic fit.",
                [
                    "Strategic objectives",
                    "Opportunity cost",
                    "Portfolio balance",
                    "Selection criteria",
                ],
            ),
            (
                "Business case",
                "Gist: A project needs a clear reason to exist and a credible value logic.",
                [
                    "Problem statement",
                    "Benefits",
                    "Costs",
                    "Assumptions",
                ],
            ),
            (
                "Benefits management",
                "Gist: Students learn to track whether the project produces the intended outcome.",
                [
                    "Benefits owner",
                    "Leading indicators",
                    "Lagging indicators",
                    "Realization plan",
                ],
            ),
        ],
    ),
    (
        "Stakeholder Analysis, Governance, and Project Chartering",
        "Build the foundations for project authorization, decision rights, stakeholder expectations, and shared definitions of success.",
        [
            (
                "Stakeholder analysis",
                "Gist: Projects succeed or fail through people with interests, influence, expectations, and constraints.",
                [
                    "Stakeholder register",
                    "Power-interest map",
                    "User needs",
                    "Sponsor expectations",
                ],
            ),
            (
                "Governance",
                "Gist: Governance clarifies who decides, who advises, and who is accountable.",
                [
                    "Sponsor",
                    "Steering committee",
                    "RACI",
                    "Escalation path",
                ],
            ),
            (
                "Project charter",
                "Gist: The charter creates shared authorization and frames the project at the right level.",
                [
                    "Purpose",
                    "Objectives",
                    "High-level scope",
                    "Success criteria",
                ],
            ),
        ],
    ),
    (
        "Requirements, Scope Definition, and Work Breakdown Structure",
        "Show how project teams translate needs into deliverables, boundaries, acceptance criteria, and manageable work packages.",
        [
            (
                "Requirements discovery",
                "Gist: Teams must understand needs before locking deliverables.",
                [
                    "Interviews",
                    "Use cases",
                    "Acceptance criteria",
                    "Constraints",
                ],
            ),
            (
                "Scope baseline",
                "Gist: Scope discipline prevents ambiguity, uncontrolled growth, and mismatched expectations.",
                [
                    "In scope",
                    "Out of scope",
                    "Deliverables",
                    "Assumptions",
                ],
            ),
            (
                "Work breakdown structure",
                "Gist: A WBS turns complex work into assignable, estimable packages.",
                [
                    "Decomposition",
                    "Work packages",
                    "WBS dictionary",
                    "Control accounts",
                ],
            ),
        ],
    ),
    (
        "Schedule Management, CPM, PERT, and Milestones",
        "Develop scheduling skill through network logic, critical paths, uncertainty, milestones, dependencies, and schedule control.",
        [
            (
                "Activity sequencing",
                "Gist: Schedules depend on logical relationships among tasks.",
                [
                    "Dependencies",
                    "Predecessors",
                    "Successors",
                    "Leads and lags",
                ],
            ),
            (
                "Critical path methods",
                "Gist: Critical path thinking identifies which delays matter most.",
                [
                    "CPM",
                    "Float",
                    "Critical path",
                    "Schedule compression",
                ],
            ),
            (
                "Uncertainty in schedules",
                "Gist: PERT and scenario thinking help teams plan for duration uncertainty.",
                [
                    "Optimistic time",
                    "Most likely time",
                    "Pessimistic time",
                    "Milestone risk",
                ],
            ),
        ],
    ),
    (
        "Cost Estimation, Budgeting, and Earned Value Management",
        "Connect project plans to budgets, cost baselines, forecasts, variance analysis, and performance reporting.",
        [
            (
                "Estimating methods",
                "Gist: Students compare quick estimates with detailed bottom-up cost logic.",
                [
                    "Analogous estimates",
                    "Parametric estimates",
                    "Bottom-up estimates",
                    "Contingency",
                ],
            ),
            (
                "Budget baseline",
                "Gist: A budget gives the project a financial control point.",
                [
                    "Cost baseline",
                    "Management reserve",
                    "Cash flow",
                    "Cost accounts",
                ],
            ),
            (
                "Earned value",
                "Gist: EVM connects scope progress, schedule performance, and cost performance.",
                [
                    "PV",
                    "EV",
                    "AC",
                    "CPI and SPI",
                ],
            ),
        ],
    ),
    (
        "Resource Planning, Team Design, and Capacity Management",
        "Analyze how people, equipment, materials, and organizational capacity shape project feasibility and delivery.",
        [
            (
                "Resource planning",
                "Gist: Projects need realistic people, equipment, material, and expertise plans.",
                [
                    "Resource calendar",
                    "Skills matrix",
                    "Utilization",
                    "Availability",
                ],
            ),
            (
                "Team structure",
                "Gist: Team design shapes coordination speed, accountability, and decision quality.",
                [
                    "Functional teams",
                    "Matrix teams",
                    "Dedicated teams",
                    "Distributed teams",
                ],
            ),
            (
                "Capacity constraints",
                "Gist: Students learn why bottlenecks and multitasking can damage delivery.",
                [
                    "Resource leveling",
                    "Resource smoothing",
                    "Critical chain",
                    "WIP limits",
                ],
            ),
        ],
    ),
    (
        "Risk, Uncertainty, Issue, and Opportunity Management",
        "Prepare students to identify, assess, prioritize, respond to, and monitor project risk and uncertainty.",
        [
            (
                "Risk identification",
                "Gist: Risk work begins by naming uncertain events before they become surprises.",
                [
                    "Risk register",
                    "Cause-risk-effect",
                    "Assumptions log",
                    "Early warning signs",
                ],
            ),
            (
                "Risk assessment",
                "Gist: Teams prioritize risk using probability, impact, exposure, and urgency.",
                [
                    "Probability-impact matrix",
                    "Expected value",
                    "Risk appetite",
                    "Sensitivity analysis",
                ],
            ),
            (
                "Risk response",
                "Gist: Good projects plan responses and owners before disruption hits.",
                [
                    "Avoid",
                    "Mitigate",
                    "Transfer",
                    "Accept and exploit",
                ],
            ),
        ],
    ),
    (
        "Quality, Testing, Acceptance, and Benefits Realization",
        "Teach quality planning, verification, validation, acceptance, continuous improvement, and post-project value realization.",
        [
            (
                "Quality planning",
                "Gist: Quality must be designed into the project, not inspected at the end.",
                [
                    "Quality standards",
                    "Definition of done",
                    "Quality metrics",
                    "Prevention costs",
                ],
            ),
            (
                "Verification and validation",
                "Gist: Students distinguish building the thing right from building the right thing.",
                [
                    "Inspection",
                    "Testing",
                    "Validation",
                    "User acceptance",
                ],
            ),
            (
                "Closure and benefits",
                "Gist: Closure confirms acceptance and transfers value to operations.",
                [
                    "Lessons learned",
                    "Handoff",
                    "Benefits review",
                    "Post-implementation audit",
                ],
            ),
        ],
    ),
    (
        "Communication, Leadership, Negotiation, and Conflict",
        "Develop the human side of project delivery: communication rhythm, influence, team leadership, conflict, and alignment.",
        [
            (
                "Communication planning",
                "Gist: Project communication must match stakeholder needs and decision cadence.",
                [
                    "Communication matrix",
                    "Status meeting",
                    "Executive summary",
                    "Decision log",
                ],
            ),
            (
                "Leadership",
                "Gist: Project managers lead without always having formal authority.",
                [
                    "Influence",
                    "Motivation",
                    "Psychological safety",
                    "Accountability",
                ],
            ),
            (
                "Conflict and negotiation",
                "Gist: Conflict is normal when projects compete for scope, time, money, and resources.",
                [
                    "Interest-based negotiation",
                    "Tradeoffs",
                    "Escalation",
                    "Alignment",
                ],
            ),
        ],
    ),
    (
        "Procurement, Contracts, Vendors, and External Partners",
        "Explain how projects use contracts, sourcing, vendor management, procurement ethics, and supplier performance governance.",
        [
            (
                "Procurement planning",
                "Gist: Projects often depend on external partners, materials, services, or technology.",
                [
                    "Make-buy analysis",
                    "Procurement plan",
                    "Statement of work",
                    "Supplier selection",
                ],
            ),
            (
                "Contract types",
                "Gist: Contract structure shapes incentives, risk, flexibility, and control.",
                [
                    "Fixed price",
                    "Time and materials",
                    "Cost reimbursable",
                    "Incentive contracts",
                ],
            ),
            (
                "Vendor governance",
                "Gist: Teams need mechanisms to manage performance, changes, and disputes.",
                [
                    "Service levels",
                    "Deliverable review",
                    "Change orders",
                    "Supplier scorecards",
                ],
            ),
        ],
    ),
    (
        "Agile, Scrum, Kanban, Waterfall, and Hybrid Delivery",
        "Compare predictive, adaptive, and hybrid approaches and when each fits project uncertainty, product complexity, and stakeholder needs.",
        [
            (
                "Predictive delivery",
                "Gist: Waterfall approaches fit contexts where requirements and work are relatively stable.",
                [
                    "Phase gates",
                    "Baseline control",
                    "Formal signoff",
                    "Sequential planning",
                ],
            ),
            (
                "Adaptive delivery",
                "Gist: Agile approaches fit uncertainty, learning, and iterative product discovery.",
                [
                    "Scrum",
                    "Kanban",
                    "Backlog",
                    "Sprint review",
                ],
            ),
            (
                "Hybrid delivery",
                "Gist: Many real projects blend governance discipline with iterative execution.",
                [
                    "Hybrid lifecycle",
                    "Agile at scale",
                    "Stage-gate agile",
                    "Tailoring",
                ],
            ),
        ],
    ),
    (
        "Project Monitoring, Control, Reporting, and Decision Making",
        "Build control discipline through dashboards, change control, escalation, status reporting, and corrective action.",
        [
            (
                "Performance tracking",
                "Gist: Project control compares actual work against baselines and expectations.",
                [
                    "Status reports",
                    "Variance",
                    "Trend analysis",
                    "Forecasts",
                ],
            ),
            (
                "Change control",
                "Gist: Change is managed through disciplined evaluation rather than reflexive yes or no.",
                [
                    "Change request",
                    "Impact analysis",
                    "Change control board",
                    "Baseline update",
                ],
            ),
            (
                "Decision making",
                "Gist: Teams need timely decisions and clear escalation when facts change.",
                [
                    "Decision log",
                    "Issue log",
                    "Escalation triggers",
                    "Corrective action",
                ],
            ),
        ],
    ),
    (
        "Technology, Tools, Data, and Project Information Systems",
        "Use project information systems, collaboration tools, analytics, and AI responsibly to support planning and execution.",
        [
            (
                "Project tools",
                "Gist: Tools support planning, communication, collaboration, and traceability.",
                [
                    "Gantt tools",
                    "Kanban boards",
                    "Document repositories",
                    "Collaboration platforms",
                ],
            ),
            (
                "Data and dashboards",
                "Gist: Project data should improve decisions, not create reporting theater.",
                [
                    "Schedule dashboard",
                    "Risk heat map",
                    "Budget tracker",
                    "Benefits tracker",
                ],
            ),
            (
                "AI and automation",
                "Gist: AI can support drafting, summarization, risk sensing, and planning but requires human review.",
                [
                    "Prompting",
                    "Data quality",
                    "Privacy",
                    "Human accountability",
                ],
            ),
        ],
    ),
    (
        "Ethics, Sustainability, Equity, and Professional Practice",
        "Examine professional responsibility, fairness, safety, sustainability, transparency, and accountability in project decisions.",
        [
            (
                "Professional ethics",
                "Gist: Project managers handle truth, tradeoffs, pressure, and public consequences.",
                [
                    "Transparency",
                    "Conflict of interest",
                    "Honest reporting",
                    "Duty of care",
                ],
            ),
            (
                "Sustainability",
                "Gist: Projects should consider environmental, social, and long-term operational impacts.",
                [
                    "Lifecycle impacts",
                    "Waste",
                    "Carbon",
                    "Responsible procurement",
                ],
            ),
            (
                "Inclusive practice",
                "Gist: Good project management includes affected people in design, implementation, and review.",
                [
                    "Accessibility",
                    "Equity lens",
                    "Community impact",
                    "Stakeholder voice",
                ],
            ),
        ],
    ),
    (
        "Capstone: Integrated Project Plan and Executive Review",
        "Synthesize the course through a complete project plan, risk and stakeholder strategy, schedule, budget, governance, and executive presentation.",
        [
            (
                "Integrated plan",
                "Gist: Students combine the full planning toolkit into one coherent project baseline.",
                [
                    "Charter",
                    "Scope and WBS",
                    "Schedule",
                    "Budget",
                ],
            ),
            (
                "Risk and stakeholder strategy",
                "Gist: The capstone tests whether students can manage human and uncertainty dimensions together.",
                [
                    "Stakeholder plan",
                    "Risk register",
                    "Communication plan",
                    "Governance model",
                ],
            ),
            (
                "Executive review",
                "Gist: Students present tradeoffs and decisions in a concise executive-ready format.",
                [
                    "Business case",
                    "Dashboard",
                    "Recommendation",
                    "Lessons learned",
                ],
            ),
        ],
    ),
]


if __name__ == "__main__":
    write_seed(
        "project-management",
        "Project Management",
        DESC,
        "c7d8e9f0-1a2b-4c49-8d99-9e0f1a2b3c19",
        "pmgtjson",
        UNITS,
        "project_management",
    )
