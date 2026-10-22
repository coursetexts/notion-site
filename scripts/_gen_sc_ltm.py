"""Logistics and Transportation Management curated-course seed generator."""
from _seedlib import write_seed

DESC = (
    "Logistics and Transportation Management prepares students to move goods through complex "
    "supply networks with discipline, speed, reliability, cost awareness, regulatory fluency, and "
    "resilience. Students study modal choice, carrier management, freight pricing, routing, "
    "distribution networks, warehousing interfaces, last-mile delivery, international logistics, customs "
    "compliance, transportation technology, analytics, sustainability, and disruption response. The "
    "course culminates in a professional transportation case in which students recommend and "
    "defend an executable logistics network decision."
)

UNITS = [
    (
        "Logistics Strategy and Supply Chain Role",
        "This unit frames logistics as the system that converts supply-chain strategy into reliable flow, service, cost control, and resilience.",
        [
            (
                "Logistics Value Proposition",
                "Students learn why logistics is not just shipping; it shapes service promises, customer experience, working capital, and competitive advantage.",
                [
                    "Place and time utility",
                    "Service level, cost, speed, reliability, and flexibility trade-offs",
                    "Logistics role in omnichannel, manufacturing, retail, and global supply chains",
                ],
            ),
            (
                "Total Cost and Service Thinking",
                "The point is to optimize the whole logistics system instead of minimizing one local cost.",
                [
                    "Transportation, warehousing, inventory, packaging, handling, and stockout costs",
                    "Cost-to-serve and customer profitability",
                    "Trade-offs among freight speed, inventory buffer, and delivery promise",
                ],
            ),
            (
                "Logistics Operating Models",
                "Students compare the structures companies use to execute logistics across internal teams and partners.",
                [
                    "Centralized, decentralized, regional, and outsourced models",
                    "3PL, 4PL, lead logistics provider, and asset-based carrier roles",
                    "Governance, accountability, and performance review cadence",
                ],
            ),
        ],
    ),
    (
        "Transportation Modes and Modal Economics",
        "This topic develops the core language of freight movement: what each mode does well, where it fails, and how modal economics shape network decisions.",
        [
            (
                "Mode Characteristics",
                "Students learn how truck, rail, ocean, air, pipeline, parcel, and intermodal service differ.",
                [
                    "Speed, reliability, capacity, accessibility, damage risk, and cost",
                    "Full truckload, less-than-truckload, parcel, railcar, container, air cargo, and bulk movement",
                    "Commodity, customer, lane, and urgency fit",
                ],
            ),
            (
                "Modal Cost Drivers",
                "The gist is that transportation cost is built from distance, weight, cube, equipment, labor, imbalance, fuel, and market capacity.",
                [
                    "Linehaul, pickup and delivery, terminal handling, drayage, fuel, and accessorials",
                    "Density, shipment size, load factor, and equipment utilization",
                    "Backhaul imbalance and directional markets",
                ],
            ),
            (
                "Modal Strategy",
                "Students learn to choose modes based on total system performance rather than habit.",
                [
                    "Mode shifts and intermodal conversion",
                    "Service promise versus freight spend",
                    "Emissions, risk, resilience, and customer expectation implications",
                ],
            ),
        ],
    ),
    (
        "Carrier Selection, Procurement and Relationship Management",
        "Carrier choices determine reliability, cost, risk, and customer service. This section teaches sourcing discipline and relationship management.",
        [
            (
                "Carrier Qualification",
                "Students learn how to evaluate carriers beyond price.",
                [
                    "Safety record, insurance, authority, financial health, service footprint, and technology capability",
                    "On-time performance, claims ratio, tender acceptance, and responsiveness",
                    "Diversity, sustainability, and strategic fit",
                ],
            ),
            (
                "Transportation Procurement",
                "The point is to structure freight bids that produce usable capacity and fair comparisons.",
                [
                    "RFP design, lane data, bid sheets, service requirements, and award strategy",
                    "Contract rates, spot rates, mini-bids, and dynamic procurement",
                    "Negotiation, incumbent strategy, and carrier portfolio design",
                ],
            ),
            (
                "Carrier Performance Management",
                "Students learn how to govern transportation partners after award.",
                [
                    "Scorecards, QBRs, corrective action, escalation, and continuous improvement",
                    "Tender acceptance, pickup/delivery performance, claims, billing accuracy, and communication",
                    "Relationship segmentation: strategic, core, backup, and transactional carriers",
                ],
            ),
        ],
    ),
    (
        "Freight Pricing, Contracts and Cost-to-Serve",
        "This unit demystifies freight rates and teaches students how pricing, contracts, and cost allocation affect logistics decisions.",
        [
            (
                "Rate Structures",
                "Students learn common freight pricing formats and why the same shipment can produce different charges.",
                [
                    "Tariffs, contract rates, spot quotes, mileage, weight breaks, dimensional weight, and class rates",
                    "Accessorials, detention, demurrage, fuel surcharge, and peak surcharges",
                    "Parcel zones, LTL classification, truckload lane rates, and ocean/air charges",
                ],
            ),
            (
                "Contracts and Commercial Terms",
                "The goal is to understand how transportation agreements allocate service expectations and risk.",
                [
                    "Service-level agreements, liability limits, payment terms, claims, and audit rights",
                    "Volume commitments, capacity commitments, rate validity, and index-linked fuel terms",
                    "Tender rules, cancellation, force majeure, and dispute resolution",
                ],
            ),
            (
                "Cost-to-Serve Analysis",
                "Students learn to connect freight cost to customers, products, lanes, and service policies.",
                [
                    "Activity-based costing for logistics",
                    "Customer, SKU, order, and channel profitability",
                    "Freight audit, invoice matching, and leakage control",
                ],
            ),
        ],
    ),
    (
        "Routing, Scheduling and Dispatch Optimization",
        "Routing and scheduling convert customer promises into feasible transportation plans. Students learn both the logic and constraints behind vehicle movement.",
        [
            (
                "Routing Problems",
                "Students learn the practical structure of routing decisions.",
                [
                    "Vehicle routing problem, traveling salesperson problem, pickup and delivery, and backhaul matching",
                    "Distance, time windows, capacity, equipment, driver hours, and service constraints",
                    "Manual planning versus optimization engines",
                ],
            ),
            (
                "Scheduling and Dispatch",
                "The focus is on execution: turning plans into timed work and responding to exceptions.",
                [
                    "Appointment scheduling, load sequencing, dock times, and dispatch boards",
                    "Driver assignment, equipment assignment, and route compliance",
                    "Exception management, re-routing, and communication protocols",
                ],
            ),
            (
                "Optimization Trade-offs",
                "Students learn why the mathematically cheapest plan may not be operationally best.",
                [
                    "Cost, service, reliability, labor, safety, emissions, and customer priority",
                    "Sensitivity to demand variability and traffic",
                    "Scenario planning and what-if analysis",
                ],
            ),
        ],
    ),
    (
        "Distribution Network Design",
        "A logistics network determines where inventory sits, how orders flow, and how fast customers can be served. This topic builds network design judgment.",
        [
            (
                "Network Structure",
                "Students learn the design options that shape distribution systems.",
                [
                    "Factories, suppliers, ports, DCs, cross-docks, stores, lockers, and customer nodes",
                    "Direct shipping, hub-and-spoke, pooling, cross-docking, and postponement",
                    "Single-echelon and multi-echelon networks",
                ],
            ),
            (
                "Facility Location and Flow",
                "The point is to locate facilities and routes around demand, cost, capacity, and service.",
                [
                    "Center-of-gravity, network optimization, and lane-flow modeling",
                    "Inbound, outbound, reverse, and transfer flows",
                    "Capacity, labor, real estate, tax, risk, and customer-density considerations",
                ],
            ),
            (
                "Network Strategy",
                "Students connect network design to business strategy.",
                [
                    "Speed versus cost versus resilience",
                    "Regionalization, nearshoring, and multi-sourcing",
                    "Network redesign triggers: growth, merger, disruption, service failure, and channel change",
                ],
            ),
        ],
    ),
    (
        "Warehousing, Fulfillment and Inventory Interface",
        "Transportation and warehousing are tightly linked: shipment size, order timing, storage design, and inventory policy all shape freight performance.",
        [
            (
                "Warehouse Role in Logistics",
                "Students learn how facilities support consolidation, postponement, fulfillment, and service.",
                [
                    "Receiving, putaway, storage, replenishment, picking, packing, shipping, and returns",
                    "Cross-docking, flow-through, breakbulk, and merge-in-transit",
                    "Warehouse layout, slotting, labor, and dock management",
                ],
            ),
            (
                "Inventory-Service Trade-offs",
                "The goal is to connect inventory policy to transportation speed and cost.",
                [
                    "Cycle stock, safety stock, reorder points, EOQ, and ABC analysis",
                    "Stockout risk, fill rate, order cycle time, and service levels",
                    "Pooling, postponement, and inventory placement",
                ],
            ),
            (
                "Fulfillment Execution",
                "Students learn the operational details behind customer-ready shipments.",
                [
                    "Order batching, wave planning, picking methods, packing, labeling, and compliance",
                    "Parcel, LTL, truckload, and customer pickup handoff",
                    "WMS, barcode, RFID, automation, and labor standards",
                ],
            ),
        ],
    ),
    (
        "Demand Planning, S&OP and Capacity Alignment",
        "Logistics cannot perform well when demand, inventory, and capacity plans are disconnected. This section links transportation decisions to planning cadence.",
        [
            (
                "Demand Signals and Forecasts",
                "Students learn what logistics planners need from demand planning.",
                [
                    "Demand patterns, seasonality, promotions, launches, and forecast error",
                    "Moving averages, exponential smoothing, causal forecasts, and judgment overlays",
                    "Forecast bias, accuracy, and exception review",
                ],
            ),
            (
                "S&OP and Logistics Capacity",
                "The purpose is to align freight capacity, warehouse labor, and inventory with expected demand.",
                [
                    "Sales and operations planning cadence",
                    "Capacity planning for carriers, warehouses, ports, and labor",
                    "Peak planning, constraint review, and contingency capacity",
                ],
            ),
            (
                "Integrated Planning Decisions",
                "Students see how planning choices create logistics consequences.",
                [
                    "Order frequency, minimum order quantities, replenishment cadence, and shipment consolidation",
                    "Expedite prevention and service policy design",
                    "Trade-offs among forecast accuracy, buffer inventory, and transport flexibility",
                ],
            ),
        ],
    ),
    (
        "Last-Mile, Ecommerce and Omnichannel Logistics",
        "The last mile is often the most visible and expensive part of logistics. This topic focuses on customer promise, density, delivery options, and returns.",
        [
            (
                "Last-Mile Models",
                "Students compare the delivery structures used in ecommerce and retail.",
                [
                    "Parcel networks, local courier, gig delivery, store fulfillment, lockers, pickup points, and white-glove service",
                    "Same-day, next-day, scheduled, and economy delivery options",
                    "Urban, suburban, and rural delivery economics",
                ],
            ),
            (
                "Customer Promise Design",
                "The point is to design delivery promises that are attractive and operationally possible.",
                [
                    "Delivery speed, accuracy, visibility, installation, returns, and communication",
                    "Free shipping thresholds, delivery fees, and service tiers",
                    "Customer experience metrics and failure recovery",
                ],
            ),
            (
                "Returns and Reverse Flow",
                "Students learn why returns are a strategic logistics process, not an afterthought.",
                [
                    "Return authorization, inspection, disposition, refurbish, recycle, and resale",
                    "Cost of returns and fraud control",
                    "Reverse logistics network design and customer satisfaction",
                ],
            ),
        ],
    ),
    (
        "International Logistics, Ports and Global Freight",
        "Global logistics adds distance, time, uncertainty, regulation, and multi-party coordination. This unit introduces the operating logic of international freight.",
        [
            (
                "Global Freight Modes",
                "Students learn how ocean, air, rail, truck, and intermodal systems connect across borders.",
                [
                    "Containerization, vessels, ports, terminals, air cargo, rail corridors, and drayage",
                    "Transit time, cutoffs, sailings, dwell time, and port congestion",
                    "Freight forwarders, NVOCCs, brokers, and customs intermediaries",
                ],
            ),
            (
                "Incoterms and Responsibilities",
                "The goal is to understand how commercial terms assign cost, risk, and responsibility.",
                [
                    "EXW, FCA, FOB, CFR, CIF, CPT, CIP, DAP, DPU, and DDP",
                    "Transfer of risk, freight payment, insurance, and documentation responsibility",
                    "Common incoterms mistakes and landed cost implications",
                ],
            ),
            (
                "Global Risk and Coordination",
                "Students learn how global logistics plans deal with uncertainty.",
                [
                    "Geopolitical risk, port disruption, weather, labor actions, piracy, and sanctions",
                    "Buffer time, alternate gateways, dual routing, and supplier coordination",
                    "Visibility, milestones, and exception management",
                ],
            ),
        ],
    ),
    (
        "Customs, Trade Compliance and Security",
        "Trade compliance protects the firm from delays, penalties, seizures, and reputational harm. Students learn the core compliance processes logistics managers must understand.",
        [
            (
                "Customs Documentation",
                "Students learn the paperwork and data needed for legal cross-border movement.",
                [
                    "Commercial invoice, packing list, bill of lading, airway bill, certificate of origin, and entry documents",
                    "HS classification, valuation, country of origin, and duty calculation",
                    "Recordkeeping, audit trail, and broker coordination",
                ],
            ),
            (
                "Regulatory Compliance",
                "The point is to connect logistics decisions to trade rules and government controls.",
                [
                    "Import/export controls, denied parties, sanctions, anti-dumping, and product regulations",
                    "C-TPAT, bonded warehouses, free trade zones, and trusted trader programs",
                    "Compliance ownership and escalation",
                ],
            ),
            (
                "Cargo Security and Risk",
                "Students learn how security requirements shape logistics execution.",
                [
                    "Chain of custody, seals, inspections, screening, and cargo theft prevention",
                    "Cybersecurity for logistics data and systems",
                    "Insurance, claims, and incident response",
                ],
            ),
        ],
    ),
    (
        "Intermodal, Multimodal and Infrastructure Systems",
        "Modern logistics depends on infrastructure and handoffs across modes. This topic focuses on nodes, transfers, bottlenecks, and infrastructure capacity.",
        [
            (
                "Intermodal Systems",
                "Students learn how containers and trailers move across truck, rail, ocean, and inland hubs.",
                [
                    "Drayage, ramps, terminals, chassis, containers, and rail intermodal",
                    "Ramp selection, cutoffs, dwell, detention, demurrage, and equipment availability",
                    "Intermodal cost, emissions, service, and reliability trade-offs",
                ],
            ),
            (
                "Infrastructure and Bottlenecks",
                "The focus is on how ports, roads, bridges, rail, airports, and warehouses constrain logistics performance.",
                [
                    "Capacity, congestion, maintenance, weather exposure, and labor availability",
                    "Port and terminal operations",
                    "Public policy, infrastructure investment, and freight corridors",
                ],
            ),
            (
                "Multimodal Coordination",
                "Students learn how to manage movement when no single party controls the whole journey.",
                [
                    "Handoff milestones, documentation, visibility, and exception ownership",
                    "Through bills, freight forwarding, and integrated service providers",
                    "Risk at interfaces and buffers between modes",
                ],
            ),
        ],
    ),
    (
        "Logistics Technology, TMS, WMS and Visibility",
        "Technology lets logistics teams plan, execute, monitor, and improve flow. This unit explains the systems landscape and how data becomes operational visibility.",
        [
            (
                "Transportation Management Systems",
                "Students learn what TMS platforms do and why they matter.",
                [
                    "Planning, rating, tendering, tracking, freight audit, settlement, and reporting",
                    "Carrier portals, EDI/API connectivity, and load boards",
                    "Optimization, dynamic pricing, and exception workflows",
                ],
            ),
            (
                "Warehouse and Yard Systems",
                "The point is to understand how warehouse and yard execution systems connect to transport.",
                [
                    "WMS, YMS, labor management, slotting, scanning, RFID, and automation",
                    "Appointment scheduling, dock visibility, and trailer tracking",
                    "Integration among ERP, OMS, WMS, TMS, and carrier systems",
                ],
            ),
            (
                "Visibility and Control Towers",
                "Students learn how real-time logistics data supports decision making.",
                [
                    "GPS, telematics, IoT sensors, ELDs, AIS, APIs, milestones, and event data",
                    "Predictive ETA, alerts, exception triage, and customer communication",
                    "Data quality, master data, and governance",
                ],
            ),
        ],
    ),
    (
        "Logistics Analytics, KPIs and Decision Support",
        "World-class logistics managers use data to diagnose performance, evaluate trade-offs, and improve decisions. This section builds practical analytics fluency.",
        [
            (
                "Logistics KPI Design",
                "Students learn which measures matter and how to avoid metric overload.",
                [
                    "On-time pickup, on-time delivery, tender acceptance, cost per mile, cost per order, claims, damage, dwell, and utilization",
                    "Service, cost, productivity, quality, sustainability, and resilience metrics",
                    "KPI definitions, targets, ownership, and review cadence",
                ],
            ),
            (
                "Decision Analytics",
                "The goal is to model logistics choices using clear assumptions and sensitivity.",
                [
                    "Lane analysis, shipment consolidation, mode choice, routing, and facility scenarios",
                    "Regression, clustering, simulation, optimization, and dashboarding basics",
                    "Data visualization and executive decision briefs",
                ],
            ),
            (
                "Performance Improvement",
                "Students learn to turn metrics into action.",
                [
                    "Root-cause analysis, Pareto analysis, control charts, and variance review",
                    "Continuous improvement projects and benefits tracking",
                    "Benchmarking against internal history and external data",
                ],
            ),
        ],
    ),
    (
        "Risk, Resilience and Disruption Response",
        "Logistics networks operate under disruption. This topic teaches students to map risk, prepare contingencies, and recover service.",
        [
            (
                "Risk Identification",
                "Students learn to recognize vulnerabilities before they become crises.",
                [
                    "Supplier, carrier, lane, port, facility, weather, cyber, labor, geopolitical, and demand risks",
                    "Single points of failure and critical nodes",
                    "Risk probability, impact, detectability, and velocity",
                ],
            ),
            (
                "Resilience Design",
                "The point is to build optionality without making the network unaffordable.",
                [
                    "Redundant carriers, alternate ports, safety capacity, inventory buffers, and flexible routing",
                    "Scenario planning, playbooks, and business continuity planning",
                    "Trade-offs among efficiency, resilience, and working capital",
                ],
            ),
            (
                "Disruption Response",
                "Students learn the operating discipline of crisis logistics.",
                [
                    "War rooms, escalation, decision rights, communications, and recovery priorities",
                    "Expediting, allocation, substitution, and customer segmentation during disruption",
                    "Post-event learning and resilience investment cases",
                ],
            ),
        ],
    ),
    (
        "Sustainable and Responsible Logistics",
        "Logistics choices affect emissions, communities, labor, safety, and waste. This section makes sustainability an operational design problem.",
        [
            (
                "Emissions and Energy",
                "Students learn where logistics emissions come from and how to reduce them.",
                [
                    "Scope 1, Scope 2, and Scope 3 logistics emissions",
                    "Mode shift, route optimization, load factor, alternative fuels, EVs, and renewable energy",
                    "Carbon accounting, emissions factors, and customer reporting",
                ],
            ),
            (
                "Circular and Reverse Logistics",
                "The focus is on recovering value and reducing waste.",
                [
                    "Returns, repair, refurbishment, remanufacturing, recycling, and disposal",
                    "Packaging reduction, reusable packaging, and closed-loop systems",
                    "Product design and logistics design for circularity",
                ],
            ),
            (
                "Social Responsibility",
                "Students learn that responsible logistics includes people and communities.",
                [
                    "Driver safety, labor practices, warehouse ergonomics, and fair scheduling",
                    "Community impacts of freight, congestion, noise, and air quality",
                    "Ethical sourcing, transparency, and supplier/carrier standards",
                ],
            ),
        ],
    ),
    (
        "Regulation, Safety and Legal Environment",
        "Transportation operates in a regulated environment. Students learn the rules and responsibilities that shape safe, lawful logistics execution.",
        [
            (
                "Transportation Regulation",
                "Students learn the regulatory basics that differ by mode and jurisdiction.",
                [
                    "Motor carrier authority, hours of service, ELDs, hazardous materials, and safety ratings",
                    "Rail, ocean, air, and parcel regulatory context",
                    "FMCSA, DOT, FMC, FAA, TSA, and international bodies",
                ],
            ),
            (
                "Safety Management",
                "The goal is to make safety a managed system, not a slogan.",
                [
                    "Driver safety, warehouse safety, loading securement, hazmat handling, and incident reporting",
                    "Safety KPIs, audits, training, and corrective actions",
                    "Insurance, liability, claims, and risk transfer",
                ],
            ),
            (
                "Legal and Ethical Issues",
                "Students learn common legal and ethical pitfalls in logistics.",
                [
                    "Contracts, fraud, cargo theft, bribery, sanctions, antitrust, and confidentiality",
                    "Data privacy and cybersecurity in logistics platforms",
                    "Ethical decision making under service and cost pressure",
                ],
            ),
        ],
    ),
    (
        "Capstone Transportation Case and Network Recommendation",
        "The course culminates in a professional logistics decision case. Students diagnose a network, model alternatives, and recommend an executable transportation plan.",
        [
            (
                "Case Diagnosis",
                "Students begin by defining the logistics problem and its business stakes.",
                [
                    "Current network, lanes, modes, volumes, costs, service failures, and constraints",
                    "Stakeholders, customer promise, inventory impact, and risk exposure",
                    "Data gaps, assumptions, and decision criteria",
                ],
            ),
            (
                "Alternative Design",
                "The capstone requires students to create and compare feasible logistics options.",
                [
                    "Mode mix, carrier strategy, routing, facility use, last-mile design, and technology support",
                    "Cost, service, emissions, resilience, and implementation trade-offs",
                    "Sensitivity analysis and scenario planning",
                ],
            ),
            (
                "Executive Recommendation",
                "Students finish by presenting a decision-ready logistics plan.",
                [
                    "Recommendation memo, dashboard, network map, and implementation roadmap",
                    "Carrier, warehouse, systems, compliance, and change-management actions",
                    "KPIs, control plan, and post-implementation review",
                ],
            ),
        ],
    ),
]


if __name__ == "__main__":
    write_seed(
        "logistics-and-transportation-management",
        "Logistics and Transportation Management",
        DESC,
        "f4a5b6c7-8d9e-4f46-9a66-6b7c8d9e0f86",
        "ltmjson",
        UNITS,
        "logistics_and_transportation_management",
    )
