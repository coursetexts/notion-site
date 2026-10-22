"""Generate curated-course SQL from October 2026 topic-only STEM PDFs."""
from __future__ import annotations

import re
import sys
from pathlib import Path

from pypdf import PdfReader

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

PDF_DIR = Path(
    "/Users/eesha/.cursor/projects/Users-eesha-Desktop-may3-notion-site/"
    "attachments/a524a771-f81c-4a8e-831b-f7daf82a15ec"
)

COURSES = [
    {
        "pdf": "abstract_algebra_self_teachable_curriculum.pdf",
        "slug": "abstract-algebra",
        "title": "Abstract Algebra",
        "course_id": "a7f0f4a4-e459-489e-b589-6730df97b46b",
        "desc": "A proof-based algebra course covering groups, homomorphisms, quotient structures, group actions, rings, ideals, integral domains, fields, polynomial rings, factorization, field extensions, Galois theory, and applications.",
        "tag": "abalgzzjs",
        "file_slug": "abstract_algebra",
    },
    {
        "pdf": "biomechanics_self_teachable_curriculum.pdf",
        "slug": "biomechanics",
        "title": "Biomechanics",
        "course_id": "a31497c5-1b01-4681-b7d2-7a86d345cece",
        "desc": "A mechanics-based course on human movement and biological systems, including kinematics, kinetics, free-body analysis, joint and muscle mechanics, tissue mechanics, gait, motion measurement, injury, rehabilitation, and biomechanical modeling.",
        "tag": "biomechzzjs",
        "file_slug": "biomechanics",
    },
    {
        "pdf": "classical_mechanics_self_teachable_curriculum.pdf",
        "slug": "classical-mechanics",
        "title": "Classical Mechanics",
        "course_id": "d385f7d0-ad33-4193-b733-c0ea6878f3d2",
        "desc": "An analytical mechanics course covering Newtonian review, variational calculus, constraints, Lagrangian mechanics, central forces, rigid bodies, rotating frames, oscillations, Hamiltonian mechanics, canonical transformations, Hamilton-Jacobi theory, nonlinear dynamics, and computation.",
        "tag": "clmechzzjs",
        "file_slug": "classical_mechanics",
    },
    {
        "pdf": "communication_systems_self_teachable_curriculum.pdf",
        "slug": "communication-systems",
        "title": "Communication Systems",
        "course_id": "5cfca3c4-08c9-439b-9216-523a84e48660",
        "desc": "An analog and digital communications course covering signals, spectra, noise, modulation, sampling, PCM, digital modulation, detection, information theory, coding, multiplexing, and wireless systems.",
        "tag": "commsyszzjs",
        "file_slug": "communication_systems",
    },
    {
        "pdf": "complex_analysis_self_teachable_curriculum.pdf",
        "slug": "complex-analysis",
        "title": "Complex Analysis",
        "course_id": "57d790a4-90fb-4cfb-be84-50b15c6ce746",
        "desc": "A proof-based course on complex numbers, analytic functions, contour integration, Cauchy theory, power series, Laurent series, residues, conformal maps, harmonic functions, and applications.",
        "tag": "cplxanzzjs",
        "file_slug": "complex_analysis",
    },
    {
        "pdf": "data_structures_self_teachable_curriculum.pdf",
        "slug": "data-structures",
        "title": "Data Structures",
        "course_id": "dd188452-f875-4e6f-9439-01479cebab43",
        "desc": "A core programming course on arrays, linked lists, stacks, queues, trees, heaps, hash tables, graphs, sorting, algorithm analysis, recursion, iterators, and implementation tradeoffs.",
        "tag": "dstructzzjs",
        "file_slug": "data_structures",
    },
    {
        "pdf": "database_management_systems_self_teachable_curriculum.pdf",
        "slug": "database-management-systems",
        "title": "Database Management Systems",
        "course_id": "d45f4aa8-f18f-4e9b-85c2-55c0122775f5",
        "desc": "A database management course covering relational design, ER modeling, normalization, SQL, joins, procedures, triggers, transactions, indexing, performance, backup, recovery, NoSQL, administration, security, and a database project.",
        "tag": "dbmszzjs",
        "file_slug": "database_management_systems",
    },
    {
        "pdf": "database_systems_self_teachable_curriculum.pdf",
        "slug": "database-systems",
        "title": "Database Systems",
        "course_id": "f7e463b6-fec7-4b5a-a846-9ba86b954b7a",
        "desc": "A computer science database systems course covering relational theory, SQL, storage, indexing, query processing, query optimization, transactions, concurrency control, recovery, distributed databases, NoSQL, warehousing, and security.",
        "tag": "dbsyszzjs",
        "file_slug": "database_systems",
    },
    {
        "pdf": "differential_geometry_self_teachable_curriculum.pdf",
        "slug": "differential-geometry",
        "title": "Differential Geometry",
        "course_id": "85b08600-91f3-4cc9-a44b-bb92a11f2f72",
        "desc": "Differential geometry connects calculus, topology, and linear algebra to study curved spaces. The syllabus begins with curves and surfaces, then moves toward manifolds, tensors, metrics, connections, curvature, and global theorems.",
        "tag": "diffgeozzjs",
        "file_slug": "differential_geometry",
    },
    {
        "pdf": "digital_logic_design_self_teachable_curriculum.pdf",
        "slug": "digital-logic-design",
        "title": "Digital Logic Design",
        "course_id": "2a3909c7-910f-429f-aef1-e106fdaa7998",
        "desc": "Digital logic design is the bridge from binary abstraction to working hardware. The syllabus builds from number systems and Boolean algebra through combinational logic, sequential circuits, finite-state machines, HDL implementation, and testing.",
        "tag": "dldzzjs",
        "file_slug": "digital_logic_design",
    },
    {
        "pdf": "ecology_self_teachable_curriculum.pdf",
        "slug": "ecology",
        "title": "Ecology",
        "course_id": "c7d864bd-acd8-47a7-a0bb-3f010bfd8d96",
        "desc": "Ecology explains how organisms interact with each other and their physical environment across scales. The syllabus expands population, community, ecosystem, landscape, and applied ecology, with field methods and data interpretation woven throughout.",
        "tag": "ecologzzjs",
        "file_slug": "ecology",
    },
    {
        "pdf": "electronics_self_teachable_curriculum.pdf",
        "slug": "electronics",
        "title": "Electronics",
        "course_id": "69bfc918-6591-4663-a549-d25f3dfe48ec",
        "desc": "Electronics teaches how semiconductor devices become useful analog circuits. The syllabus links device physics to circuit models, biasing, small-signal analysis, amplifiers, op-amps, frequency response, feedback, power considerations, and lab practice.",
        "tag": "electzzjs",
        "file_slug": "electronics",
    },
    {
        "pdf": "engineering_economics_self_teachable_curriculum.pdf",
        "slug": "engineering-economics",
        "title": "Engineering Economics",
        "course_id": "20ab832f-acec-433c-8d3b-d6beb2692c5c",
        "desc": "Engineering Economics develops cash-flow analysis and decision methods—time value of money, equivalence, present/annual/future worth, rate of return, benefit-cost, depreciation, taxes, inflation, replacement, and risk—for evaluating engineering alternatives.",
        "tag": "engeconzzjs",
        "file_slug": "engineering_economics",
    },
    {
        "pdf": "evolutionary_biology_self_teachable_curriculum.pdf",
        "slug": "evolutionary-biology",
        "title": "Evolutionary Biology",
        "course_id": "3219e518-09f4-4fbb-b98f-07cd99e3256e",
        "desc": "Evolutionary biology explains how genetic variation, selection, drift, history, and ecology shape biological diversity. The syllabus combines population genetics, adaptation, speciation, phylogenetics, macroevolution, molecular evolution, and applied evolutionary thinking.",
        "tag": "evobiozzjs",
        "file_slug": "evolutionary_biology",
    },
    {
        "pdf": "it_project_management_self_teachable_curriculum.pdf",
        "slug": "it-project-management",
        "title": "IT Project Management",
        "course_id": "13f84b7c-ea5d-4a75-a6aa-2c042a0d30c2",
        "desc": "IT Project Management prepares students to plan and deliver technology work amid uncertainty, stakeholder pressure, technical risk, and changing requirements, balancing predictive and Agile approaches with practical governance and team communication.",
        "tag": "itpmzzjs",
        "file_slug": "it_project_management",
    },
    {
        "pdf": "mathematical_statistics_self_teachable_curriculum.pdf",
        "slug": "mathematical-statistics",
        "title": "Mathematical Statistics",
        "course_id": "89ea9f92-8d4d-4949-8f83-c411c7244a24",
        "desc": "A proof-aware course in probability-based statistical inference, estimation, testing, asymptotics, Bayesian ideas, and model-based reasoning.",
        "tag": "mathstatzzjs",
        "file_slug": "mathematical_statistics",
    },
    {
        "pdf": "mechanics_of_materials_self_teachable_curriculum.pdf",
        "slug": "mechanics-of-materials",
        "title": "Mechanics of Materials",
        "course_id": "627739e7-79a9-43a8-b2b8-99e5ef8f89ac",
        "desc": "A core solid mechanics course on stress, strain, deformation, torsion, bending, shear, transformations, deflection, and stability of structural and machine elements.",
        "tag": "mechmatzzjs",
        "file_slug": "mechanics_of_materials",
    },
    {
        "pdf": "microbiology_self_teachable_curriculum.pdf",
        "slug": "microbiology",
        "title": "Microbiology",
        "course_id": "fde06c08-43a0-43a0-8201-1588c39f452a",
        "desc": "A broad course on microbial structure, growth, metabolism, genetics, diversity, pathogenesis, immunity, antimicrobial control, diagnostics, and applied microbiology.",
        "tag": "microbzzjs",
        "file_slug": "microbiology",
    },
    {
        "pdf": "number_theory_self_teachable_curriculum.pdf",
        "slug": "number-theory",
        "title": "Number Theory",
        "course_id": "97846d63-e4d5-4aeb-b44c-704f2f7c63da",
        "desc": "Number Theory studies the structure and patterns of integers. The syllabus moves from divisibility and congruences to reciprocity, Diophantine problems, arithmetic functions, continued fractions, cryptographic applications, and a preview of algebraic methods.",
        "tag": "numthzzjs",
        "file_slug": "number_theory",
    },
    {
        "pdf": "numerical_analysis_self_teachable_curriculum.pdf",
        "slug": "numerical-analysis",
        "title": "Numerical Analysis",
        "course_id": "9f1068e3-26a5-4135-8f89-d5a36bb55437",
        "desc": "Numerical Analysis studies algorithms for approximating mathematical problems on computers. The syllabus emphasizes error, stability, convergence, algorithmic tradeoffs, and implementation in scientific computing environments.",
        "tag": "numanzzjs",
        "file_slug": "numerical_analysis",
    },
    {
        "pdf": "operating_systems_self_teachable_curriculum.pdf",
        "slug": "operating-systems",
        "title": "Operating Systems",
        "course_id": "f90fc775-f5ff-4ed2-af86-c791c1700a78",
        "desc": "A systems course on OS structure, system calls, processes, threads, scheduling, synchronization, deadlocks, memory, file systems, I/O, security, virtualization, and performance.",
        "tag": "opsyszzjs",
        "file_slug": "operating_systems",
    },
    {
        "pdf": "organic_chemistry_self_teachable_curriculum.pdf",
        "slug": "organic-chemistry",
        "title": "Organic Chemistry",
        "course_id": "6e92d64d-ee2f-4e00-a1f2-15eb7d4cc323",
        "desc": "A mechanism-centered course on organic structure, bonding, stereochemistry, acids and bases, substitution, elimination, addition, aromaticity, carbonyl chemistry, biomolecules, spectroscopy, synthesis, and lab reasoning.",
        "tag": "orgchezzjs",
        "file_slug": "organic_chemistry",
    },
    {
        "pdf": "organic_chemistry_i_self_teachable_curriculum.pdf",
        "slug": "organic-chemistry-i",
        "title": "Organic Chemistry I",
        "course_id": "79badb41-0d8d-44f6-83fa-1e32ea4ae69e",
        "desc": "An introductory organic chemistry course covering structure and bonding, resonance, acid-base chemistry, alkanes and cycloalkanes, stereochemistry, reaction mechanisms, alkenes and alkynes, substitution and elimination, alcohols/ethers/epoxides, and structure determination by IR and NMR spectroscopy.",
        "tag": "orgchizzjs",
        "file_slug": "organic_chemistry_i",
    },
    {
        "pdf": "organic_chemistry_ii_self_teachable_curriculum.pdf",
        "slug": "organic-chemistry-ii",
        "title": "Organic Chemistry II",
        "course_id": "7b4cb39e-f130-4bcb-bb47-2f7db73c0a84",
        "desc": "A second-semester organic chemistry course covering aromaticity and electrophilic aromatic substitution, carbonyl chemistry, carboxylic acids and derivatives, amines, enolate and condensation reactions, multistep synthesis, mass spectrometry and integrated spectroscopy, and organic chemistry of biomolecules.",
        "tag": "orgchiizzjs",
        "file_slug": "organic_chemistry_ii",
    },
    {
        "pdf": "probability_and_random_processes_self_teachable_curriculum.pdf",
        "slug": "probability-and-random-processes",
        "title": "Probability and Random Processes",
        "course_id": "e277c175-61a0-487d-98f2-25f031973da1",
        "desc": "Probability and Random Processes develops probability foundations through random variables, distributions, expectation, limit theorems, stochastic processes, Markov chains, random signals and noise, estimation, and engineering simulation.",
        "tag": "prprzzjs",
        "file_slug": "probability_and_random_processes",
    },
    {
        "pdf": "probability_and_statistics_for_engineers_self_teachable_curriculum.pdf",
        "slug": "probability-and-statistics-for-engineers",
        "title": "Probability and Statistics for Engineers",
        "course_id": "4e6074d2-8d41-4d91-afdd-1605a7516843",
        "desc": "Probability and Statistics for Engineers develops probability, distributions, sampling, estimation, hypothesis testing, regression, reliability, and statistical quality control for engineering data.",
        "tag": "prengzzjs",
        "file_slug": "probability_and_statistics_for_engineers",
    },
    {
        "pdf": "probability_theory_self_teachable_curriculum.pdf",
        "slug": "probability-theory",
        "title": "Probability Theory",
        "course_id": "d6f6d154-68dc-44ec-aba6-f42263ebeea7",
        "desc": "A rigorous probability course covering probability spaces, combinatorics, conditional probability, random variables, distributions, expectation, joint laws, transformations, convergence, limit theorems, and stochastic processes.",
        "tag": "prthzzjs",
        "file_slug": "probability_theory",
    },
    {
        "pdf": "quantum_mechanics_i_self_teachable_curriculum.pdf",
        "slug": "quantum-mechanics-i",
        "title": "Quantum Mechanics I",
        "course_id": "ecca54fb-7766-404d-9aa8-378bd965d5e5",
        "desc": "A first course in quantum mechanics covering wave-particle duality, wave functions, operators and observables, the Schrodinger equation, one-dimensional potentials, tunneling, the harmonic oscillator, Hilbert space, uncertainty, angular momentum, the hydrogen atom, spin, identical particles, and introductory approximation methods.",
        "tag": "qmizzjs",
        "file_slug": "quantum_mechanics_i",
    },
    {
        "pdf": "quantum_mechanics_ii_self_teachable_curriculum.pdf",
        "slug": "quantum-mechanics-ii",
        "title": "Quantum Mechanics II",
        "course_id": "debedfa1-d192-4f4a-8b51-cabf50445b5d",
        "desc": "An advanced quantum mechanics course covering symmetry and formalism review, time-independent and degenerate perturbation theory, variational and WKB methods, time-dependent perturbation theory, Fermi's golden rule, radiation-matter interaction, identical particles, angular momentum addition, many-electron atoms, scattering, and the Dirac equation.",
        "tag": "qmiizzjs",
        "file_slug": "quantum_mechanics_ii",
    },
    {
        "pdf": "real_analysis_self_teachable_curriculum.pdf",
        "slug": "real-analysis",
        "title": "Real Analysis",
        "course_id": "a5b6c7d8-9e0f-4a03-8b24-3c4d5e6f7a33",
        "desc": "Real Analysis turns calculus into a rigorous proof-based theory of limits, continuity, differentiation, integration, and convergence. It is central for advanced mathematics and supports mathematically rigorous economics.",
        "tag": "realanzzjs",
        "file_slug": "real_analysis",
    },
    {
        "pdf": "signals_and_systems_self_teachable_curriculum.pdf",
        "slug": "signals-and-systems",
        "title": "Signals and Systems",
        "course_id": "b98db445-4cc4-4ecb-b887-080d9dbd1a87",
        "desc": "Signals and Systems gives students the mathematical language for analyzing time-varying information and linear systems. It supports communications, controls, signal processing, circuits, and computer engineering applications.",
        "tag": "sigsyszzjs",
        "file_slug": "signals_and_systems",
    },
    {
        "pdf": "thermodynamics_self_teachable_curriculum.pdf",
        "slug": "thermodynamics",
        "title": "Thermodynamics",
        "course_id": "88a63345-bbe2-4829-b7e7-bf2567014aa3",
        "desc": "An engineering thermodynamics course on properties, energy, work, heat, first and second law analysis, entropy, exergy, cycles, mixtures, psychrometrics, combustion, and energy-system design.",
        "tag": "thermzzjs",
        "file_slug": "thermodynamics",
    },
]

