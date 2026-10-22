"""Producing curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "Students begin by understanding the producer as the person who protects the project: "
    "creatively, financially, legally, logistically, and ethically."
)

UNITS = [
    (
        "The Producer's Role, Creative Authority, Ethics, and Leadership",
        "Students begin by understanding the producer as the person who protects the project: creatively, financially, legally, logistically, and ethically.",
        [
            (
                "Producer identities and functions",
                "This clarifies the differences among creative, line, executive, associate, and impact producers.",
                [
                    "Creative producer",
                    "Line producer",
                    "Executive producer",
                    "Impact producer",
                ],
            ),
            (
                "Decision-making and accountability",
                "Students learn how producers make tradeoffs while protecting story, people, money, and deadlines.",
                [
                    "Greenlight logic",
                    "Risk ownership",
                    "Stakeholder trust",
                    "Ethical leadership",
                ],
            ),
            (
                "Producing culture",
                "The course frames producing as the creation of humane, effective working conditions.",
                [
                    "Communication norms",
                    "Inclusion",
                    "Conflict resolution",
                    "Professional conduct",
                ],
            ),
        ],
    ),
    (
        "Development, Acquiring Material, Rights, and Script Evaluation",
        "Producing starts before production: finding material, evaluating its promise, and shaping it into a viable project.",
        [
            (
                "Finding and acquiring material",
                "Students learn how stories enter a producer's pipeline and what rights must be secured.",
                [
                    "Original concepts",
                    "Options",
                    "Underlying rights",
                    "Chain of title",
                ],
            ),
            (
                "Script and project coverage",
                "Students practice assessing artistic quality, audience fit, budget level, and production feasibility.",
                [
                    "Logline",
                    "Synopsis",
                    "Coverage",
                    "Rewrite notes",
                ],
            ),
            (
                "Development strategy",
                "This subtopic connects creative notes to packaging, financing, and realistic next steps.",
                [
                    "Development slate",
                    "Writers and directors",
                    "Proof of concept",
                    "Development budget",
                ],
            ),
        ],
    ),
    (
        "Packaging, Talent, Attachments, and Creative Team Building",
        "Packaging turns a script or concept into a project others can understand, fund, schedule, and trust.",
        [
            (
                "Creative team assembly",
                "Students learn to choose collaborators whose skills and values match the project.",
                [
                    "Director fit",
                    "Writer relationship",
                    "Department heads",
                    "Advisor network",
                ],
            ),
            (
                "Talent attachments",
                "This subtopic explains how cast, director, producers, and credibility affect financing and market interest.",
                [
                    "Casting strategy",
                    "Letters of intent",
                    "Representation",
                    "Availability",
                ],
            ),
            (
                "Pitch materials",
                "Students build materials that communicate both creative promise and practical seriousness.",
                [
                    "Decks",
                    "Lookbooks",
                    "Sizzles",
                    "Comparable titles",
                ],
            ),
        ],
    ),
    (
        "Budgeting, Cost Control, Cash Flow, and Production Accounting",
        "A producer must know how money becomes time, people, locations, equipment, post, deliverables, and risk.",
        [
            (
                "Budget structure",
                "Students learn the grammar of above-the-line, below-the-line, post, insurance, contingency, and fringes.",
                [
                    "ATL/BTL",
                    "Contingency",
                    "Fringes",
                    "Production fee",
                ],
            ),
            (
                "Cost reporting",
                "This subtopic turns budgets into live management tools during prep, shoot, and post.",
                [
                    "Actuals",
                    "Purchase orders",
                    "Petty cash",
                    "Cost reports",
                ],
            ),
            (
                "Cash flow",
                "Students learn why timing of funds matters as much as total funds.",
                [
                    "Draw schedules",
                    "Milestone payments",
                    "Payroll timing",
                    "Reserves",
                ],
            ),
        ],
    ),
    (
        "Scheduling, Breakdowns, Logistics, and Production Management",
        "Scheduling is creative strategy in operational form: the plan that makes the movie possible.",
        [
            (
                "Script breakdowns",
                "Students identify every resource the production needs before it becomes a crisis.",
                [
                    "Cast",
                    "Locations",
                    "Props",
                    "Vehicles",
                    "Special effects",
                ],
            ),
            (
                "Scheduling logic",
                "This subtopic balances cast, locations, company moves, daylight, overtime, and story priorities.",
                [
                    "Stripboards",
                    "One-line schedule",
                    "Company moves",
                    "Hold days",
                ],
            ),
            (
                "Logistics and operations",
                "Students learn how housing, transport, meals, permits, equipment, and communication keep production moving.",
                [
                    "Travel",
                    "Catering",
                    "Equipment",
                    "Basecamp",
                ],
            ),
        ],
    ),
    (
        "Financing, Fundraising, Grants, Incentives, and Investor Relations",
        None,
        [
            (
                "Finance structures",
                "Students compare independent, studio, grant, equity, debt, presale, and soft-money approaches.",
                [
                    "Equity",
                    "Debt",
                    "Presales",
                    "Tax incentives",
                ],
            ),
            (
                "Fundraising and grants",
                "This subtopic teaches students to communicate value to supporters, labs, institutions, and communities.",
                [
                    "Grant narratives",
                    "Fiscal sponsorship",
                    "Crowdfunding",
                    "Pitch meetings",
                ],
            ),
            (
                "Investor relations",
                "Students learn the producer's obligations to transparency, reporting, recoupment, and realistic expectations.",
                [
                    "Investor decks",
                    "Waterfalls",
                    "Reporting",
                    "Risk disclosure",
                ],
            ),
        ],
    ),
    (
        "Legal, Contracts, Unions, Insurance, Permits, and Risk Management",
        "Producers keep productions from being undone by preventable legal and safety failures.",
        [
            (
                "Contracts and releases",
                "Students learn the basic documents that protect rights, labor, locations, music, and likenesses.",
                [
                    "Deal memos",
                    "Appearance releases",
                    "Location agreements",
                    "Music licenses",
                ],
            ),
            (
                "Unions and labor rules",
                "This subtopic introduces union jurisdiction, work rules, payroll, and professional obligations.",
                [
                    "SAG-AFTRA",
                    "DGA context",
                    "IATSE context",
                    "Meal penalties",
                ],
            ),
            (
                "Insurance and compliance",
                "Students connect insurance, permits, safety, and risk assessment to daily decisions.",
                [
                    "General liability",
                    "Workers compensation",
                    "Errors and omissions",
                    "Permits",
                ],
            ),
        ],
    ),
    (
        "Hiring, Crewing, Culture, Safety, Accessibility, and Inclusion",
        "Producers shape the working environment, and that environment shapes the quality and ethics of the work.",
        [
            (
                "Crew hiring and roles",
                "Students learn how to hire by skill, availability, fit, and production need.",
                [
                    "Job descriptions",
                    "References",
                    "Rates",
                    "Crew hierarchy",
                ],
            ),
            (
                "Set culture and inclusion",
                "This subtopic treats inclusion as production practice, not a slogan.",
                [
                    "Anti-harassment",
                    "Accessibility",
                    "Language access",
                    "Inclusive casting and hiring",
                ],
            ),
            (
                "Safety and care",
                "Students learn to anticipate physical, emotional, intimacy, stunt, and location risks.",
                [
                    "Safety meetings",
                    "Intimacy coordination",
                    "Stunts",
                    "Weather and fatigue",
                ],
            ),
        ],
    ),
    (
        "Pre-Production Workflow, Documents, Communication, and Tech Tools",
        "The producer's prep system is what lets creative teams work quickly without losing clarity.",
        [
            (
                "Production documents",
                "Students assemble the core paperwork used by professional productions.",
                [
                    "Call sheets",
                    "Contact sheets",
                    "Sides",
                    "Production reports",
                ],
            ),
            (
                "Communication systems",
                "This subtopic teaches meeting rhythm, approvals, version control, and decision tracking.",
                [
                    "Prep meetings",
                    "Status reports",
                    "Decision logs",
                    "Shared drives",
                ],
            ),
            (
                "Production software and templates",
                "Students use tools as systems for accountability, not as decoration.",
                [
                    "Scheduling tools",
                    "Budget templates",
                    "Shot lists",
                    "Asset tracking",
                ],
            ),
        ],
    ),
    (
        "Production Execution, Set Operations, Problem-Solving, and Leadership",
        "Production days test whether the producer can protect the work while handling pressure calmly.",
        [
            (
                "Daily operations",
                "Students learn how set work is coordinated through the AD team, producers, department heads, and reports.",
                [
                    "Call time",
                    "Moves",
                    "Meal breaks",
                    "Wrap reports",
                ],
            ),
            (
                "Producer problem-solving",
                "This subtopic builds judgment under time, cost, weather, people, and equipment constraints.",
                [
                    "Triage",
                    "Escalation",
                    "Creative alternatives",
                    "Contingency use",
                ],
            ),
            (
                "Leadership under pressure",
                "Students practice clear, non-panicked communication that keeps trust intact.",
                [
                    "Briefing",
                    "Conflict mediation",
                    "Feedback loops",
                    "Morale",
                ],
            ),
        ],
    ),
    (
        "Post-Production Producing: Editorial, Sound, Color, VFX, and Deliverables",
        "Post-production is where the producer protects the final work, budget, schedule, and delivery obligations.",
        [
            (
                "Editorial workflow",
                "Students learn the producer's role in rough cuts, notes, turnovers, and picture lock.",
                [
                    "Assembly",
                    "Rough cut",
                    "Fine cut",
                    "Picture lock",
                ],
            ),
            (
                "Finishing workflow",
                "This subtopic covers sound, music, color, VFX, titles, captions, and quality control.",
                [
                    "Sound mix",
                    "Color grade",
                    "VFX tracking",
                    "QC",
                ],
            ),
            (
                "Deliverables",
                "Students learn that distribution requires technical, legal, marketing, and archival materials.",
                [
                    "Masters",
                    "Stems",
                    "Captions",
                    "E&O packet",
                ],
            ),
        ],
    ),
    (
        "Distribution, Festivals, Sales, Marketing, PR, and Audience Strategy",
        "A finished project only matters if it reaches the right audience through a realistic strategy.",
        [
            (
                "Festival and sales strategy",
                "Students map premiere status, deadlines, sales agents, distributors, and audience goals.",
                [
                    "Premiere tiers",
                    "FilmFreeway",
                    "Sales agents",
                    "Market screenings",
                ],
            ),
            (
                "Marketing and PR",
                "This subtopic connects positioning, assets, press, social, and earned media.",
                [
                    "Key art",
                    "Trailer",
                    "Press kit",
                    "Media pitching",
                ],
            ),
            (
                "Audience and impact",
                "Students plan release pathways around communities, platforms, partnerships, and measurable goals.",
                [
                    "Target audience",
                    "Partnerships",
                    "Impact campaign",
                    "Metrics",
                ],
            ),
        ],
    ),
    (
        "Business Models, Media Industries, Streaming, and Entrepreneurship",
        "Students need a producer's map of the industry: who pays, who owns, who distributes, and who benefits.",
        [
            (
                "Industry landscape",
                "This subtopic explains studios, streamers, independents, agencies, festivals, and platforms.",
                [
                    "Studios",
                    "Streamers",
                    "Agencies",
                    "Independent sector",
                ],
            ),
            (
                "Revenue models",
                "Students compare theatrical, VOD, AVOD, SVOD, educational, broadcast, branded, and live-event models.",
                [
                    "Licensing",
                    "Minimum guarantees",
                    "Windows",
                    "Ancillaries",
                ],
            ),
            (
                "Producer entrepreneurship",
                "Students learn how producers build sustainable slates, companies, and communities.",
                [
                    "Slate planning",
                    "Brand identity",
                    "Partnerships",
                    "Sustainable practice",
                ],
            ),
        ],
    ),
    (
        "Documentary, Nonfiction, Impact Producing, and Community Accountability",
        "Nonfiction producing adds distinctive responsibilities around access, consent, care, evidence, and impact.",
        [
            (
                "Documentary development",
                "Students learn how nonfiction projects evolve through access, research, footage, and character arcs.",
                [
                    "Research",
                    "Access agreements",
                    "Character tracking",
                    "Archival needs",
                ],
            ),
            (
                "Ethics and accountability",
                "This subtopic examines power between producers, subjects, communities, funders, and audiences.",
                [
                    "Consent",
                    "Vulnerability",
                    "Participant care",
                    "Editorial independence",
                ],
            ),
            (
                "Impact producing",
                "Students design campaigns that connect films to change without oversimplifying social issues.",
                [
                    "Impact partners",
                    "Screening guides",
                    "Advocacy strategy",
                    "Evaluation",
                ],
            ),
        ],
    ),
    (
        "Capstone Production, Pitch, Public Screening, and Portfolio Pathways",
        "The course culminates in a produced project or full producer package that demonstrates readiness for advanced production work.",
        [
            (
                "Producer capstone package",
                "Students synthesize development, budgeting, scheduling, finance, legal, production, post, and distribution.",
                [
                    "Producer statement",
                    "Budget",
                    "Schedule",
                    "Risk plan",
                ],
            ),
            (
                "Pitch and critique",
                "This subtopic uses best-school critique practice to refine the project through feedback.",
                [
                    "Pitch deck",
                    "Verbal pitch",
                    "Peer critique",
                    "Revision memo",
                ],
            ),
            (
                "Public presentation and next steps",
                "Students leave with a plan for festivals, labs, grants, production roles, or a next project.",
                [
                    "Screening",
                    "Portfolio",
                    "Festival strategy",
                    "Next slate",
                ],
            ),
        ],
    ),
]

write_seed(
    "producing",
    "Producing",
    DESC,
    "e5f6a7b8-9c0d-4e50-9a90-0b1c2d3e4f50",
    "prodjson",
    UNITS,
    "producing",
)
