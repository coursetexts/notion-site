"""Interdisciplinary Topics Course curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "Investigate one consequential “big problem” through multiple disciplinary "
    "lenses, integrate diverse evidence into a more comprehensive understanding, and collaborate "
    "with relevant publics to create an ethical, useful, and well-communicated contribution."
)

UNITS = [
    (
        "The Big Question: Defining the Topic and the Problem",
        "Interdisciplinary inquiry starts with a problem that cannot be understood adequately through one field alone. Students learn to turn a broad theme into a researchable, consequential question with boundaries, stakeholders, and a shared vocabulary.",
        [
            (
                "Theme and problem space",
                "Distinguish a compelling topic from a specific problem that can guide sustained inquiry.",
                [
                    "Possible themes: climate resilience, AI and society, migration, public health, democracy, or urban futures",
                    "Problem situations, symptoms, causes, consequences, and contested meanings",
                    "Why the problem exceeds a single discipline",
                ],
            ),
            (
                "Question formulation",
                "Develop questions that invite explanation, interpretation, evaluation, and action.",
                [
                    "Descriptive, causal, interpretive, normative, and design questions",
                    "Question scope, feasibility, significance, and uncertainty",
                    "Nested questions and a shared inquiry agenda",
                ],
            ),
            (
                "Boundaries and scale",
                "Decide where the study begins and ends without pretending the problem is isolated.",
                [
                    "Local, regional, national, planetary, and historical scales",
                    "Population, institution, ecosystem, technology, and time boundaries",
                    "Boundary choices, exclusions, and implications",
                ],
            ),
            (
                "Stakeholders and publics",
                "Identify who experiences, defines, governs, studies, or can change the problem.",
                [
                    "Affected communities, decision makers, experts, organizations, and nonhuman interests",
                    "Power, voice, incentives, responsibilities, and conflicts",
                    "Stakeholder maps and engagement priorities",
                ],
            ),
            (
                "Inquiry charter",
                "Create a living agreement about purpose, evidence, collaboration, and deliverables.",
                [
                    "Central question, subquestions, outcomes, and audience",
                    "Assumptions, terms, unknowns, and success criteria",
                    "Research ethics, team norms, milestones, and revision process",
                ],
            ),
        ],
    ),
    (
        "Disciplines, Epistemologies, and Ways of Knowing",
        "Disciplines are not simply collections of facts; they organize questions, methods, evidence, values, and standards of explanation. Students learn to recognize these architectures so that integration respects real differences rather than flattening them.",
        [
            (
                "Anatomy of a discipline",
                "Examine how fields define legitimate problems and knowledge.",
                [
                    "Objects of study and characteristic questions",
                    "Core concepts, theories, methods, genres, and institutions",
                    "Standards of evidence, explanation, and expertise",
                ],
            ),
            (
                "Epistemologies",
                "Compare accounts of what can be known and how claims become warranted.",
                [
                    "Empiricism, interpretation, rationalism, pragmatism, and critical approaches",
                    "Objectivity, situated knowledge, standpoint, and reflexivity",
                    "Certainty, probability, ambiguity, and pluralism",
                ],
            ),
            (
                "Paradigms and assumptions",
                "Surface commitments that are often invisible within a field.",
                [
                    "Ontology, causality, agency, structure, and scale",
                    "Individual, institutional, cultural, ecological, and technological explanations",
                    "Normal science, anomalies, and paradigm change",
                ],
            ),
            (
                "Multi-, inter-, and transdisciplinarity",
                "Differentiate parallel contributions from genuine integration and co-production.",
                [
                    "Multidisciplinary juxtaposition",
                    "Interdisciplinary synthesis",
                    "Transdisciplinary collaboration with practitioners and communities",
                ],
            ),
            (
                "Intellectual humility",
                "Treat expertise as necessary but partial.",
                [
                    "Competence boundaries and responsible borrowing",
                    "Translation without caricature",
                    "Productive disagreement and revisable conclusions",
                ],
            ),
        ],
    ),
    (
        "Humanities Lenses: Meaning, History, Culture, and Interpretation",
        "Humanities methods reveal how language, memory, values, narratives, and cultural forms shape complex problems. Students learn to analyze meaning and historical possibility rather than treating present conditions as natural or inevitable.",
        [
            (
                "Historical inquiry",
                "Trace change, continuity, contingency, and path dependence.",
                [
                    "Periodization, chronology, and turning points",
                    "Primary and secondary sources",
                    "Archives, silences, and historiography",
                ],
            ),
            (
                "Textual and rhetorical analysis",
                "Study how language constructs problems, identities, and possible actions.",
                [
                    "Close reading and contextual interpretation",
                    "Metaphor, framing, genre, argument, and audience",
                    "Public discourse, policy language, and media narratives",
                ],
            ),
            (
                "Cultural analysis",
                "Interpret symbols, practices, institutions, and everyday life.",
                [
                    "Representation, identity, ritual, memory, and ideology",
                    "Popular culture, material culture, and digital culture",
                    "Dominant, residual, emergent, and countercultural forms",
                ],
            ),
            (
                "Philosophical analysis",
                "Clarify concepts and evaluate reasons, values, and obligations.",
                [
                    "Conceptual distinctions and thought experiments",
                    "Normative theories and practical ethics",
                    "Logic, counterargument, and reflective equilibrium",
                ],
            ),
            (
                "Creative and imaginative knowledge",
                "Use art and narrative to explore experience, possibility, and moral attention.",
                [
                    "Literature, visual art, performance, and film as evidence or inquiry",
                    "Speculative fiction and alternative futures",
                    "Aesthetic form, empathy, estrangement, and interpretation",
                ],
            ),
        ],
    ),
    (
        "Social Science Lenses: Institutions, Behavior, Power, and Society",
        "Social sciences connect individual action to groups, institutions, markets, policies, and cultures. Students compare explanatory models and learn to combine qualitative and quantitative evidence without confusing association with cause.",
        [
            (
                "Levels of social explanation",
                "Locate mechanisms across persons, networks, organizations, and institutions.",
                [
                    "Micro, meso, and macro levels",
                    "Agency, structure, norms, incentives, and identity",
                    "Feedback between individual and collective outcomes",
                ],
            ),
            (
                "Institutions and governance",
                "Analyze how formal and informal rules distribute authority and resources.",
                [
                    "States, markets, firms, schools, families, and civil society",
                    "Policy design, implementation, and administrative capacity",
                    "Institutional change, lock-in, and legitimacy",
                ],
            ),
            (
                "Power and inequality",
                "Examine how benefits, burdens, recognition, and voice are distributed.",
                [
                    "Class, race, gender, disability, citizenship, and intersectionality",
                    "Structural, relational, discursive, and coercive power",
                    "Measurement, lived experience, and cumulative disadvantage",
                ],
            ),
            (
                "Behavior and decision making",
                "Study choice in social context rather than assuming fully rational actors.",
                [
                    "Preferences, incentives, heuristics, and biases",
                    "Social norms, networks, identity, and collective action",
                    "Experiments, surveys, observational studies, and limitations",
                ],
            ),
            (
                "Causal and comparative reasoning",
                "Evaluate why outcomes differ across groups, places, institutions, or time.",
                [
                    "Correlation, mechanism, confounding, and counterfactuals",
                    "Comparative case selection",
                    "Generalization, context, and external validity",
                ],
            ),
        ],
    ),
    (
        "Natural and Quantitative Lenses: Systems, Measurement, and Evidence",
        "Scientific and quantitative approaches help characterize mechanisms, patterns, constraints, and uncertainty. Students learn to use numbers critically—checking definitions, models, uncertainty, and values embedded in measurement.",
        [
            (
                "Scientific modeling",
                "Represent selected features of reality to explain or predict.",
                [
                    "Variables, mechanisms, assumptions, boundaries, and scales",
                    "Conceptual, mathematical, computational, and physical models",
                    "Model validation, limitations, and domain of applicability",
                ],
            ),
            (
                "Measurement and indicators",
                "Ask what a number represents, how it was produced, and what it excludes.",
                [
                    "Operational definitions, units, validity, and reliability",
                    "Proxies, composite indicators, baselines, and denominators",
                    "Measurement error and missing data",
                ],
            ),
            (
                "Data interpretation",
                "Read patterns while resisting overclaiming.",
                [
                    "Distributions, rates, uncertainty intervals, and effect sizes",
                    "Correlation, causation, selection, and survivorship",
                    "Visualization choices and misleading comparisons",
                ],
            ),
            (
                "Ecological and planetary constraints",
                "Connect human systems to biophysical processes and limits.",
                [
                    "Energy and material flows",
                    "Ecosystems, resilience, thresholds, and feedback",
                    "Climate, biodiversity, pollution, and resource use",
                ],
            ),
            (
                "Quantification and values",
                "Recognize that deciding what to count is partly normative.",
                [
                    "Benefit, harm, risk, and quality-of-life metrics",
                    "Monetization and nonmonetary values",
                    "Distribution, uncertainty, and ethical limits of aggregation",
                ],
            ),
        ],
    ),
    (
        "Arts, Design, and Creative Practice as Inquiry",
        "Creative practice can generate knowledge, reveal experience, and prototype alternatives. Students learn to use design and artistic methods alongside—not merely after—analysis.",
        [
            (
                "Practice-based inquiry",
                "Treat making as a disciplined process of questioning and discovery.",
                [
                    "Sketching, composing, performance, fabrication, and iteration",
                    "Process documentation and reflective commentary",
                    "Tacit, embodied, sensory, and experiential knowledge",
                ],
            ),
            (
                "Human-centered research",
                "Understand needs and contexts through direct engagement.",
                [
                    "Observation, interviews, journey maps, and cultural probes",
                    "Extreme users, accessibility, and inclusive participation",
                    "Consent, reciprocity, and avoiding extractive research",
                ],
            ),
            (
                "Problem reframing",
                "Challenge inherited definitions and expand the space of possibilities.",
                [
                    "How-might-we questions and assumption reversal",
                    "Needs, values, functions, and systemic causes",
                    "Alternative framings and their consequences",
                ],
            ),
            (
                "Ideation and prototyping",
                "Make ideas tangible enough to test and discuss.",
                [
                    "Divergence, analogy, combination, and co-creation",
                    "Low-fidelity prototypes, storyboards, scenarios, and role-play",
                    "Feedback, iteration, and learning goals",
                ],
            ),
            (
                "Representation and public imagination",
                "Use form and media to shape attention and collective possibility.",
                [
                    "Exhibitions, maps, installations, documentary, and interactive media",
                    "Counter-narratives and speculative design",
                    "Audience experience, accessibility, and interpretation",
                ],
            ),
        ],
    ),
    (
        "Evidence Literacy and Mixed-Methods Research",
        "World-class interdisciplinary work is methodologically plural but not methodologically vague. Students learn to locate, assess, combine, and document qualitative, quantitative, historical, and creative evidence.",
        [
            (
                "Research strategy",
                "Match questions to evidence and methods.",
                [
                    "Exploratory, descriptive, explanatory, evaluative, and design research",
                    "Case study, comparative, experimental, ethnographic, archival, and mixed-methods designs",
                    "Feasibility, access, ethics, and triangulation",
                ],
            ),
            (
                "Source discovery and provenance",
                "Build a transparent evidence base across disciplines.",
                [
                    "Scholarly databases, archives, datasets, policy documents, and community knowledge",
                    "Citation chaining, controlled vocabulary, and grey literature",
                    "Authorship, funding, version, date, and data lineage",
                ],
            ),
            (
                "Critical appraisal",
                "Evaluate evidence using standards appropriate to its source and claim.",
                [
                    "Credibility, relevance, validity, reliability, and bias",
                    "Peer review, replication, saturation, and corroboration",
                    "Expert consensus, disagreement, and uncertainty",
                ],
            ),
            (
                "Mixed-methods integration",
                "Use methods to answer complementary parts of the problem.",
                [
                    "Sequential, concurrent, and embedded designs",
                    "Convergence, complementarity, expansion, and contradiction",
                    "Joint displays and integrated interpretation",
                ],
            ),
            (
                "Research transparency",
                "Make the path from source to conclusion inspectable.",
                [
                    "Search logs, coding decisions, analytic memos, and data dictionaries",
                    "Citation management and reproducible workflows",
                    "Open materials, privacy, intellectual property, and limitations",
                ],
            ),
        ],
    ),
    (
        "Systems Thinking, Complexity, and Mapping",
        "Complex problems emerge from interactions, feedback, delays, adaptation, and multiple scales. Students learn to map systems without mistaking the map for the world and to identify leverage, tradeoffs, and unintended consequences.",
        [
            (
                "System structure",
                "Define elements, relationships, purpose, and boundary.",
                [
                    "Stocks, flows, actors, institutions, technologies, and environments",
                    "Material, information, financial, and influence connections",
                    "Nested systems and boundary critique",
                ],
            ),
            (
                "Feedback and dynamics",
                "Explain how circular causality creates persistence or change.",
                [
                    "Reinforcing and balancing loops",
                    "Delays, accumulation, nonlinearity, and oscillation",
                    "Path dependence, lock-in, and tipping behavior",
                ],
            ),
            (
                "Networks and emergence",
                "Study patterns that arise from distributed interaction.",
                [
                    "Nodes, ties, centrality, clustering, and diffusion concepts",
                    "Local rules and emergent outcomes",
                    "Contagion, coordination, polarization, and resilience",
                ],
            ),
            (
                "Complex adaptive systems",
                "Recognize learning, adaptation, heterogeneity, and coevolution.",
                [
                    "Agents, variation, selection, and adaptation",
                    "Self-organization and regime shifts",
                    "Prediction limits and scenario thinking",
                ],
            ),
            (
                "Leverage and unintended effects",
                "Identify interventions while examining who gains, who loses, and what might rebound.",
                [
                    "Parameters, information, rules, goals, and paradigms",
                    "Second-order effects and policy resistance",
                    "Robust portfolios and monitoring signals",
                ],
            ),
        ],
    ),
    (
        "Integration: Creating Common Ground and New Understanding",
        "Integration is the defining intellectual work of interdisciplinarity. Students learn to connect insights by clarifying concepts, reconciling assumptions, relating mechanisms, and constructing a synthesis that changes how the problem is understood.",
        [
            (
                "Conflict mapping",
                "Locate where disciplinary findings agree, complement, or contradict.",
                [
                    "Different terms for similar ideas",
                    "Same terms with different meanings",
                    "Differences in scale, unit of analysis, method, or value",
                ],
            ),
            (
                "Concept clarification",
                "Create enough shared language for collaboration without erasing productive difference.",
                [
                    "Definitions, dimensions, typologies, and boundary concepts",
                    "Common ground and conceptual translation",
                    "Boundary objects and trading zones",
                ],
            ),
            (
                "Integration techniques",
                "Combine disciplinary insights through explicit reasoning.",
                [
                    "Extension, redefinition, organization, transformation, and causal linkage",
                    "Concept maps, matrices, timelines, and multi-level models",
                    "Narrative, systems, and design synthesis",
                ],
            ),
            (
                "More-comprehensive understanding",
                "Show what the integration explains that separate accounts do not.",
                [
                    "Cross-level mechanisms and interactions",
                    "Tradeoffs, tensions, paradoxes, and conditional conclusions",
                    "Novel hypotheses, questions, and intervention points",
                ],
            ),
            (
                "Integration quality",
                "Evaluate synthesis rather than rewarding mere breadth.",
                [
                    "Responsiveness to each discipline’s strongest evidence",
                    "Coherence, explanatory power, usefulness, and transparency",
                    "Residual disagreement and limits",
                ],
            ),
        ],
    ),
    (
        "Ethics, Power, Positionality, and Responsible Inquiry",
        "Interdisciplinary projects make choices about whose knowledge counts, who bears risk, and what futures are desirable. Students learn to examine their own position, engage ethically, and make normative commitments visible.",
        [
            (
                "Positionality and reflexivity",
                "Understand how identity, training, interests, and institutional location shape inquiry.",
                [
                    "Researcher standpoint and access",
                    "Insider/outsider roles",
                    "Reflexive journals and team discussion",
                ],
            ),
            (
                "Research and engagement ethics",
                "Protect people and communities while building reciprocal relationships.",
                [
                    "Consent, confidentiality, privacy, and data stewardship",
                    "Community knowledge, ownership, compensation, and attribution",
                    "Human-subjects review and harm assessment",
                ],
            ),
            (
                "Justice frameworks",
                "Evaluate distribution, recognition, participation, and capability.",
                [
                    "Procedural, distributive, restorative, and intergenerational justice",
                    "Environmental, disability, racial, gender, and data justice",
                    "Intersectionality and cumulative impacts",
                ],
            ),
            (
                "Knowledge and power",
                "Examine how expertise becomes authoritative and how alternatives are marginalized.",
                [
                    "Epistemic injustice and testimonial credibility",
                    "Coloniality, extraction, and Indigenous knowledge sovereignty",
                    "Professional expertise and democratic participation",
                ],
            ),
            (
                "Responsible recommendations",
                "State values, uncertainties, and tradeoffs rather than hiding them behind technical language.",
                [
                    "Benefits, burdens, reversibility, and precaution",
                    "Conflicts of interest and accountability",
                    "Conditions, safeguards, monitoring, and avenues for redress",
                ],
            ),
        ],
    ),
    (
        "Comparative Case Studies and Historical Context",
        "Cases let students test concepts against real complexity. Comparison reveals patterns, causal mechanisms, contextual differences, and the danger of copying solutions without understanding where they came from.",
        [
            (
                "Case construction",
                "Define what the case is a case of and why it matters.",
                [
                    "Unit of analysis and temporal boundary",
                    "Actors, events, institutions, and outcomes",
                    "Evidence base and missing voices",
                ],
            ),
            (
                "Comparative design",
                "Select cases that illuminate similarities, differences, and mechanisms.",
                [
                    "Most-similar and most-different comparisons",
                    "Positive, negative, deviant, and critical cases",
                    "Within-case process tracing and cross-case matrices",
                ],
            ),
            (
                "Historical context",
                "Explain how prior choices shape current possibilities.",
                [
                    "Sequence, timing, contingency, and critical junctures",
                    "Institutional memory and inherited infrastructure",
                    "Long-duration processes and presentism",
                ],
            ),
            (
                "Policy and intervention transfer",
                "Assess whether an apparent success travels across contexts.",
                [
                    "Mechanism versus surface feature",
                    "Capacity, culture, politics, resources, and scale",
                    "Adaptation, fidelity, and unintended consequences",
                ],
            ),
            (
                "Cross-case synthesis",
                "Use cases to refine theory and practical judgment.",
                [
                    "Pattern matching and rival explanations",
                    "Scope conditions and cautious generalization",
                    "Lessons, non-lessons, and new questions",
                ],
            ),
        ],
    ),
    (
        "Collaborative Inquiry and Community-Engaged Practice",
        "Interdisciplinary work depends on collaboration across expertise, status, language, and institutional boundaries. Students learn practical structures for shared inquiry, conflict navigation, and accountable partnership.",
        [
            (
                "Team formation and roles",
                "Build a team whose diversity is connected to the work.",
                [
                    "Skills and perspective inventory",
                    "Roles, responsibilities, decision rights, and rotation",
                    "Working agreements and psychological safety",
                ],
            ),
            (
                "Communication across disciplines",
                "Translate concepts and evidence without oversimplifying.",
                [
                    "Jargon audits, glossaries, and teach-backs",
                    "Questions for clarification versus challenge",
                    "Visual models and boundary objects",
                ],
            ),
            (
                "Collaborative research process",
                "Coordinate interdependent tasks and maintain a shared evidence base.",
                [
                    "Research questions, task boards, meeting agendas, and decision logs",
                    "Shared notes, source library, data management, and version control",
                    "Integration checkpoints and peer review",
                ],
            ),
            (
                "Conflict and disagreement",
                "Use intellectual tension productively while addressing unequal participation.",
                [
                    "Task, process, relationship, and value conflict",
                    "Active listening, negotiation, and facilitated dialogue",
                    "Dissent records, escalation, and repair",
                ],
            ),
            (
                "Community partnership",
                "Co-design the project with people affected by the issue.",
                [
                    "Partner goals, reciprocity, and realistic expectations",
                    "Accessible participation and compensation",
                    "Feedback, return of results, sustainability, and exit planning",
                ],
            ),
        ],
    ),
    (
        "From Understanding to Action: Design, Foresight, and Evaluation",
        "Interdisciplinary analysis should inform action without promising a perfect solution. Students learn to develop intervention portfolios, explore alternative futures, evaluate feasibility and consequences, and plan for learning.",
        [
            (
                "Theory of change",
                "Connect activities to outputs, outcomes, and long-term effects.",
                [
                    "Problem drivers, intervention mechanisms, and assumptions",
                    "Causal pathways and enabling conditions",
                    "Indicators, evidence, and rival explanations",
                ],
            ),
            (
                "Alternative generation",
                "Develop multiple strategies at different system levels.",
                [
                    "Policy, institutional, technological, cultural, and behavioral interventions",
                    "Prevention, mitigation, adaptation, and transformation",
                    "Single actions versus coordinated portfolios",
                ],
            ),
            (
                "Futures and scenarios",
                "Explore uncertainty rather than extrapolating one expected future.",
                [
                    "Drivers, critical uncertainties, and scenario logics",
                    "Backcasting and preferred futures",
                    "Wild cards, signposts, and adaptive pathways",
                ],
            ),
            (
                "Evaluation and tradeoffs",
                "Compare options using explicit criteria and multiple stakeholder perspectives.",
                [
                    "Effectiveness, equity, feasibility, legitimacy, cost, risk, and reversibility",
                    "Multi-criteria matrices and sensitivity",
                    "Distributional and second-order consequences",
                ],
            ),
            (
                "Learning implementation",
                "Design pilots, safeguards, feedback, and revision.",
                [
                    "Minimum viable intervention and staged commitment",
                    "Monitoring, leading indicators, and stop/pivot/scale rules",
                    "Governance, ownership, resources, and handoff",
                ],
            ),
        ],
    ),
    (
        "Synthesis, Public Communication, and Reflective Integration",
        "The final module turns interdisciplinary inquiry into a coherent contribution. Students create a public-facing product and an academic synthesis that explain the integrated insight, evidence, uncertainty, ethical commitments, and next steps.",
        [
            (
                "Interdisciplinary argument",
                "Build a claim that depends on genuine integration.",
                [
                    "Problem statement, disciplinary insights, conflicts, and common ground",
                    "Integrated framework and new understanding",
                    "Evidence, warrants, counterarguments, and limitations",
                ],
            ),
            (
                "Genre and audience",
                "Select forms that fit the people who will use or experience the work.",
                [
                    "Research paper, policy brief, exhibition, documentary, podcast, website, or public forum",
                    "Academic, community, professional, and policy audiences",
                    "Accessibility, language, media, and cultural context",
                ],
            ),
            (
                "Visual and narrative communication",
                "Make complexity intelligible without flattening uncertainty or disagreement.",
                [
                    "System maps, timelines, case comparisons, data displays, and scenarios",
                    "Story structure, examples, and human experience",
                    "Source attribution, uncertainty cues, and ethical representation",
                ],
            ),
            (
                "Public dialogue and feedback",
                "Treat communication as exchange rather than one-way dissemination.",
                [
                    "Presentation, facilitation, questions, and listening",
                    "Partner review and community response",
                    "Revision, accountability, and disagreement",
                ],
            ),
            (
                "Reflective integration",
                "Articulate how the inquiry changed the student’s thinking and practice.",
                [
                    "Evolution of assumptions and disciplinary identity",
                    "Team process, failures, tensions, and learning",
                    "Transfer to future study, citizenship, and work",
                ],
            ),
        ],
    ),
]


if __name__ == "__main__":
    write_seed(
        "interdisciplinary-topics-course",
        "Interdisciplinary Topics Course",
        DESC,
        "b4c5d6e7-8f9a-4b65-8e45-5c6d7e8f9a65",
        "intpjson",
        UNITS,
        "interdisciplinary_topics_course",
    )