MODULE_RE = re.compile(r"MODULE\s+(\d+)\s*/\s*(\d+)\s+TOPICS", re.I)
WHY_MODULE_RE = re.compile(
    r"WHY\s+IS\s+THIS\s+MODULE\s+ON\s+THE\s+LEARNING\s+PATH\s*\??",
    re.I,
)
WHY_TOPIC_RE = re.compile(r"WHY\s+IS\s+THIS\s+ON\s+THE\s+LEARNING\s+PATH\s*\??", re.I)
NUM_RE = re.compile(r"^\d{2}$")
PAGE_NUM_RE = re.compile(r"^[1-9]\d{0,2}$")
SKIP_EXACT = {
    "DEEP TOPIC LEARNING PATH",
    "STEM UNDERGRADUATE - DEEP TOPIC LEARNING PATH",
}


def norm_space(text: str, strip_page_num: bool = False) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if strip_page_num:
        cleaned = re.sub(r"\s+[1-9]\d{0,2}$", "", cleaned).strip()
    return cleaned


def page_body(text: str, course_title: str) -> str:
    lines = [ln.strip() for ln in text.splitlines()]
    title_upper = course_title.upper()
    compact_title = re.sub(r"[^A-Z0-9]", "", title_upper)
    i = 0
    skipped = 0
    while i < len(lines) and skipped < 8:
        ln = lines[i]
        if not ln:
            i += 1
            continue
        compact = re.sub(r"[^A-Z0-9]", "", ln.upper())
        if (
            ln in SKIP_EXACT
            or ln.startswith("Topic-only curriculum redesign")
            or compact == compact_title
            or compact == compact_title + "DEEPTOPICLEARNINGPATH"
            or (PAGE_NUM_RE.fullmatch(ln) and skipped < 6)
        ):
            i += 1
            skipped += 1
            continue
        break
    return "\n".join(ln for ln in lines[i:] if ln)


