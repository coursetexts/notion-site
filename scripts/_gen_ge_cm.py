"""College Mathematics / Quantitative Reasoning curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "College Mathematics / Quantitative Reasoning builds the mathematical confidence and "
    "judgment needed for college, work, citizenship, and personal decisions. Students learn to "
    "estimate, model, interpret data, reason with probability, evaluate financial and public claims, "
    "communicate uncertainty, and critique quantitative arguments in the real world."
)

UNITS = [
    (
        "Quantitative Literacy and Mathematical Habits of Mind",
        "This opening section frames quantitative reasoning as a civic, professional, and personal survival skill. Students learn to approach numbers with curiosity, skepticism, and confidence rather than fear.",
        [
            (
                "What Counts as Quantitative Reasoning",
                "Students learn that quantitative reasoning is the use of numbers, patterns, evidence, and models to make sense of the world.",
                [
                    "Numeracy, data literacy, modeling, and argument",
                    "Exact answers versus useful approximations",
                    "Context, assumptions, and interpretation",
                    "When a number is evidence and when it is noise",
                ],
            ),
            (
                "Sense-Making and Estimation Culture",
                "The point is to check whether results are plausible before trusting a calculator or chart.",
                [
                    "Order of magnitude thinking",
                    "Back-of-the-envelope calculations",
                    "Benchmarks and reference values",
                    "Explaining reasoning in words",
                ],
            ),
            (
                "Learning Math Strategically",
                "Students build habits that make later problem-solving less brittle.",
                [
                    "Worked examples and deliberate practice",
                    "Error analysis and correction logs",
                    "Multiple representations",
                    "Study routines from A Mind for Numbers",
                ],
            ),
        ],
    ),
    (
        "Numeracy, Estimation, Units, and Proportional Reasoning",
        "This section teaches everyday number sense. Students practice moving between fractions, decimals, percentages, units, ratios, and real-world comparisons.",
        [
            (
                "Number Sense and Mental Math",
                "Students develop fluency with arithmetic that supports fast plausibility checks.",
                [
                    "Fractions, decimals, percentages, and scientific notation",
                    "Rounding and significant figures",
                    "Unit conversions and dimensional analysis",
                    "Absolute versus relative change",
                ],
            ),
            (
                "Ratios, Rates, and Proportions",
                "Ratios and rates are the grammar of many public claims, from prices to health risks.",
                [
                    "Unit rates and per-capita comparisons",
                    "Scale factors and proportional relationships",
                    "Index numbers and normalization",
                    "Common denominator thinking",
                ],
            ),
            (
                "Estimation in Context",
                "Students learn to estimate quantities when exact data are unavailable or unnecessary.",
                [
                    "Fermi problems",
                    "Bounds, assumptions, and scenarios",
                    "Checking calculator output",
                    "Communicating uncertainty in estimates",
                ],
            ),
        ],
    ),
    (
        "Algebra Review: Expressions, Equations, and Inequalities",
        "Algebra is treated as a language for describing constraints and relationships. The aim is not symbolic manipulation for its own sake, but using algebra to represent real problems clearly.",
        [
            (
                "Expressions and Formulas",
                "Students learn to parse and evaluate formulas used in finance, science, and public information.",
                [
                    "Variables, constants, terms, and coefficients",
                    "Substitution and evaluation",
                    "Rearranging formulas",
                    "Interpreting units in formulas",
                ],
            ),
            (
                "Equations and Inequalities",
                "This subtopic reviews solving while emphasizing meaning.",
                [
                    "Linear equations and inequalities",
                    "Systems of equations",
                    "Constraints and feasible values",
                    "Checking solutions in context",
                ],
            ),
            (
                "Algebraic Modeling",
                "Students translate word problems into symbolic and tabular forms.",
                [
                    "Defining variables",
                    "Building equations from assumptions",
                    "Comparing scenarios",
                    "Sensitivity to assumptions",
                ],
            ),
        ],
    ),
    (
        "Functions, Graphs, and Change",
        "Functions help students describe relationships and change. This section connects tables, equations, graphs, and verbal descriptions.",
        [
            (
                "Representing Relationships",
                "Students learn to move between forms of the same relationship.",
                [
                    "Tables, graphs, formulas, and words",
                    "Independent and dependent variables",
                    "Domain, range, and constraints",
                    "Function notation as naming, not mystery",
                ],
            ),
            (
                "Reading Graphs Critically",
                "Graphs persuade; students learn to read scales, axes, trends, and distortions.",
                [
                    "Slope and intercepts",
                    "Nonlinear shape and turning points",
                    "Axis manipulation and visual exaggeration",
                    "Graph choice and audience",
                ],
            ),
            (
                "Rates of Change",
                "Students use rates to describe motion, cost, growth, and social change.",
                [
                    "Average rate of change",
                    "Slope as unit rate",
                    "Increasing, decreasing, and constant relationships",
                    "Interpreting change in context",
                ],
            ),
        ],
    ),
    (
        "Linear, Exponential, and Logarithmic Models",
        "This unit compares common models students encounter in finance, science, technology, population, and public debate. Students learn that choosing a model is a claim about how change works.",
        [
            (
                "Linear Models",
                "Linear models are simple, useful, and often overused; students learn when they fit.",
                [
                    "Slope and intercept interpretation",
                    "Break-even and cost-revenue models",
                    "Linear trend lines",
                    "Limits of extrapolation",
                ],
            ),
            (
                "Exponential Growth and Decay",
                "Students examine growth processes where change compounds.",
                [
                    "Percent growth and decay",
                    "Doubling time and half-life",
                    "Compound interest and population growth",
                    "Virality, inflation, and resource growth",
                ],
            ),
            (
                "Logarithmic and Scale Models",
                "Students meet logarithms as tools for compressed scales and inverse exponential thinking.",
                [
                    "Log scales and orders of magnitude",
                    "pH, decibels, earthquakes, and information scale examples",
                    "Interpreting charts with log axes",
                    "When linear intuition fails",
                ],
            ),
        ],
    ),
    (
        "Geometry, Measurement, Scale, and Spatial Reasoning",
        "This section grounds quantitative reasoning in space, design, maps, and measurement. Students use geometry for practical comparison rather than abstract proof alone.",
        [
            (
                "Measurement and Units",
                "Students learn how measurement choices affect conclusions.",
                [
                    "Length, area, volume, density, and rates",
                    "Metric and U.S. customary conversions",
                    "Precision, accuracy, and measurement error",
                    "Dimensional reasoning",
                ],
            ),
            (
                "Geometry in Everyday Contexts",
                "Students apply geometric formulas to real objects and situations.",
                [
                    "Perimeter, area, surface area, and volume",
                    "Similarity, scale, and maps",
                    "Packaging, housing, materials, and layout examples",
                    "Optimization by geometry",
                ],
            ),
            (
                "Spatial Data and Maps",
                "Students interpret spatial visualizations with care.",
                [
                    "Scale bars, projections, and distortion",
                    "Density maps and choropleths",
                    "Distance, accessibility, and service areas",
                    "Geographic data ethics",
                ],
            ),
        ],
    ),
    (
        "Logic, Sets, and Argument Structure",
        "Logic gives students tools for evaluating claims before numbers even appear. This unit supports clear reasoning in math, writing, debate, and decision-making.",
        [
            (
                "Statements, Conditions, and Validity",
                "Students learn the structure of logical claims.",
                [
                    "If-then statements",
                    "Necessary and sufficient conditions",
                    "Converse, inverse, and contrapositive",
                    "Validity versus truth",
                ],
            ),
            (
                "Sets, Categories, and Counting Arguments",
                "Students learn how categories shape conclusions.",
                [
                    "Sets, subsets, unions, intersections, and complements",
                    "Venn diagrams",
                    "Inclusion-exclusion intuition",
                    "Classification errors and boundary cases",
                ],
            ),
            (
                "Fallacies and Quantitative Claims",
                "Students identify reasoning traps in arguments that use numbers.",
                [
                    "Correlation versus causation",
                    "Base-rate neglect",
                    "False precision",
                    "Anecdote, cherry-picking, and misleading averages",
                ],
            ),
        ],
    ),
    (
        "Probability, Risk, and Counting",
        "Probability helps students reason when outcomes are uncertain. The focus is interpretation, risk, and decision-making rather than long formula lists.",
        [
            (
                "Basic Probability Ideas",
                "Students learn the language of chance and uncertainty.",
                [
                    "Events, sample spaces, and probability rules",
                    "Independent and dependent events",
                    "Conditional probability",
                    "Mutually exclusive versus overlapping events",
                ],
            ),
            (
                "Counting and Expected Value",
                "Students learn simple counting tools and why expected value matters.",
                [
                    "Combinations, permutations, and tree diagrams",
                    "Expected value and long-run average",
                    "Games, lotteries, insurance, and warranties",
                    "Risk preference and non-monetary consequences",
                ],
            ),
            (
                "Risk Communication",
                "Students practice interpreting risk claims in health, finance, weather, and policy.",
                [
                    "Absolute and relative risk",
                    "Odds, rates, and probabilities",
                    "False positives and screening tests",
                    "Communicating uncertainty honestly",
                ],
            ),
        ],
    ),
    (
        "Descriptive Statistics and Data Visualization",
        "This unit teaches students to summarize and visualize data responsibly. The goal is to see both signal and variation.",
        [
            (
                "Summaries of Center and Spread",
                "Students learn what different summaries reveal and hide.",
                [
                    "Mean, median, mode, and resistant summaries",
                    "Range, interquartile range, variance, and standard deviation",
                    "Outliers and skew",
                    "Choosing the right summary for the question",
                ],
            ),
            (
                "Distributions and Comparisons",
                "Students learn to compare groups, shapes, and variability.",
                [
                    "Histograms, boxplots, dotplots, and density shapes",
                    "Normal distribution intuition",
                    "Percentiles and z-scores",
                    "Comparing groups fairly",
                ],
            ),
            (
                "Visualization Choices",
                "Students build charts that clarify instead of decorate.",
                [
                    "Bar charts, line charts, scatterplots, and maps",
                    "Scales, baselines, labels, and color",
                    "Small multiples and dashboards",
                    "Avoiding chartjunk and distortion",
                ],
            ),
        ],
    ),
    (
        "Data Interpretation, Measurement, Bias, and Data Ethics",
        "This section teaches students to ask where data came from and what it can legitimately support. Good quantitative reasoning begins before analysis.",
        [
            (
                "Measurement and Operational Definitions",
                "Students learn that variables are constructed, not simply found.",
                [
                    "What is being measured",
                    "Proxy variables and hidden assumptions",
                    "Reliability and validity",
                    "Missing data and messy categories",
                ],
            ),
            (
                "Bias and Data Quality",
                "Students identify common ways data can mislead.",
                [
                    "Selection bias and survivorship bias",
                    "Response bias and measurement error",
                    "Confounding and omitted variables",
                    "Outliers, duplicates, and data cleaning",
                ],
            ),
            (
                "Ethics of Data Use",
                "Students examine power, privacy, and harm in quantitative work.",
                [
                    "Privacy, consent, and identifiability",
                    "Fairness and algorithmic bias",
                    "Data visualization ethics",
                    "Uncertainty, humility, and responsible claims",
                ],
            ),
        ],
    ),
    (
        "Sampling, Variability, and Introductory Inference",
        "This unit introduces inference gently. Students learn why samples vary and why uncertainty belongs in conclusions.",
        [
            (
                "Sampling and Populations",
                "Students learn the difference between sample information and population claims.",
                [
                    "Random samples and convenience samples",
                    "Sampling frames and nonresponse",
                    "Representative versus biased samples",
                    "Survey wording and mode effects",
                ],
            ),
            (
                "Sampling Variability",
                "This subtopic explains why different samples give different results.",
                [
                    "Simulation as intuition",
                    "Law of large numbers",
                    "Central limit theorem as a practical idea",
                    "Standard error and margin of error",
                ],
            ),
            (
                "Inference as Careful Claim-Making",
                "Students learn the meaning of confidence without overloading the course.",
                [
                    "Confidence intervals",
                    "Hypothesis tests as evidence checks",
                    "P-values as one measure, not a verdict",
                    "Statistical significance versus practical importance",
                ],
            ),
        ],
    ),
    (
        "Financial Mathematics: Interest, Loans, Savings, Inflation, and Risk",
        "This section makes quantitative reasoning immediately useful. Students learn to evaluate personal and public financial claims with mathematics.",
        [
            (
                "Interest and Compounding",
                "Students compare simple and compound growth.",
                [
                    "APR, APY, and compounding frequency",
                    "Savings, investments, and exponential growth",
                    "Inflation and real purchasing power",
                    "Present value and future value intuition",
                ],
            ),
            (
                "Loans and Debt",
                "Students learn how borrowing works and why small rate differences matter.",
                [
                    "Amortization and payment formulas",
                    "Credit cards, student loans, mortgages, and auto loans",
                    "Minimum payments and total cost",
                    "Debt risk and affordability ratios",
                ],
            ),
            (
                "Risk, Insurance, and Financial Decisions",
                "Students connect probability to financial planning.",
                [
                    "Emergency funds and risk pooling",
                    "Insurance premiums and deductibles",
                    "Diversification intuition",
                    "Scams, misleading rates, and behavioral traps",
                ],
            ),
        ],
    ),
    (
        "Mathematical Modeling With Spreadsheets and Technology",
        "This unit treats models as simplified stories about systems. Students learn to build transparent, editable models with assumptions visible.",
        [
            (
                "Spreadsheet Fluency",
                "Students learn a practical tool for repeated calculations and scenario analysis.",
                [
                    "Cells, formulas, references, and fill patterns",
                    "Tables, charts, and conditional formatting",
                    "Absolute and relative references",
                    "Auditing formulas and avoiding hardcoded assumptions",
                ],
            ),
            (
                "Model Building",
                "Students translate a real situation into variables, assumptions, relationships, and outputs.",
                [
                    "Inputs, outputs, parameters, and constraints",
                    "Linear, exponential, and piecewise models",
                    "Scenario and sensitivity analysis",
                    "Model limitations",
                ],
            ),
            (
                "Simulation and Exploration",
                "Students use technology to explore uncertainty and nonlinear outcomes.",
                [
                    "Random number simulation",
                    "Monte Carlo intuition",
                    "What-if tables",
                    "Visualizing model behavior",
                ],
            ),
        ],
    ),
    (
        "Decision-Making Under Uncertainty",
        "Quantitative reasoning supports decisions, not just answers. This section teaches students to compare options under uncertainty and trade-offs.",
        [
            (
                "Decision Trees and Expected Outcomes",
                "Students learn to structure decisions clearly.",
                [
                    "Options, outcomes, probabilities, and payoffs",
                    "Expected value and expected utility intuition",
                    "Regret and downside risk",
                    "Value of information",
                ],
            ),
            (
                "Trade-Offs and Constraints",
                "Students learn that decisions often involve multiple criteria.",
                [
                    "Cost-benefit thinking",
                    "Weighted scoring models",
                    "Constraints, feasibility, and opportunity cost",
                    "Sensitivity to assumptions",
                ],
            ),
            (
                "Risk and Communication",
                "Students practice presenting recommendations with uncertainty intact.",
                [
                    "Best case, base case, worst case",
                    "Ranges rather than false precision",
                    "Visual summaries for decisions",
                    "Ethical limits of quantification",
                ],
            ),
        ],
    ),
    (
        "Quantitative Arguments in Media, Science, and Public Policy",
        "This unit helps students become better readers of the world. They learn to critique claims in news, advertising, policy, research, and social media.",
        [
            (
                "Reading Quantitative Claims",
                "Students identify the claim, evidence, and inference in public arguments.",
                [
                    "Who is making the claim and why",
                    "Source, sample, and method",
                    "Comparison group and baseline",
                    "What the number does not say",
                ],
            ),
            (
                "Science and Health Claims",
                "Students learn to interpret studies without overclaiming.",
                [
                    "Correlation, causation, and experiments",
                    "Risk, screening, and treatment effects",
                    "Peer review and replication",
                    "Statistical versus clinical importance",
                ],
            ),
            (
                "Policy and Civic Claims",
                "Students practice evaluating numbers used in civic decisions.",
                [
                    "Budgets, taxes, crime, education, climate, and inequality data",
                    "Rates versus counts",
                    "Per-capita and inflation-adjusted comparisons",
                    "Equity, distribution, and subgroup analysis",
                ],
            ),
        ],
    ),
    (
        "Personal, Civic, and Ethical Numeracy",
        "This section asks what quantitative reasoning is for. Students connect numeracy to personal agency, democratic participation, and ethical responsibility.",
        [
            (
                "Personal Quantitative Agency",
                "Students use math to make practical life decisions.",
                [
                    "Budgeting and cash flow",
                    "Health metrics and risk",
                    "Time, productivity, and opportunity costs",
                    "Consumer decisions and warranties",
                ],
            ),
            (
                "Civic Numeracy",
                "Students learn to use public data without being overwhelmed by it.",
                [
                    "Voting data and polling",
                    "Public budgets and debt",
                    "Climate indicators and energy units",
                    "Inequality metrics and distributions",
                ],
            ),
            (
                "Ethics and Limits of Numbers",
                "Students consider what numbers can illuminate and what they can erase.",
                [
                    "Quantification and human values",
                    "Algorithmic decision-making",
                    "Privacy and surveillance",
                    "When qualitative evidence is essential",
                ],
            ),
        ],
    ),
    (
        "Communicating Quantitative Evidence",
        "Students learn that good analysis must be explainable. The goal is clear, honest communication for non-specialist audiences.",
        [
            (
                "Writing With Numbers",
                "Students practice integrating numbers into prose.",
                [
                    "Claim-evidence-reasoning structure",
                    "Clear definitions and units",
                    "Rounding and significant figures for readers",
                    "Explaining uncertainty and limitations",
                ],
            ),
            (
                "Presenting Data Visually",
                "Students design visuals that serve an argument.",
                [
                    "Choosing chart types",
                    "Annotation and narrative flow",
                    "Accessibility and color choices",
                    "Avoiding misleading visual emphasis",
                ],
            ),
            (
                "Speaking and Defending Findings",
                "Students learn to discuss quantitative work in public.",
                [
                    "Executive summaries and briefings",
                    "Anticipating objections",
                    "Answering questions about assumptions",
                    "Revising after feedback",
                ],
            ),
        ],
    ),
    (
        "Capstone: Model, Analyze, and Critique a Real-World Problem",
        "The capstone synthesizes the course. Students choose a real issue, gather or use data, build a simple model, interpret results, and communicate a defensible conclusion.",
        [
            (
                "Project Design",
                "Students define a question that can be answered with quantitative evidence.",
                [
                    "Research question and scope",
                    "Data source and measurement plan",
                    "Assumptions and limitations",
                    "Ethical considerations",
                ],
            ),
            (
                "Analysis and Modeling",
                "Students apply course tools to produce insight rather than just calculations.",
                [
                    "Numeracy and unit checks",
                    "Graphs and descriptive statistics",
                    "Probability, finance, or modeling component",
                    "Sensitivity and uncertainty analysis",
                ],
            ),
            (
                "Final Communication",
                "Students present conclusions with honesty and clarity.",
                [
                    "Written report or slide brief",
                    "Annotated visualizations",
                    "Recommendation or critique",
                    "Reflection on what the numbers cannot answer",
                ],
            ),
        ],
    ),
]


if __name__ == "__main__":
    write_seed(
        "college-mathematics-quantitative-reasoning",
        "College Mathematics / Quantitative Reasoning",
        DESC,
        "d0e1f2a3-4b5c-4d61-8a01-1e2f3a4b5c61",
        "cmqrjson",
        UNITS,
        "college_mathematics_quantitative_reasoning",
    )
