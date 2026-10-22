"""Procurement and Sourcing curated-course seed generator."""
from _seedlib import write_seed

DESC = (
    "The syllabus includes category management, market intelligence, total cost of ownership, RFx "
    "design, negotiation game planning, contract governance, global trade risk, responsible sourcing, "
    "digital procurement, supplier development, and a full strategic sourcing capstone."
)

UNITS = [
    (
        "Procurement and Strategic Sourcing as a Supply Chain Value System",
        "Position procurement as a strategic capability that shapes cost, risk, innovation, resilience, sustainability, and customer value across the supply chain.",
        [
            (
                "Procurement's strategic role",
                "This subtopic reframes procurement from transaction handling into a leadership function that can shape enterprise outcomes.",
                [
                    "Cost, quality, service, risk, innovation, and ESG value",
                    "Procurement's links to operations, finance, legal, engineering, and sustainability",
                    "Source-to-pay versus strategic sourcing",
                    "Procurement as a supply-chain coordination function",
                ],
            ),
            (
                "Supply-chain value architecture",
                "Students learn how sourcing decisions influence the wider supply chain, not just the price paid to a vendor.",
                [
                    "Plan-source-make-deliver-return logic",
                    "Supplier tiering and upstream dependencies",
                    "Cost-service-resilience tradeoffs",
                    "Value stream and process mapping",
                ],
            ),
            (
                "Governance and maturity",
                "Procurement maturity models help students diagnose whether an organization is reactive, controlled, strategic, or transformational.",
                [
                    "Policy, delegation of authority, and approval thresholds",
                    "Center-led, centralized, decentralized, and hybrid models",
                    "Procurement KPIs and scorecards",
                    "Stakeholder trust and service-level expectations",
                ],
            ),
        ],
    ),
    (
        "Purchasing Process, Procure-to-Pay, and Procurement Operating Models",
        "Build fluency in the process architecture that turns business needs into compliant purchases, payment, controls, and measurable service.",
        [
            (
                "Purchasing workflow",
                "The basic workflow shows how business requests become purchase orders, receipts, invoices, and payment.",
                [
                    "Requisitions and approvals",
                    "Purchase orders and blanket orders",
                    "Receiving, three-way match, and invoice handling",
                    "Exception management and cycle-time control",
                ],
            ),
            (
                "Procure-to-pay controls",
                "Controls protect the organization from fraud, maverick spend, policy violations, and weak financial discipline.",
                [
                    "Segregation of duties",
                    "Preferred supplier and catalog compliance",
                    "Audit trails and documentation",
                    "Fraud red flags and internal control testing",
                ],
            ),
            (
                "Operating models and service design",
                "Operating model choices determine how procurement serves business units while maintaining consistency and expertise.",
                [
                    "Category teams and business partnering",
                    "Shared services and help desks",
                    "Centers of excellence",
                    "Service-level agreements and intake channels",
                ],
            ),
        ],
    ),
    (
        "Spend Analysis, Category Management, and Opportunity Assessment",
        "Use data to understand what the organization buys, who it buys from, where value leaks occur, and which categories deserve focused sourcing attention.",
        [
            (
                "Spend visibility",
                "Spend visibility is the evidence base for nearly every serious sourcing decision.",
                [
                    "Data extraction and cleansing",
                    "Supplier normalization",
                    "Commodity and UNSPSC-style classification",
                    "Tail spend and maverick spend",
                ],
            ),
            (
                "Category strategy",
                "Category management groups purchases into markets with similar suppliers, demand patterns, risks, and value levers.",
                [
                    "Category profiling",
                    "Demand analysis and stakeholder mapping",
                    "Kraljic-style portfolio thinking",
                    "Strategic, leverage, bottleneck, and routine categories",
                ],
            ),
            (
                "Opportunity assessment",
                "Opportunity assessment helps prioritize sourcing work by value, feasibility, urgency, and organizational readiness.",
                [
                    "Baseline spend and savings logic",
                    "Price, demand, specification, process, and compliance levers",
                    "Savings validation with finance",
                    "Opportunity pipeline and wave planning",
                ],
            ),
        ],
    ),
    (
        "Supplier Markets, Market Intelligence, and Make-Buy Decisions",
        "Analyze supply markets, industry structure, supplier economics, and internal capability choices before launching sourcing work.",
        [
            (
                "Supply-market analysis",
                "Students learn to read supplier markets before assuming competition, capacity, or price power exists.",
                [
                    "Supplier landscape and market concentration",
                    "Porter's five forces for supply markets",
                    "Capacity, lead time, and technology trends",
                    "Commodity indices and market signals",
                ],
            ),
            (
                "Supplier economics",
                "Understanding supplier economics helps buyers negotiate realistically and build offers that can be sustained.",
                [
                    "Cost structure and margin logic",
                    "Fixed versus variable cost",
                    "Learning curves and scale effects",
                    "Supplier financial health",
                ],
            ),
            (
                "Make-buy and outsourcing choices",
                "Make-buy decisions clarify what should remain internal, what can be outsourced, and what capabilities require close governance.",
                [
                    "Core competence and strategic control",
                    "Transaction-cost economics",
                    "Capacity, quality, and intellectual property concerns",
                    "Outsourcing, insourcing, and co-sourcing models",
                ],
            ),
        ],
    ),
    (
        "Requirements, Specifications, and Total Cost of Ownership",
        "Translate stakeholder needs into clear specifications and complete cost models that support smarter commercial decisions.",
        [
            (
                "Requirements discovery",
                "Good sourcing starts with understanding the real business need, not merely repeating last year's specification.",
                [
                    "Voice of stakeholder and voice of customer",
                    "Functional versus technical requirements",
                    "Service levels and performance outcomes",
                    "Demand management and standardization",
                ],
            ),
            (
                "Specification strategy",
                "Specification choices influence competition, innovation, cost, and supplier accountability.",
                [
                    "Design specifications",
                    "Performance specifications",
                    "Statements of work",
                    "Specification lock-in and over-specification",
                ],
            ),
            (
                "Total cost of ownership",
                "TCO prevents teams from mistaking the lowest unit price for the best business decision.",
                [
                    "Acquisition, operating, maintenance, logistics, quality, and disposal costs",
                    "Switching costs and transition costs",
                    "Landed cost and tariff effects",
                    "Cost sensitivity and scenario analysis",
                ],
            ),
        ],
    ),
    (
        "Supplier Identification, Qualification, and Selection",
        "Develop disciplined methods for finding, screening, evaluating, and selecting suppliers that fit cost, quality, risk, and strategic goals.",
        [
            (
                "Supplier discovery",
                "Supplier discovery builds the candidate pool and determines whether the organization sees the full market.",
                [
                    "Incumbents and challengers",
                    "Supplier databases and industry networks",
                    "Diverse and local supplier discovery",
                    "Long lists, short lists, and market sounding",
                ],
            ),
            (
                "Qualification and due diligence",
                "Qualification verifies whether suppliers are capable, compliant, financially sound, and aligned with risk expectations.",
                [
                    "Financial, operational, quality, and capacity checks",
                    "Cyber, data, and privacy review",
                    "Sanctions, legal, and ethical screening",
                    "Site visits, audits, and references",
                ],
            ),
            (
                "Selection methods",
                "Selection turns qualitative and quantitative evidence into defensible award decisions.",
                [
                    "Weighted scoring models",
                    "Technical and commercial evaluation",
                    "Best-value versus lowest-price selection",
                    "Consensus scoring and decision governance",
                ],
            ),
        ],
    ),
    (
        "RFx, Auctions, Bid Evaluation, and Source-to-Contract",
        "Learn the formal sourcing tools used to invite competition, compare offers fairly, and move from market engagement to award decisions.",
        [
            (
                "RFx design",
                "RFx tools structure supplier communication and competition, but each format has a different purpose.",
                [
                    "Request for information",
                    "Request for proposal",
                    "Request for quotation",
                    "Request for tender and sealed bids",
                ],
            ),
            (
                "Competitive event mechanics",
                "Students learn when competition improves outcomes and when it can damage quality, trust, or supply security.",
                [
                    "Bid calendars and bidder conferences",
                    "Clarifications and addenda",
                    "Reverse auctions",
                    "Fairness, confidentiality, and conflict of interest controls",
                ],
            ),
            (
                "Source-to-contract execution",
                "Source-to-contract is the disciplined handoff from sourcing strategy to award, contracting, and implementation.",
                [
                    "Bid evaluation matrices",
                    "Award scenarios and optimization",
                    "Negotiation down-selects",
                    "Contract handoff and implementation planning",
                ],
            ),
        ],
    ),
    (
        "Negotiation Strategy, Game Planning, and Supplier Economics",
        "Prepare sourcing negotiations through interests, alternatives, cost drivers, power, ethics, and relationship goals.",
        [
            (
                "Negotiation preparation",
                "Preparation determines the quality of the conversation before the first meeting happens.",
                [
                    "Interests, positions, and objectives",
                    "BATNA and walk-away points",
                    "Issue lists and concession planning",
                    "Stakeholder alignment and negotiation mandate",
                ],
            ),
            (
                "Commercial negotiation tactics",
                "Students practice concrete tactics while learning to avoid manipulative or unethical behavior.",
                [
                    "Anchoring and framing",
                    "Package trades and logrolling",
                    "Should-cost arguments",
                    "Multi-round negotiation strategy",
                ],
            ),
            (
                "Relationship and cross-cultural negotiation",
                "Procurement negotiations must often preserve long-term collaboration while still defending business interests.",
                [
                    "Trust, credibility, and tone",
                    "Cultural differences in negotiation norms",
                    "Difficult conversations and impasse management",
                    "Ethics, transparency, and documentation",
                ],
            ),
        ],
    ),
    (
        "Contracts, Commercial Terms, Risk Allocation, and Compliance",
        "Understand how procurement agreements convert sourcing decisions into enforceable obligations, protections, incentives, and governance.",
        [
            (
                "Contract structure",
                "Students learn the anatomy of procurement agreements so they can read risks and obligations intelligently.",
                [
                    "Master service agreements",
                    "Statements of work",
                    "Purchase terms and conditions",
                    "Order of precedence and exhibits",
                ],
            ),
            (
                "Commercial and legal terms",
                "Commercial terms allocate money, timing, risk, accountability, and remedies across the buyer-supplier relationship.",
                [
                    "Pricing, payment, indexation, and escalation",
                    "Service levels and warranties",
                    "Limitation of liability and indemnity",
                    "Termination, renewal, and change control",
                ],
            ),
            (
                "Compliance and contract governance",
                "Governance keeps the contract alive after signature and reduces disputes, leakage, and compliance failures.",
                [
                    "Contract lifecycle management",
                    "Delegation, approval, and records retention",
                    "Regulatory and audit obligations",
                    "Dispute resolution and escalation paths",
                ],
            ),
        ],
    ),
    (
        "Supplier Relationship Management and Supplier Performance",
        "Move beyond award decisions into performance management, collaboration, issue resolution, and value creation across supplier relationships.",
        [
            (
                "Supplier segmentation",
                "Not every supplier relationship deserves the same management model; segmentation directs attention where it matters most.",
                [
                    "Strategic, preferred, transactional, and emerging suppliers",
                    "Spend, risk, innovation, and dependency criteria",
                    "Tiered governance",
                    "Relationship charters",
                ],
            ),
            (
                "Performance management",
                "Performance management converts expectations into metrics, reviews, corrective actions, and improvement work.",
                [
                    "Supplier scorecards",
                    "OTIF, quality, cost, responsiveness, and innovation metrics",
                    "Quarterly business reviews",
                    "Corrective and preventive action",
                ],
            ),
            (
                "Collaboration and value creation",
                "Strong supplier relationships can unlock innovation, resilience, and process improvements that competitive bidding alone cannot create.",
                [
                    "Joint business planning",
                    "Supplier innovation days",
                    "Cost reduction workshops",
                    "Gainsharing and collaborative improvement",
                ],
            ),
        ],
    ),
    (
        "Global Sourcing, Logistics Interfaces, and Trade/Geopolitical Risk",
        "Connect sourcing choices to trade rules, country risk, logistics constraints, Incoterms, currency, and geopolitical exposure.",
        [
            (
                "Global sourcing strategy",
                "Global sourcing expands options but introduces distance, uncertainty, compliance obligations, and coordination costs.",
                [
                    "Offshoring, nearshoring, reshoring, and friend-shoring",
                    "Country and supplier-country analysis",
                    "Currency and inflation exposure",
                    "Global category strategy",
                ],
            ),
            (
                "Trade and logistics interface",
                "Procurement decisions must account for how goods physically and legally move across borders.",
                [
                    "Incoterms and transfer of responsibility",
                    "Customs documentation and classification",
                    "Duties, tariffs, and landed cost",
                    "Freight mode, lead time, and port risk",
                ],
            ),
            (
                "Geopolitical and disruption risk",
                "Students learn to connect sourcing maps with events that can interrupt supply or change total cost suddenly.",
                [
                    "Sanctions and export controls",
                    "Political instability and trade disputes",
                    "Natural disasters and climate exposure",
                    "Dual sourcing and regional redundancy",
                ],
            ),
        ],
    ),
    (
        "Ethical, Sustainable, Diverse, and Responsible Sourcing",
        "Integrate labor standards, environmental impact, supplier diversity, traceability, and responsible business conduct into sourcing decisions.",
        [
            (
                "Responsible sourcing principles",
                "Responsible sourcing asks procurement to account for the people, communities, and ecosystems behind purchased goods and services.",
                [
                    "Human rights and labor standards",
                    "Forced-labor and child-labor due diligence",
                    "Anti-corruption and gifts policies",
                    "Responsible business conduct frameworks",
                ],
            ),
            (
                "Sustainable procurement",
                "Sustainable procurement links supplier choices to emissions, materials, waste, circularity, and lifecycle impact.",
                [
                    "Scope 3 emissions and supplier data",
                    "Circular economy and reuse",
                    "Packaging, waste, and water impacts",
                    "Life-cycle thinking and eco-labels",
                ],
            ),
            (
                "Supplier diversity and inclusion",
                "Supplier diversity expands economic opportunity while strengthening market access, innovation, and community impact.",
                [
                    "Diverse supplier certification",
                    "Inclusive sourcing targets",
                    "Second-tier diversity reporting",
                    "Capacity building and fair access",
                ],
            ),
        ],
    ),
    (
        "Procurement Analytics, Cost Modeling, and Digital Procurement",
        "Use analytical models, digital platforms, automation, and dashboards to improve spend visibility, sourcing decisions, and procurement execution.",
        [
            (
                "Cost and price analytics",
                "Analytics equips students to challenge quotes, explain cost movements, and build evidence-based recommendations.",
                [
                    "Should-cost modeling",
                    "Price variance analysis",
                    "Index-based pricing",
                    "Regression and benchmarking",
                ],
            ),
            (
                "Digital procurement platforms",
                "Digital platforms coordinate sourcing, contracting, supplier data, buying channels, and performance management.",
                [
                    "eSourcing tools",
                    "Contract lifecycle management",
                    "Supplier information management",
                    "Procure-to-pay and ERP integration",
                ],
            ),
            (
                "Automation, AI, and dashboards",
                "Modern procurement increasingly depends on decision support, automation, and control-tower visibility.",
                [
                    "Spend dashboards and savings trackers",
                    "Risk monitoring feeds",
                    "Process mining and automation",
                    "Generative AI use cases and governance",
                ],
            ),
        ],
    ),
    (
        "Risk, Resilience, Continuity, and Supplier Development",
        "Identify supplier and supply-market vulnerabilities, design continuity plans, and develop suppliers when market capability is strategically important.",
        [
            (
                "Supplier risk management",
                "Supplier risk management identifies where dependence, fragility, or misconduct could damage the organization.",
                [
                    "Financial, operational, quality, cyber, ESG, and geopolitical risk",
                    "Critical supplier mapping",
                    "Risk scoring and heat maps",
                    "Early-warning indicators",
                ],
            ),
            (
                "Continuity and resilience planning",
                "Resilience planning prepares the organization to absorb disruption and recover service faster.",
                [
                    "Business continuity plans",
                    "Safety stock and buffer capacity",
                    "Alternate suppliers and substitution plans",
                    "Scenario planning and stress testing",
                ],
            ),
            (
                "Supplier development",
                "When markets cannot immediately provide the required capability, buyers may need to help suppliers improve.",
                [
                    "Capability assessments",
                    "Joint improvement roadmaps",
                    "Quality and process development",
                    "Exit, remediation, and escalation decisions",
                ],
            ),
        ],
    ),
    (
        "Capstone: Strategic Sourcing Project and Executive Recommendation",
        "Apply the course end-to-end by diagnosing a category, building a sourcing strategy, evaluating options, and presenting an executive recommendation.",
        [
            (
                "Category diagnosis",
                "The capstone begins with evidence: spend, demand, market structure, supplier performance, risk, and stakeholder needs.",
                [
                    "Problem statement and scope",
                    "Baseline spend and demand profile",
                    "Supplier and market analysis",
                    "Stakeholder interviews",
                ],
            ),
            (
                "Sourcing strategy and business case",
                "Students synthesize analysis into a sourcing strategy that is credible, quantified, and implementable.",
                [
                    "Sourcing levers and scenario options",
                    "Savings and value model",
                    "Risk and sustainability implications",
                    "Implementation timeline and governance",
                ],
            ),
            (
                "Executive recommendation",
                "The final recommendation develops the communication discipline needed to persuade senior decision makers.",
                [
                    "Executive summary and decision ask",
                    "Evidence-backed tradeoffs",
                    "Supplier award or negotiation plan",
                    "Implementation risks and next steps",
                ],
            ),
        ],
    ),
]


if __name__ == "__main__":
    write_seed(
        "procurement-and-sourcing",
        "Procurement and Sourcing",
        DESC,
        "b6c7d8e9-0f1a-4b48-9c88-8d9e0f1a2b08",
        "procjson",
        UNITS,
        "procurement_and_sourcing",
    )