def extract_pdf_text(path: Path, course_title: str) -> str:
    reader = PdfReader(str(path))
    parts = []
    for page in reader.pages:
        parts.append(page_body(page.extract_text() or "", course_title))
    return "\n".join(parts)


def expected_counts(cover_text: str) -> tuple[int | None, int | None]:
    modules = re.search(r"(\d+)\s*MODULES", cover_text)
    topics = re.search(r"(\d+)\s*GRANULAR\s+TOPICS", cover_text)
    return (
        int(modules.group(1)) if modules else None,
        int(topics.group(1)) if topics else None,
    )


def split_topics(lines: list[str]) -> list[tuple[str, str]]:
    idxs = [i for i, ln in enumerate(lines) if NUM_RE.fullmatch(ln)]
    topics = []
    for n, start in enumerate(idxs):
        end = idxs[n + 1] if n + 1 < len(idxs) else len(lines)
        block = lines[start + 1 : end]
        why_at = None
        for j, ln in enumerate(block):
            if WHY_TOPIC_RE.search(ln):
                why_at = j
                break
        if why_at is None:
            raise ValueError(f"missing topic why after {lines[start]}: {block[:6]!r}")
        title = norm_space(" ".join(block[:why_at]))
        rest = block[why_at:]
        rest[0] = WHY_TOPIC_RE.sub("", rest[0]).strip()
        why = norm_space(" ".join(x for x in rest if x), strip_page_num=True)
        if not title or not why:
            raise ValueError(f"empty title/why for topic {lines[start]}")
        topics.append((title, why))
    return topics


