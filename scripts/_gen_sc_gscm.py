"""Global Supply Chain Management curated-course seed generator."""
from _seedlib import write_seed

DESC = (
    "Frame global supply chains as networks that connect strategy, demand, sourcing, "
    "production, logistics, service, finance, risk, technology, and sustainability. "
    "Topics study network design, trade and geopolitics, demand planning, inventory, "
    "procurement, manufacturing, logistics, fulfillment, information systems, analytics, "
    "risk, sustainability, performance, ethics, and a strategy capstone."
)

UNITS = [
    (
        "Global Supply Chain Management as End-to-End Strategy",
        "Frame global supply chains as networks that connect strategy, demand, sourcing, production, logistics, service, finance, risk, technology, and sustainability.",
        [
            (
                "End-to-end view",
                "Gist: Students learn to see supply chains as coordinated systems rather than isolated functions.",
                [
                    "Plan, source, make, deliver, return",
                    "Cross-functional tradeoffs",
                    "Customer promise",
                    "Operating model",
                ],
            ),
            (
                "Global strategic role",
                "Gist: Supply chains shape competitive advantage through speed, cost, resilience, flexibility, and market access.",
                [
                    "Cost leadership",
                    "Responsiveness",
                    "Global footprint",
                    "Service differentiation",
                ],
            ),
            (
                "Supply-chain stakeholders",
                "Gist: Global networks involve suppliers, customers, governments, logistics providers, platforms, communities, and investors.",
                [
                    "Internal functions",
                    "Tiered suppliers",
                    "3PLs and carriers",
                    "Regulators",
                ],
            ),
        ],
    ),
    (
        "Supply Chain Network Design and Location Decisions",
        "Study how firms design facility, supplier, customer, and transportation networks across regions and markets.",
        [
            (
                "Network structure",
                "Gist: Network design determines where work happens and how goods, information, and cash move.",
                [
                    "Plants",
                    "Distribution centers",
                    "Supplier nodes",
                    "Customer zones",
                ],
            ),
            (
                "Location drivers",
                "Gist: Location decisions balance demand, labor, tariffs, infrastructure, risk, skills, and proximity.",
                [
                    "Nearshoring",
                    "Offshoring",
                    "Regionalization",
                    "Total landed cost",
                ],
            ),
            (
                "Network modeling",
                "Gist: Students learn how models translate strategy into location, capacity, and flow choices.",
                [
                    "Facility location",
                    "Scenario analysis",
                    "Optimization",
                    "Sensitivity testing",
                ],
            ),
        ],
    ),
    (
        "Global Trade, Geopolitics, and Regulatory Environment",
        "Understand how trade rules, customs, sanctions, tariffs, geopolitics, and institutions shape global supply-chain decisions.",
        [
            (
                "Trade mechanics",
                "Gist: Global supply chains require literacy in customs, documentation, duties, and trade terms.",
                [
                    "Incoterms",
                    "Customs clearance",
                    "Harmonized codes",
                    "Rules of origin",
                ],
            ),
            (
                "Geopolitical risk",
                "Gist: Political conflict, sanctions, export controls, and industrial policy can reshape networks quickly.",
                [
                    "Tariffs",
                    "Sanctions",
                    "Export controls",
                    "Friend-shoring",
                ],
            ),
            (
                "Institutional context",
                "Gist: Students connect country performance and infrastructure to logistics feasibility.",
                [
                    "World Bank LPI",
                    "Port performance",
                    "Trade agreements",
                    "Regulatory quality",
                ],
            ),
        ],
    ),
    (
        "Demand Planning, Forecasting, and S&OP",
        "Build the planning foundation for matching demand, supply, inventory, capacity, and financial targets.",
        [
            (
                "Forecasting basics",
                "Gist: Forecasts are imperfect but essential for capacity, inventory, procurement, and financial plans.",
                [
                    "Time series",
                    "Causal drivers",
                    "Forecast error",
                    "Bias",
                ],
            ),
            (
                "Demand and supply balancing",
                "Gist: S&OP translates market demand into feasible supply, inventory, and financial choices.",
                [
                    "Consensus forecast",
                    "Supply review",
                    "Executive S&OP",
                    "IBP",
                ],
            ),
            (
                "Planning hierarchy",
                "Gist: Students learn how strategic, tactical, and operational plans connect.",
                [
                    "Aggregate planning",
                    "Master scheduling",
                    "MRP",
                    "Exception management",
                ],
            ),
        ],
    ),
    (
        "Inventory, Service Levels, and Working Capital",
        "Analyze inventory tradeoffs across uncertainty, service, cost, cash, and resilience.",
        [
            (
                "Inventory roles",
                "Gist: Inventory buffers uncertainty but ties up cash and can hide process problems.",
                [
                    "Cycle stock",
                    "Safety stock",
                    "Pipeline inventory",
                    "Decoupling stock",
                ],
            ),
            (
                "Service and uncertainty",
                "Gist: Service levels depend on variability, lead time, demand patterns, and replenishment logic.",
                [
                    "EOQ",
                    "Reorder point",
                    "Fill rate",
                    "Stockout risk",
                ],
            ),
            (
                "Working capital",
                "Gist: Inventory decisions affect cash conversion, balance-sheet pressure, and risk.",
                [
                    "Days inventory outstanding",
                    "Obsolescence",
                    "Markdown risk",
                    "Cash-to-cash cycle",
                ],
            ),
        ],
    ),
    (
        "Procurement, Strategic Sourcing, and Supplier Relationships",
        "Develop sourcing strategies, supplier segmentation, contracts, quality expectations, and relationship governance.",
        [
            (
                "Sourcing strategy",
                "Gist: Strategic sourcing aligns supplier choices with cost, risk, innovation, quality, and resilience.",
                [
                    "Category strategy",
                    "Make-buy",
                    "Supplier market analysis",
                    "Total cost of ownership",
                ],
            ),
            (
                "Supplier relationships",
                "Gist: Different supplier types require different relationship models and governance.",
                [
                    "Strategic partners",
                    "Preferred suppliers",
                    "Transactional suppliers",
                    "Supplier development",
                ],
            ),
            (
                "Contracts and negotiation",
                "Gist: Procurement turns strategy into terms, incentives, accountability, and risk-sharing.",
                [
                    "RFx process",
                    "Service-level agreements",
                    "Index-based pricing",
                    "Contract risk",
                ],
            ),
        ],
    ),
    (
        "Manufacturing, Capacity, and Operations Footprint",
        "Connect global supply-chain strategy to process choice, capacity, make-buy decisions, and production networks.",
        [
            (
                "Process and capacity",
                "Gist: Operations footprint decisions determine scalability, flexibility, unit cost, and customer responsiveness.",
                [
                    "Process choice",
                    "Capacity planning",
                    "Bottlenecks",
                    "Utilization",
                ],
            ),
            (
                "Global production networks",
                "Gist: Firms decide what to make where based on cost, risk, skill, demand, and policy.",
                [
                    "Focused factories",
                    "Postponement",
                    "Dual sourcing",
                    "Regional hubs",
                ],
            ),
            (
                "Make-buy and outsourcing",
                "Gist: Students examine what should remain internal and what should be outsourced.",
                [
                    "Core capability",
                    "Supplier capability",
                    "Transaction costs",
                    "Quality risk",
                ],
            ),
        ],
    ),
    (
        "Logistics, Transportation, and Distribution Systems",
        "Study the movement of goods through modes, nodes, carriers, warehouses, ports, and last-mile systems.",
        [
            (
                "Transportation modes",
                "Gist: Mode choice shapes cost, speed, reliability, emissions, and customer service.",
                [
                    "Ocean",
                    "Air",
                    "Rail",
                    "Truck and intermodal",
                ],
            ),
            (
                "Distribution design",
                "Gist: Distribution choices connect network structure to customer promises and inventory policy.",
                [
                    "Direct shipping",
                    "Hub-and-spoke",
                    "Cross-docking",
                    "Milk runs",
                ],
            ),
            (
                "Global logistics execution",
                "Gist: Students learn the practical complexity of freight, ports, carriers, and exceptions.",
                [
                    "Freight forwarders",
                    "3PLs",
                    "Port congestion",
                    "Demurrage and detention",
                ],
            ),
        ],
    ),
    (
        "Warehousing, Fulfillment, and Omnichannel Operations",
        "Analyze how warehouse design, fulfillment logic, automation, and customer promises shape cost and service.",
        [
            (
                "Warehouse roles",
                "Gist: Warehouses support storage, consolidation, postponement, returns, and customer response.",
                [
                    "Receiving",
                    "Putaway",
                    "Picking",
                    "Packing and shipping",
                ],
            ),
            (
                "Fulfillment strategy",
                "Gist: E-commerce and omnichannel promises require different fulfillment designs.",
                [
                    "Ship-from-store",
                    "Micro-fulfillment",
                    "Click and collect",
                    "Last mile",
                ],
            ),
            (
                "Automation and labor",
                "Gist: Students evaluate automation through productivity, flexibility, safety, and workforce implications.",
                [
                    "WMS",
                    "Robotics",
                    "Slotting",
                    "Labor standards",
                ],
            ),
        ],
    ),
    (
        "Supply Chain Information Systems, ERP, and Data Standards",
        "Understand the systems and data flows that make end-to-end planning, execution, and visibility possible.",
        [
            (
                "System landscape",
                "Gist: Modern supply chains run on connected planning, execution, and financial systems.",
                [
                    "ERP",
                    "WMS",
                    "TMS",
                    "APS",
                ],
            ),
            (
                "Data quality",
                "Gist: Visibility depends on clean master data and consistent definitions.",
                [
                    "SKU master",
                    "Supplier master",
                    "Location data",
                    "Data governance",
                ],
            ),
            (
                "Integration",
                "Gist: Students learn why handoffs between systems create risk and latency.",
                [
                    "EDI",
                    "APIs",
                    "Control points",
                    "Exception workflows",
                ],
            ),
        ],
    ),
    (
        "Digital Supply Chains, Analytics, AI, and Control Towers",
        "Use analytics, optimization, simulation, visibility platforms, and AI to support better supply-chain decisions.",
        [
            (
                "Analytics uses",
                "Gist: Analytics supports forecasting, inventory, routing, network design, risk sensing, and performance management.",
                [
                    "Descriptive analytics",
                    "Predictive analytics",
                    "Prescriptive analytics",
                    "Optimization",
                ],
            ),
            (
                "Control towers",
                "Gist: Control towers give decision-makers visibility and exception management across networks.",
                [
                    "End-to-end visibility",
                    "Alerting",
                    "Root cause analysis",
                    "Scenario response",
                ],
            ),
            (
                "AI and automation",
                "Gist: AI can improve speed and pattern recognition but requires governance and human judgment.",
                [
                    "Demand sensing",
                    "ETA prediction",
                    "Supplier risk analytics",
                    "Human-in-the-loop",
                ],
            ),
        ],
    ),
    (
        "Risk Mapping, Resilience, and Disruption Response",
        "Prepare students to identify vulnerabilities, quantify exposure, design resilience, and respond to disruption.",
        [
            (
                "Risk identification",
                "Gist: Students map vulnerabilities across suppliers, locations, logistics lanes, inventory positions, and demand patterns.",
                [
                    "Single-source risk",
                    "Tier-n visibility",
                    "Geographic concentration",
                    "Cyber risk",
                ],
            ),
            (
                "Resilience design",
                "Gist: Resilience is designed through redundancy, flexibility, visibility, buffers, and optionality.",
                [
                    "Dual sourcing",
                    "Safety stock",
                    "Flexible capacity",
                    "Alternative lanes",
                ],
            ),
            (
                "Crisis response",
                "Gist: Disruptions require decision protocols, communication, scenario planning, and recovery metrics.",
                [
                    "War room",
                    "Triage",
                    "Customer allocation",
                    "Recovery plan",
                ],
            ),
        ],
    ),
    (
        "Sustainability, Traceability, and Circular Supply Chains",
        "Integrate environmental, labor, social, circularity, and traceability goals into global supply-chain design.",
        [
            (
                "Sustainable operations",
                "Gist: Global supply chains shape emissions, waste, water, land use, and social outcomes.",
                [
                    "Scope 3 emissions",
                    "Packaging",
                    "Energy use",
                    "Waste reduction",
                ],
            ),
            (
                "Traceability",
                "Gist: Traceability makes claims auditable and helps manage quality, compliance, and ethical sourcing.",
                [
                    "Chain of custody",
                    "Digital product passport",
                    "Supplier disclosure",
                    "Audit data",
                ],
            ),
            (
                "Circularity",
                "Gist: Circular supply chains design for reuse, repair, remanufacturing, recycling, and reverse flows.",
                [
                    "Reverse logistics",
                    "Product recovery",
                    "Closed-loop supply chains",
                    "Design for circularity",
                ],
            ),
        ],
    ),
    (
        "Finance, Cost-to-Serve, and Supply Chain Performance Metrics",
        "Connect operational decisions to cost, cash, service, growth, working capital, and financial performance.",
        [
            (
                "Cost-to-serve",
                "Gist: Students learn how customer, channel, product, and geography choices create different service costs.",
                [
                    "Activity-based costing",
                    "Landed cost",
                    "Logistics cost",
                    "Complexity cost",
                ],
            ),
            (
                "Performance metrics",
                "Gist: A balanced scorecard tracks cost, service, quality, resilience, cash, and sustainability.",
                [
                    "OTIF",
                    "Perfect order",
                    "Inventory turns",
                    "Forecast accuracy",
                ],
            ),
            (
                "Financial impact",
                "Gist: Supply-chain decisions affect revenue growth, margin, cash flow, and enterprise value.",
                [
                    "Working capital",
                    "COGS",
                    "Service revenue",
                    "Risk-adjusted cost",
                ],
            ),
        ],
    ),
    (
        "Ethics, Labor, Compliance, and Responsible Global Sourcing",
        "Examine responsible sourcing, labor standards, human rights, anti-corruption, and supplier accountability.",
        [
            (
                "Labor and human rights",
                "Gist: Global sourcing requires attention to wages, safety, forced labor, child labor, and worker voice.",
                [
                    "Supplier codes",
                    "Audits",
                    "Corrective action",
                    "Worker grievance systems",
                ],
            ),
            (
                "Compliance and anti-corruption",
                "Gist: Supply-chain teams manage legal, customs, anti-bribery, sanctions, and documentation risks.",
                [
                    "FCPA awareness",
                    "Trade compliance",
                    "Conflict minerals",
                    "Restricted parties",
                ],
            ),
            (
                "Responsible governance",
                "Gist: Students evaluate how firms turn values into enforceable supplier and sourcing practices.",
                [
                    "Supplier scorecards",
                    "Responsible procurement",
                    "Transparency",
                    "Accountability",
                ],
            ),
        ],
    ),
    (
        "Global Supply Chain Strategy Capstone",
        "Synthesize network design, sourcing, logistics, analytics, risk, sustainability, and performance metrics in a final strategic recommendation.",
        [
            (
                "Problem framing",
                "Gist: Students define a real supply-chain strategy problem with objectives, constraints, and stakeholder needs.",
                [
                    "Business context",
                    "Network issue",
                    "Risk issue",
                    "Performance target",
                ],
            ),
            (
                "Integrated analysis",
                "Gist: The capstone combines qualitative context with quantitative supply-chain reasoning.",
                [
                    "Network map",
                    "Cost-service tradeoff",
                    "Risk map",
                    "Sustainability lens",
                ],
            ),
            (
                "Recommendation and roadmap",
                "Gist: Students produce an actionable plan with metrics, governance, milestones, and implementation risks.",
                [
                    "Strategic options",
                    "Implementation roadmap",
                    "KPIs",
                    "Executive presentation",
                ],
            ),
        ],
    ),
]


if __name__ == "__main__":
    write_seed(
        "global-supply-chain-management",
        "Global Supply Chain Management",
        DESC,
        "b0c1d2e3-4f5a-4b42-9c22-2d3e4f5a6b42",
        "gscmjson",
        UNITS,
        "global_supply_chain_management",
    )
