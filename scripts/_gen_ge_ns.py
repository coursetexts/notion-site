"""Natural Science with Lab curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "Natural Science with Lab is an interdisciplinary first-year laboratory course that introduces "
    "students to scientific inquiry through biology, chemistry, physics, and environmental science. "
    "Students learn how to ask testable questions, measure carefully, work safely, analyze "
    "uncertainty, interpret data, use models, and communicate scientific findings. The course is "
    "designed for Liberal Arts students who need a rigorous lab-science foundation without assuming "
    "a single major track."
)

UNITS = [
    (
        "Science as a Way of Knowing",
        "This opening unit frames natural science as a disciplined way of asking questions about the physical, chemical, biological, and Earth systems around us. Students learn that science is not a list of facts; it is a method for building, testing, revising, and communicating explanations.",
        [
            (
                "Observation, inference, and explanation",
                "Students learn to separate what is directly observed from the interpretations and models built from those observations.",
                [
                    "Qualitative and quantitative observations",
                    "Inference versus assumption",
                    "Evidence-based explanation",
                ],
            ),
            (
                "The scientific method and scientific inquiry",
                "This subtopic introduces the cycle of questioning, prediction, testing, analysis, and revision used across laboratory sciences.",
                [
                    "Questions and hypotheses",
                    "Prediction and testability",
                    "Iteration and revision",
                ],
            ),
            (
                "Scientific literacy and source evaluation",
                "Students practice reading scientific claims carefully, identifying credible sources, and recognizing uncertainty in public science communication.",
                [
                    "Peer review and authority",
                    "Correlation, causation, and overclaiming",
                    "Science news and misinformation",
                ],
            ),
        ],
    ),
    (
        "Measurement, Units, Uncertainty, and Significant Figures",
        "Laboratory science depends on careful measurement. This unit gives students the habits needed to collect data that are meaningful, comparable, and honest about their limits.",
        [
            (
                "Units and dimensional reasoning",
                "Students learn to use SI units, unit conversions, dimensional analysis, and scale reasoning as basic tools for scientific problem solving.",
                [
                    "SI base and derived units",
                    "Unit conversion and dimensional checks",
                    "Orders of magnitude and scale",
                ],
            ),
            (
                "Accuracy, precision, and uncertainty",
                "This subtopic teaches students to distinguish closeness to the true value from repeatability, and to communicate uncertainty appropriately.",
                [
                    "Systematic and random error",
                    "Instrument resolution",
                    "Uncertainty intervals",
                ],
            ),
            (
                "Significant figures and scientific notation",
                "Students learn how reported numbers carry information about measurement quality and how to avoid false precision.",
                [
                    "Rounding rules",
                    "Propagation in simple calculations",
                    "Scientific notation in lab records",
                ],
            ),
        ],
    ),
    (
        "Laboratory Safety, Ethics, and Scientific Responsibility",
        "This lab course treats safety and ethics as core scientific skills. Students learn how to protect themselves, classmates, organisms, communities, and the integrity of the evidence they produce.",
        [
            (
                "Safety culture and hazard recognition",
                "Students learn to identify physical, chemical, biological, and environmental hazards before beginning any experiment.",
                [
                    "Safety Data Sheets",
                    "PPE and engineering controls",
                    "Emergency response basics",
                ],
            ),
            (
                "Ethical conduct in the laboratory",
                "This subtopic introduces honesty in data recording, responsible collaboration, respect for living systems, and appropriate handling of uncertainty.",
                [
                    "Data integrity",
                    "Authorship and collaboration",
                    "Animal, human, and environmental considerations",
                ],
            ),
            (
                "Waste, contamination, and sustainability",
                "Students learn that lab work has material consequences and that safe disposal and contamination control are part of responsible science.",
                [
                    "Chemical and biological waste streams",
                    "Cross-contamination prevention",
                    "Green chemistry and resource stewardship",
                ],
            ),
        ],
    ),
    (
        "Experimental Design and Hypothesis Testing",
        "Students move from curiosity to controlled investigation. This unit teaches them how to design experiments that can actually answer a question, not merely produce activity.",
        [
            (
                "Variables, controls, and comparisons",
                "Students learn how independent variables, dependent variables, control groups, constants, and comparison conditions shape interpretability.",
                [
                    "Independent and dependent variables",
                    "Positive and negative controls",
                    "Confounding variables",
                ],
            ),
            (
                "Hypothesis testing in practice",
                "This subtopic turns hypotheses into testable predictions and introduces the logic of rejecting, supporting, or revising explanations.",
                [
                    "Null and alternative hypotheses",
                    "Operational definitions",
                    "Criteria for evidence",
                ],
            ),
            (
                "Replication and reproducibility",
                "Students learn why repeated trials, transparent protocols, and reproducible methods matter for trustworthy science.",
                [
                    "Technical and biological replicates",
                    "Protocol clarity",
                    "Reproducible workflows",
                ],
            ),
        ],
    ),
    (
        "Data Collection, Statistics, and Visualization",
        "This unit equips students to transform raw observations into interpretable evidence. They learn the basics of organizing data, summarizing variation, visualizing patterns, and making careful claims.",
        [
            (
                "Data tables and metadata",
                "Students learn to organize lab data so another person could understand what was measured, how, when, and under what conditions.",
                [
                    "Tidy data principles",
                    "Metadata and labels",
                    "Lab notebook conventions",
                ],
            ),
            (
                "Descriptive statistics and error bars",
                "This subtopic introduces means, medians, ranges, standard deviation, standard error, and confidence intervals at an introductory level.",
                [
                    "Central tendency",
                    "Variation and spread",
                    "Uncertainty visualization",
                ],
            ),
            (
                "Graphs and scientific storytelling",
                "Students practice choosing the right visual form and avoiding misleading charts.",
                [
                    "Scatterplots and line graphs",
                    "Bar charts and boxplots",
                    "Axis labels, captions, and visual integrity",
                ],
            ),
        ],
    ),
    (
        "Matter, Atoms, Molecules, and Chemical Change",
        "Chemistry provides the language of matter and transformation. This unit gives students enough chemical foundation to understand substances, reactions, solutions, and laboratory analysis.",
        [
            (
                "Atomic structure and periodic patterns",
                "Students connect atomic structure to periodic trends and the behavior of elements.",
                [
                    "Protons, neutrons, and electrons",
                    "Electron configuration",
                    "Periodic trends",
                ],
            ),
            (
                "Bonding, molecules, and intermolecular forces",
                "This subtopic explains how atoms combine and why molecular structure influences properties.",
                [
                    "Ionic and covalent bonding",
                    "Molecular geometry",
                    "Polarity and intermolecular forces",
                ],
            ),
            (
                "Chemical reactions and stoichiometry",
                "Students learn to represent reactions, balance equations, and reason quantitatively about reactants and products.",
                [
                    "Balanced equations",
                    "Moles and molar mass",
                    "Limiting reactants and yield",
                ],
            ),
        ],
    ),
    (
        "Energy, Thermodynamics, and Transformations",
        "Energy links physics, chemistry, biology, and Earth systems. This unit helps students track how energy is stored, transferred, degraded, and conserved across natural processes.",
        [
            (
                "Forms of energy and conservation",
                "Students learn to identify kinetic, potential, thermal, chemical, electrical, and radiant energy in systems.",
                [
                    "Conservation of energy",
                    "Energy transfer and transformation",
                    "System boundaries",
                ],
            ),
            (
                "Heat, temperature, and thermodynamics",
                "This subtopic introduces temperature, heat flow, specific heat, phase changes, and entropy as practical lab ideas.",
                [
                    "Temperature versus heat",
                    "Calorimetry",
                    "Entropy and spontaneity",
                ],
            ),
            (
                "Energy in living and environmental systems",
                "Students connect thermodynamic principles to metabolism, photosynthesis, ecosystems, and climate.",
                [
                    "Cellular respiration and photosynthesis",
                    "Food webs and trophic efficiency",
                    "Radiation balance and greenhouse effect",
                ],
            ),
        ],
    ),
    (
        "Forces, Motion, Waves, and Physical Systems",
        "Physics gives students tools for analyzing motion, force, energy, waves, and interactions. This unit emphasizes measurable relationships and model-based reasoning.",
        [
            (
                "Motion and force models",
                "Students use graphs, vectors, and Newton's laws to describe and explain motion.",
                [
                    "Position, velocity, and acceleration",
                    "Free-body diagrams",
                    "Newton's laws",
                ],
            ),
            (
                "Work, energy, and momentum",
                "This subtopic connects physical interactions with conservation principles and measurable system changes.",
                [
                    "Work and kinetic energy",
                    "Potential energy",
                    "Momentum and impulse",
                ],
            ),
            (
                "Waves and oscillations",
                "Students study wave properties that connect sound, light, water waves, seismic motion, and instrumentation.",
                [
                    "Frequency, wavelength, and amplitude",
                    "Interference and resonance",
                    "Sound and light as waves",
                ],
            ),
        ],
    ),
    (
        "Electricity, Magnetism, Light, and Instrumentation",
        "Modern lab science depends on instruments that convert physical interactions into measurable signals. This unit introduces basic electricity, magnetism, optics, and sensors.",
        [
            (
                "Electric circuits and measurement",
                "Students learn how voltage, current, resistance, and simple circuits support measurement and instrumentation.",
                [
                    "Ohm's law",
                    "Series and parallel circuits",
                    "Multimeters and sensors",
                ],
            ),
            (
                "Magnetism and electromagnetic induction",
                "This subtopic introduces the relationships among currents, fields, induction, generators, and common instruments.",
                [
                    "Magnetic fields",
                    "Electromagnetic induction",
                    "Motors and generators",
                ],
            ),
            (
                "Light, optics, and spectroscopy",
                "Students connect light behavior to microscopy, cameras, colorimetry, spectrophotometry, and remote sensing.",
                [
                    "Reflection and refraction",
                    "Lenses and image formation",
                    "Absorption and emission spectra",
                ],
            ),
        ],
    ),
    (
        "Cells, Biomolecules, and Microscopy",
        "Biology begins with the cell as the basic unit of life. This unit links molecular structure, cellular organization, microscopy, and experimental observation.",
        [
            (
                "Biomolecules and water",
                "Students learn how carbohydrates, lipids, proteins, nucleic acids, and water support life processes.",
                [
                    "Water properties",
                    "Macromolecule structure and function",
                    "Enzymes and catalysis",
                ],
            ),
            (
                "Cell structure and function",
                "This subtopic introduces membranes, organelles, cell specialization, and transport.",
                [
                    "Prokaryotic and eukaryotic cells",
                    "Membranes and transport",
                    "Organelles and compartmentalization",
                ],
            ),
            (
                "Microscopy and biological observation",
                "Students learn to prepare specimens, use microscopes responsibly, and connect image evidence to biological claims.",
                [
                    "Light microscopy",
                    "Magnification and resolution",
                    "Staining and specimen preparation",
                ],
            ),
        ],
    ),
    (
        "Genetics, Evolution, and Biodiversity",
        "This unit connects inheritance, variation, natural selection, and the diversity of life. Students learn how biological patterns emerge across generations and ecosystems.",
        [
            (
                "DNA, genes, and inheritance",
                "Students learn the basic flow of genetic information and how traits are transmitted and expressed.",
                [
                    "DNA structure and replication",
                    "Transcription and translation",
                    "Mendelian inheritance",
                ],
            ),
            (
                "Evolution and natural selection",
                "This subtopic explains how heritable variation, differential survival, and reproduction shape populations over time.",
                [
                    "Variation and fitness",
                    "Natural selection",
                    "Speciation and phylogeny",
                ],
            ),
            (
                "Biodiversity and classification",
                "Students learn why biodiversity matters scientifically and practically, and how organisms are classified.",
                [
                    "Domains and kingdoms",
                    "Phylogenetic trees",
                    "Biodiversity measurement",
                ],
            ),
        ],
    ),
    (
        "Ecology, Earth Systems, and Environmental Change",
        "Natural science is strongest when students can connect organisms, matter, energy, Earth processes, and human impacts. This unit integrates ecology and environmental science.",
        [
            (
                "Ecosystems and biogeochemical cycles",
                "Students learn how matter and energy move through ecosystems and Earth systems.",
                [
                    "Carbon, nitrogen, phosphorus, and water cycles",
                    "Food webs",
                    "Primary productivity",
                ],
            ),
            (
                "Climate, weather, and Earth observations",
                "This subtopic introduces climate drivers, weather patterns, satellite observation, and long-term environmental data.",
                [
                    "Atmosphere and ocean interactions",
                    "Climate versus weather",
                    "Remote sensing and climate records",
                ],
            ),
            (
                "Human impacts and sustainability",
                "Students examine pollution, land use, resource consumption, biodiversity loss, and solutions grounded in evidence.",
                [
                    "Pollution pathways",
                    "Resource use and waste",
                    "Sustainability and resilience",
                ],
            ),
        ],
    ),
    (
        "Water, Air, Soil, and Field Methods",
        "Field science asks students to measure real systems outside highly controlled lab conditions. This unit introduces practical sampling, environmental monitoring, and field-data interpretation.",
        [
            (
                "Sampling design in the field",
                "Students learn how location, timing, replication, and sampling bias shape conclusions about natural systems.",
                [
                    "Transects and quadrats",
                    "Random and stratified sampling",
                    "Spatial and temporal variation",
                ],
            ),
            (
                "Water and soil measurements",
                "This subtopic introduces common field and bench measurements used in environmental science.",
                [
                    "pH, conductivity, and dissolved oxygen",
                    "Turbidity and nutrients",
                    "Soil texture and moisture",
                ],
            ),
            (
                "Air, weather, and microclimate data",
                "Students connect local atmospheric measurements to larger environmental processes.",
                [
                    "Temperature, humidity, and pressure",
                    "Wind and precipitation",
                    "Particulates and air quality indicators",
                ],
            ),
        ],
    ),
    (
        "Core Laboratory Techniques Across the Sciences",
        "Students need a practical toolkit that transfers across biology, chemistry, physics, and environmental laboratories. This unit focuses on technique, calibration, and disciplined execution.",
        [
            (
                "Mass, volume, and solution preparation",
                "Students learn the basic manipulations behind reliable chemical and biological lab work.",
                [
                    "Balances and weighing",
                    "Pipettes and volumetric glassware",
                    "Molarity and dilution",
                ],
            ),
            (
                "Separation and identification methods",
                "This subtopic introduces common methods for separating, identifying, or quantifying components of mixtures.",
                [
                    "Filtration and centrifugation",
                    "Chromatography",
                    "Spectrophotometry",
                ],
            ),
            (
                "Calibration and quality control",
                "Students learn that instruments and methods must be checked against standards before data can be trusted.",
                [
                    "Calibration curves",
                    "Blanks and standards",
                    "Quality control samples",
                ],
            ),
        ],
    ),
    (
        "Models, Simulations, and Computational Thinking",
        "Models help scientists reason about systems too small, large, fast, slow, dangerous, or complex to observe directly. This unit introduces conceptual, mathematical, physical, and computational models.",
        [
            (
                "Conceptual and mathematical models",
                "Students learn how models simplify reality while preserving relationships useful for prediction and explanation.",
                [
                    "Assumptions and simplifications",
                    "Variables and parameters",
                    "Model validation",
                ],
            ),
            (
                "Interactive simulations",
                "This subtopic uses simulation tools to explore systems such as circuits, molecules, populations, climate, and waves.",
                [
                    "Parameter exploration",
                    "Virtual experiments",
                    "Model limitations",
                ],
            ),
            (
                "Computational data habits",
                "Students build basic comfort with spreadsheets or notebooks for calculation, plotting, and reproducible analysis.",
                [
                    "Formulas and data cleaning",
                    "Versioned files",
                    "Reproducible plots",
                ],
            ),
        ],
    ),
    (
        "Scientific Communication and Lab Reports",
        "Science becomes useful when methods, evidence, uncertainty, and conclusions are communicated clearly. This unit teaches students to write and present like beginning scientists.",
        [
            (
                "Lab report structure",
                "Students learn the purpose of each section: abstract, introduction, methods, results, discussion, conclusion, and references.",
                [
                    "Research question and rationale",
                    "Methods detail and reproducibility",
                    "Results versus interpretation",
                ],
            ),
            (
                "Figures, tables, and captions",
                "This subtopic teaches students to present data so readers can understand the claim without guessing.",
                [
                    "Figure captions",
                    "Table design",
                    "Error bars and notes",
                ],
            ),
            (
                "Argument, citation, and revision",
                "Students learn to support conclusions with evidence, cite sources, and improve work through feedback.",
                [
                    "Claim-evidence-reasoning",
                    "Citation basics",
                    "Peer review and revision",
                ],
            ),
        ],
    ),
    (
        "Science, Society, Risk, and Decision-Making",
        "Natural science informs real decisions about health, technology, climate, energy, food, water, and safety. This unit helps students connect evidence to public choices without oversimplifying uncertainty.",
        [
            (
                "Risk, probability, and uncertainty",
                "Students learn how scientists and decision-makers reason about likelihood, consequence, exposure, and uncertainty.",
                [
                    "Hazard versus risk",
                    "Dose-response thinking",
                    "Precaution and tradeoffs",
                ],
            ),
            (
                "Science policy and public trust",
                "This subtopic examines how scientific evidence moves through agencies, media, communities, and policy debates.",
                [
                    "Regulation and standards",
                    "Expertise and public communication",
                    "Conflicts of interest",
                ],
            ),
            (
                "Current scientific issues",
                "Students apply course tools to contemporary issues where biology, chemistry, physics, and environmental science intersect.",
                [
                    "Climate and energy transitions",
                    "Water quality and public health",
                    "Biotechnology and emerging technologies",
                ],
            ),
        ],
    ),
    (
        "Integrated Capstone Lab Investigation",
        "The course culminates in an investigation where students ask a question, design a method, collect data, analyze uncertainty, and communicate results. The goal is to practice science as a complete workflow.",
        [
            (
                "Question, background, and design proposal",
                "Students formulate a focused question, review relevant concepts, and propose a safe, feasible investigation.",
                [
                    "Researchable question",
                    "Background source map",
                    "Variables, controls, and safety plan",
                ],
            ),
            (
                "Data collection and analysis",
                "This subtopic guides students through careful measurement, troubleshooting, statistical summary, and visualization.",
                [
                    "Protocol execution",
                    "Data cleaning and analysis",
                    "Uncertainty and error evaluation",
                ],
            ),
            (
                "Poster, report, and reflection",
                "Students present the investigation in a lab report or poster and reflect on limitations, ethics, and future work.",
                [
                    "Scientific poster or report",
                    "Oral explanation",
                    "Limitations and next steps",
                ],
            ),
        ],
    ),
]


if __name__ == "__main__":
    write_seed(
        "natural-science-with-lab",
        "Natural Science with Lab",
        DESC,
        "f8a9b0c1-2d3e-4f69-8c89-9a0b1c2d3e69",
        "nscljson",
        UNITS,
        "natural_science_with_lab",
    )