def parse_units(text: str, course_title: str) -> list:
    matches = list(MODULE_RE.finditer(text))
    if not matches:
        raise ValueError(f"no modules found for {course_title}")
    units = []
    for i, match in enumerate(matches):
        expected_n = int(match.group(2))
        body = text[match.end() : matches[i + 1].start() if i + 1 < len(matches) else len(text)]
        why_match = WHY_MODULE_RE.search(body)
        if not why_match:
            raise ValueError(f"missing module why in {course_title} module {match.group(1)}")
        title = norm_space(body[: why_match.start()])
        after = body[why_match.end() :]
        after_lines = [ln.strip() for ln in after.splitlines() if ln.strip()]
        first_num = next((j for j, ln in enumerate(after_lines) if NUM_RE.fullmatch(ln)), len(after_lines))
        why = norm_space(" ".join(after_lines[:first_num]), strip_page_num=True)
        topics = split_topics(after_lines[first_num:])
        if len(topics) != expected_n:
            raise ValueError(
                f"{course_title} module {match.group(1)} expected {expected_n} topics, got {len(topics)}: "
                f"{[t for t, _ in topics]}"
            )
        if not title or not why:
            raise ValueError(f"empty module title/why in {course_title} module {match.group(1)}")
        subs = [(st, sd, []) for st, sd in topics]
        units.append((title, why, subs))
    return units


def main() -> None:
    missing = [c["pdf"] for c in COURSES if not (PDF_DIR / c["pdf"]).exists()]
    if missing:
        raise SystemExit(f"missing PDFs: {missing}")
    if len({c["slug"] for c in COURSES}) != 32:
        raise SystemExit("expected 32 unique slugs")
    if len({c["tag"] for c in COURSES}) != 32:
        raise SystemExit("dollar tags must be unique")

    for course in COURSES:
        raw = extract_pdf_text(PDF_DIR / course["pdf"], course["title"])
        units = parse_units(raw, course["title"])
        n_mod, n_top = expected_counts(raw)
        got_mod = len(units)
        got_top = sum(len(u[2]) for u in units)
        if n_mod is not None and n_mod != got_mod:
            raise SystemExit(f"{course['slug']}: cover modules {n_mod} parsed {got_mod}")
        if n_top is not None and n_top != got_top:
            raise SystemExit(f"{course['slug']}: cover topics {n_top} parsed {got_top}")
        tag = course["tag"]
        write_seed(
            course["slug"],
            course["title"],
            course["desc"],
            course["course_id"],
            tag,
            units,
            course["file_slug"],
        )


if __name__ == "__main__":
    main()
