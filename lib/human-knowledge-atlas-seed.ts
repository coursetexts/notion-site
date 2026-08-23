/** Frontend-only seed for /human-knowledge-atlas. Not wired to a database. */

export type AtlasQuestionStatus = 'settled' | 'active' | 'contested' | 'emerging'
export type AtlasHypothesisWeight = 'leading' | 'contender' | 'fringe'
export type AtlasEvidenceStrength = 'strong' | 'suggestive' | 'weak' | 'absent'
export type AtlasExperimentStage =
  | 'proposed'
  | 'running'
  | 'collecting'
  | 'analyzing'
  | 'stalled'

export type AtlasThreadComment = {
  id: string
  author: string
  body: string
  createdAt: string
  replies: AtlasThreadComment[]
}

export type AtlasReadingItem = {
  id: string
  title: string
  url?: string
  note?: string
  threads: AtlasThreadComment[]
}

export type AtlasHypothesis = {
  id: string
  statement: string
  weight: AtlasHypothesisWeight
  proponents: string
}

export type AtlasEvidence = {
  id: string
  claim: string
  strength: AtlasEvidenceStrength
}

export type AtlasExperiment = {
  id: string
  name: string
  stage: AtlasExperimentStage
  note: string
}

export type AtlasQuestion = {
  id: string
  title: string
  posed: string
  status: AtlasQuestionStatus
  disciplinePath: string
  hypotheses: AtlasHypothesis[]
  evidence: AtlasEvidence[]
  experiments: AtlasExperiment[]
  readingList: AtlasReadingItem[]
  researchers: string[]
  labs: string[]
  threads: AtlasThreadComment[]
  contributedBy?: string
  updated: string
}

export type AtlasTreeKind = 'domain' | 'subfield' | 'known' | 'unresolved'

export type AtlasKnownFact = {
  id: string
  title: string
  note: string
  disciplinePath: string
  readingList: AtlasReadingItem[]
  threads: AtlasThreadComment[]
  updated: string
}

export type AtlasTreeNode = {
  id: string
  label: string
  kind: AtlasTreeKind
  children?: AtlasTreeNode[]
  factIds?: string[]
  questionIds?: string[]
}

export type AtlasSubmissionTarget = {
  nodeId: string
  path: string
}

function comment(
  id: string,
  author: string,
  body: string,
  createdAt: string,
  replies: AtlasThreadComment[] = []
): AtlasThreadComment {
  return { id, author, body, createdAt, replies }
}

export const ATLAS_STATUS_META: Record<
  AtlasQuestionStatus,
  { label: string; blurb: string }
> = {
  settled: { label: 'Settled', blurb: 'Broad consensus; considered known.' },
  active: { label: 'Active', blurb: 'Actively researched with real traction.' },
  contested: { label: 'Contested', blurb: 'Rival camps, no consensus.' },
  emerging: { label: 'Emerging', blurb: 'Young, fast-moving frontier.' }
}

export const ATLAS_QUESTIONS: Record<string, AtlasQuestion> = {
  'q-qg-unify': {
    id: 'q-qg-unify',
    title: 'How do general relativity and quantum mechanics reconcile?',
    posed:
      'Our two best theories of reality disagree about what happens where gravity is strong and distances are tiny — inside black holes and at the first instant of the universe.',
    status: 'active',
    disciplinePath: 'Physics / Quantum Gravity',
    hypotheses: [
      {
        id: 'h1',
        statement:
          'String theory: particles are vibrating one-dimensional strings in higher-dimensional space.',
        weight: 'leading',
        proponents: 'Witten, Maldacena, and the AdS/CFT community'
      },
      {
        id: 'h2',
        statement:
          'Loop quantum gravity: spacetime itself is quantized into discrete loops of area and volume.',
        weight: 'contender',
        proponents: 'Rovelli, Smolin, Ashtekar'
      },
      {
        id: 'h3',
        statement:
          'Spacetime and gravity are emergent from quantum entanglement (ER = EPR).',
        weight: 'contender',
        proponents: 'Van Raamsdonk, Susskind'
      }
    ],
    evidence: [
      {
        id: 'e1',
        claim:
          'AdS/CFT provides an exact quantum-gravity toy model in negatively curved space.',
        strength: 'strong'
      },
      {
        id: 'e2',
        claim:
          'Black hole entropy scales with area, not volume (holographic hint).',
        strength: 'suggestive'
      },
      {
        id: 'e3',
        claim: 'No direct experimental probe of Planck-scale gravity yet exists.',
        strength: 'absent'
      }
    ],
    experiments: [
      {
        id: 'x1',
        name: 'Tabletop gravitationally-induced entanglement',
        stage: 'proposed',
        note: 'Would test if gravity is quantum.'
      },
      {
        id: 'x2',
        name: 'LISA gravitational-wave observatory',
        stage: 'collecting',
        note: 'Probes strong-field regimes.'
      }
    ],
    readingList: [
      {
        id: 'r-maldacena',
        title:
          'The Large N Limit of Superconformal Field Theories and Supergravity',
        url: 'https://arxiv.org/abs/hep-th/9711200',
        note: 'Maldacena, 1997 — the AdS/CFT correspondence.',
        threads: [
          comment(
            'rt1',
            'Samira',
            'This is the paper people mean when they say we have a working quantum-gravity toy model. Worth sitting with the dictionary between bulk and boundary.',
            '2026-07-16',
            [
              comment(
                'rt1a',
                'Jonah',
                'Agreed. I would pair it with a lecture that draws the cylinder before attempting the N=4 SYM side.',
                '2026-07-17'
              )
            ]
          )
        ]
      },
      {
        id: 'r-vanraamsdonk',
        title: 'Building up spacetime with quantum entanglement',
        url: 'https://arxiv.org/abs/1005.3035',
        note: 'Van Raamsdonk, 2010 — geometry from entanglement.',
        threads: []
      }
    ],
    researchers: ['Juan Maldacena', 'Carlo Rovelli', 'Nima Arkani-Hamed'],
    labs: ['IAS Princeton', 'Perimeter Institute', 'CERN Theory'],
    threads: [
      comment(
        't1',
        'Maya Chen',
        'Is the useful next question “which theory is true,” or “which regime can we actually probe in this decade”?',
        '2026-07-18',
        [
          comment(
            't1a',
            'Priya',
            'The second. Tabletop entanglement tests are the first place this stops being a conversation among theorists.',
            '2026-07-19'
          )
        ]
      )
    ],
    updated: '2026-07-14'
  },
  'q-qg-spacetime': {
    id: 'q-qg-spacetime',
    title: 'Is spacetime fundamental, or does it emerge from something deeper?',
    posed:
      'Growing evidence suggests space and time might not be bedrock reality but a large-scale approximation of an underlying quantum structure.',
    status: 'emerging',
    disciplinePath: 'Physics / Quantum Gravity',
    hypotheses: [
      {
        id: 'h1',
        statement:
          'Spacetime emerges from entanglement structure of a quantum system.',
        weight: 'leading',
        proponents: 'Van Raamsdonk, Swingle'
      },
      {
        id: 'h2',
        statement:
          'Spacetime is fundamental; emergence is an artifact of our models.',
        weight: 'contender',
        proponents: 'Traditionalists'
      }
    ],
    evidence: [
      {
        id: 'e1',
        claim:
          'Ryu–Takayanagi formula ties entanglement entropy to geometric area.',
        strength: 'suggestive'
      },
      {
        id: 'e2',
        claim: 'Tensor-network models reproduce emergent geometry.',
        strength: 'suggestive'
      }
    ],
    experiments: [
      {
        id: 'x1',
        name: 'Quantum simulators of holographic codes',
        stage: 'running',
        note: 'Emulating bulk geometry on qubits.'
      }
    ],
    readingList: [
      {
        id: 'r-rt',
        title: 'Holographic entanglement entropy',
        url: 'https://arxiv.org/abs/hep-th/0603001',
        note: 'Ryu & Takayanagi, 2006.',
        threads: []
      }
    ],
    researchers: ['Brian Swingle', 'Mark Van Raamsdonk'],
    labs: ['Stanford SITP', 'UC Berkeley'],
    threads: [],
    updated: '2026-06-30'
  },
  'q-cos-darkenergy': {
    id: 'q-cos-darkenergy',
    title: 'What is dark energy, and is it constant?',
    posed:
      'About 68% of the universe is a mysterious pressure driving accelerated expansion. Recent surveys hint it may be weakening over time.',
    status: 'contested',
    disciplinePath: 'Physics / Cosmology',
    hypotheses: [
      {
        id: 'h1',
        statement: 'A cosmological constant (vacuum energy) with fixed value.',
        weight: 'leading',
        proponents: 'ΛCDM standard model'
      },
      {
        id: 'h2',
        statement:
          'Quintessence: a dynamical field whose energy density evolves.',
        weight: 'contender',
        proponents: 'Steinhardt et al.'
      },
      {
        id: 'h3',
        statement: 'Modified gravity on cosmic scales, not a new substance.',
        weight: 'fringe',
        proponents: 'MOND / f(R) theorists'
      }
    ],
    evidence: [
      {
        id: 'e1',
        claim: 'Type Ia supernovae show accelerating expansion (1998).',
        strength: 'strong'
      },
      {
        id: 'e2',
        claim: 'DESI Year-1 BAO data hints at evolving dark energy.',
        strength: 'suggestive'
      },
      {
        id: 'e3',
        claim: 'CMB is consistent with a plain cosmological constant.',
        strength: 'strong'
      }
    ],
    experiments: [
      {
        id: 'x1',
        name: 'DESI spectroscopic survey',
        stage: 'collecting',
        note: 'Mapping 40M galaxies.'
      },
      {
        id: 'x2',
        name: 'Vera Rubin Observatory LSST',
        stage: 'running',
        note: '10-year sky survey.'
      },
      {
        id: 'x3',
        name: 'Euclid space telescope',
        stage: 'collecting',
        note: 'Weak lensing + clustering.'
      }
    ],
    readingList: [
      {
        id: 'r-riess',
        title:
          'Observational Evidence from Supernovae for an Accelerating Universe',
        url: 'https://arxiv.org/abs/astro-ph/9805201',
        note: 'Riess et al., 1998.',
        threads: [
          comment(
            'rt-d1',
            'Omar',
            'Still the cleanest place to send someone who thinks dark energy is a 2010s meme.',
            '2026-08-03'
          )
        ]
      },
      {
        id: 'r-desi',
        title: 'DESI 2024 VI: Cosmological Constraints from BAO',
        url: 'https://arxiv.org/abs/2404.03002',
        note: 'The paper that reopened “is Λ constant?”',
        threads: []
      }
    ],
    researchers: ['Adam Riess', 'Nathalie Palanque-Delabrouille'],
    labs: ["Lawrence Berkeley Nat'l Lab", 'Space Telescope Science Institute'],
    threads: [
      comment(
        't-de',
        'Eli Park',
        'How should a syllabus treat DESI — as a rumor, or as a reason to teach evolving dark energy as a live option?',
        '2026-08-04'
      )
    ],
    updated: '2026-08-02'
  },
  'q-cos-inflation': {
    id: 'q-cos-inflation',
    title: 'What happened in the first 10⁻³² seconds of the universe?',
    posed:
      'Inflation elegantly explains the flat, uniform cosmos we see — but the mechanism, the field driving it, and what came before remain unknown.',
    status: 'active',
    disciplinePath: 'Physics / Cosmology',
    hypotheses: [
      {
        id: 'h1',
        statement: 'A scalar inflaton field drove exponential expansion.',
        weight: 'leading',
        proponents: 'Guth, Linde, Starobinsky'
      },
      {
        id: 'h2',
        statement: 'A cyclic/bouncing cosmology replaces inflation.',
        weight: 'contender',
        proponents: 'Steinhardt, Turok'
      }
    ],
    evidence: [
      {
        id: 'e1',
        claim:
          'CMB temperature fluctuations match a near scale-invariant spectrum.',
        strength: 'strong'
      },
      {
        id: 'e2',
        claim: 'Primordial gravitational waves (B-modes) not yet detected.',
        strength: 'absent'
      }
    ],
    experiments: [
      {
        id: 'x1',
        name: 'CMB-S4 ground array',
        stage: 'proposed',
        note: 'Hunting inflationary B-modes.'
      },
      {
        id: 'x2',
        name: 'LiteBIRD satellite',
        stage: 'proposed',
        note: 'Full-sky polarization.'
      }
    ],
    readingList: [
      {
        id: 'r-guth',
        title:
          'Inflationary universe: A possible solution to the horizon and flatness problems',
        url: 'https://journals.aps.org/prd/abstract/10.1103/PhysRevD.23.347',
        note: 'Guth, 1981.',
        threads: []
      }
    ],
    researchers: ['Alan Guth', 'Andrei Linde'],
    labs: ['MIT', 'Stanford'],
    threads: [],
    updated: '2026-05-19'
  },
  'q-gen-heritability': {
    id: 'q-gen-heritability',
    title: "Where is the 'missing heritability' of complex traits?",
    posed:
      'Twin studies say height and many diseases are highly heritable, yet identified gene variants explain only a fraction. Where is the rest hiding?',
    status: 'active',
    disciplinePath: 'Biology / Genetics',
    hypotheses: [
      {
        id: 'h1',
        statement: 'Thousands of tiny-effect common variants (omnigenic model).',
        weight: 'leading',
        proponents: 'Pritchard, Boyle'
      },
      {
        id: 'h2',
        statement: 'Rare variants of large effect missed by common-SNP arrays.',
        weight: 'contender',
        proponents: 'Rare-variant camp'
      },
      {
        id: 'h3',
        statement:
          'Gene–gene and gene–environment interactions inflate twin estimates.',
        weight: 'contender',
        proponents: 'Epistasis proponents'
      }
    ],
    evidence: [
      {
        id: 'e1',
        claim: 'GWAS with millions of samples steadily recover more heritability.',
        strength: 'strong'
      },
      {
        id: 'e2',
        claim: 'Whole-genome sequencing narrows but does not close the gap.',
        strength: 'suggestive'
      }
    ],
    experiments: [
      {
        id: 'x1',
        name: 'UK Biobank whole-genome sequencing',
        stage: 'analyzing',
        note: '500k participants.'
      },
      {
        id: 'x2',
        name: 'All of Us diversity cohort',
        stage: 'collecting',
        note: 'Beyond European ancestry.'
      }
    ],
    readingList: [
      {
        id: 'r-omnigenic',
        title: 'An Expanded View of Complex Traits: From Polygenic to Omnigenic',
        url: 'https://www.cell.com/cell/fulltext/S0092-8674(17)30629-3',
        note: 'Boyle, Li, Pritchard, 2017.',
        threads: []
      }
    ],
    researchers: ['Jonathan Pritchard', 'Peter Visscher'],
    labs: ['Stanford Genetics', 'Univ. of Queensland IMB'],
    threads: [],
    updated: '2026-07-28'
  },
  'q-neuro-consciousness': {
    id: 'q-neuro-consciousness',
    title: 'What is the physical basis of conscious experience?',
    posed:
      'We can correlate brain activity with reports of experience, but why any physical process feels like something from the inside remains unexplained.',
    status: 'contested',
    disciplinePath: 'Biology / Neuroscience',
    hypotheses: [
      {
        id: 'h1',
        statement:
          'Global Workspace: consciousness is information broadcast across cortex.',
        weight: 'leading',
        proponents: 'Dehaene, Baars'
      },
      {
        id: 'h2',
        statement:
          'Integrated Information Theory: consciousness = integrated information (Φ).',
        weight: 'contender',
        proponents: 'Tononi, Koch'
      },
      {
        id: 'h3',
        statement:
          'Higher-order theories: awareness requires representing one’s own states.',
        weight: 'contender',
        proponents: 'Lau, Rosenthal'
      }
    ],
    evidence: [
      {
        id: 'e1',
        claim:
          'Adversarial collaboration found partial support for both GWT and IIT.',
        strength: 'suggestive'
      },
      {
        id: 'e2',
        claim: 'No agreed objective measure of subjective experience exists.',
        strength: 'absent'
      }
    ],
    experiments: [
      {
        id: 'x1',
        name: 'Cogitate adversarial collaboration',
        stage: 'analyzing',
        note: 'GWT vs IIT preregistered test.'
      }
    ],
    readingList: [
      {
        id: 'r-cogitate',
        title:
          'Adversarial testing of global neuronal workspace and integrated information theories',
        url: 'https://www.nature.com/articles/s41586-025-08888-1',
        note: 'Cogitate Consortium, Nature 2025.',
        threads: [
          comment(
            'rt-n1',
            'Nia',
            'The useful reading is not “who won,” but how an adversarial collaboration is even designed for a question this soft.',
            '2026-08-12'
          )
        ]
      }
    ],
    researchers: ['Christof Koch', 'Stanislas Dehaene'],
    labs: ['Allen Institute', 'NeuroSpin'],
    threads: [
      comment(
        't-n1',
        'Alex Rivera',
        'Should this live on a neuroscience syllabus at all, or is it philosophy that borrows scanners?',
        '2026-08-12',
        [
          comment(
            't-n1a',
            'Lina Ortiz',
            'It belongs next to the experiments, with the prediction tables in view. Otherwise it becomes a vibe.',
            '2026-08-13'
          )
        ]
      )
    ],
    updated: '2026-08-11'
  },
  'q-math-riemann': {
    id: 'q-math-riemann',
    title:
      'Do all non-trivial zeros of the zeta function lie on the critical line?',
    posed:
      'The Riemann Hypothesis governs the deep distribution of prime numbers. It has been verified for trillions of zeros but never proven.',
    status: 'active',
    disciplinePath: 'Mathematics / Number Theory',
    hypotheses: [
      {
        id: 'h1',
        statement:
          'The hypothesis is true; a spectral / random-matrix interpretation will prove it.',
        weight: 'leading',
        proponents: 'Montgomery–Dyson correspondence'
      },
      {
        id: 'h2',
        statement:
          'A proof will come via the Langlands program and automorphic forms.',
        weight: 'contender',
        proponents: 'Langlands community'
      }
    ],
    evidence: [
      {
        id: 'e1',
        claim: 'First 10¹³ zeros computationally verified on the critical line.',
        strength: 'strong'
      },
      {
        id: 'e2',
        claim: 'Zero spacings match Gaussian Unitary Ensemble statistics.',
        strength: 'suggestive'
      }
    ],
    experiments: [
      {
        id: 'x1',
        name: 'ZetaGrid distributed zero verification',
        stage: 'stalled',
        note: 'Numerical, not a proof.'
      }
    ],
    readingList: [
      {
        id: 'r-montgomery',
        title: 'The pair correlation of zeros of the zeta function',
        url: 'https://www.ams.org/books/pspum/024.2/',
        note: 'Montgomery, 1973.',
        threads: []
      }
    ],
    researchers: ['Peter Sarnak', 'Terence Tao'],
    labs: ['IAS Princeton', 'Clay Mathematics Institute'],
    threads: [],
    updated: '2026-04-02'
  },
  'q-cs-pnp': {
    id: 'q-cs-pnp',
    title: 'Does P equal NP?',
    posed:
      'If problems whose solutions are easy to check are also easy to solve, cryptography, optimization, and mathematics itself would transform overnight.',
    status: 'active',
    disciplinePath: 'Mathematics / Complexity Theory',
    hypotheses: [
      {
        id: 'h1',
        statement:
          'P ≠ NP — the widely held expectation among complexity theorists.',
        weight: 'leading',
        proponents: 'Majority of the field'
      },
      {
        id: 'h2',
        statement: 'P = NP — a hidden efficient algorithm exists.',
        weight: 'fringe',
        proponents: 'A small minority'
      }
    ],
    evidence: [
      {
        id: 'e1',
        claim:
          'Decades of failure to find polynomial algorithms for NP-complete problems.',
        strength: 'suggestive'
      },
      {
        id: 'e2',
        claim: 'Natural-proofs barrier shows why current techniques stall.',
        strength: 'suggestive'
      }
    ],
    experiments: [
      {
        id: 'x1',
        name: 'Formal proof-assistant search for separations',
        stage: 'running',
        note: 'Lean / circuit lower bounds.'
      }
    ],
    readingList: [
      {
        id: 'r-cook',
        title: 'The Complexity of Theorem-Proving Procedures',
        url: 'https://dl.acm.org/doi/10.1145/800157.805047',
        note: 'Cook, 1971 — NP-completeness.',
        threads: []
      }
    ],
    researchers: ['Scott Aaronson', 'Avi Wigderson'],
    labs: ['UT Austin', 'IAS Princeton'],
    threads: [
      comment(
        't-pnp',
        'Chris Adeyemi',
        'A reading list for P vs NP that starts with Cook and never mentions barriers will produce false confidence. Natural proofs should be on this node.',
        '2026-03-20'
      )
    ],
    updated: '2026-03-15'
  }
}

export const ATLAS_FACTS: Record<string, AtlasKnownFact> = {
  'k-qg-gr': {
    id: 'k-qg-gr',
    title:
      'General relativity describes gravity as spacetime curvature and passes every solar-system test.',
    note: 'This is settled at ordinary curvatures. The remaining puzzle is how the same geometry behaves where quantum effects cannot be ignored.',
    disciplinePath: 'Physics / Quantum Gravity',
    readingList: [
      {
        id: 'r-gr-mtw',
        title: 'Gravitation',
        note: 'Misner, Thorne, and Wheeler — the long-form map of the classical theory.',
        threads: []
      },
      {
        id: 'r-gr-gw',
        title: 'Observation of Gravitational Waves from a Binary Black Hole Merger',
        url: 'https://arxiv.org/abs/1602.03837',
        note: 'LIGO/Virgo, 2016 — a strong-field test of the theory.',
        threads: [
          comment(
            'kt-gr-1',
            'Jonah',
            'This is the paper I would put next to the fact, not instead of a textbook. It is evidence, not explanation.',
            '2026-07-08'
          )
        ]
      }
    ],
    threads: [
      comment(
        'kt-gr',
        'Priya',
        '“Passes every solar-system test” is doing a lot of work. Worth saying which tests a first course should actually meet.',
        '2026-07-09',
        [
          comment(
            'kt-gr-a',
            'Maya Chen',
            'Perihelion, light deflection, Shapiro delay, and then gravitational waves. Four is enough to make “settled” feel earned.',
            '2026-07-10'
          )
        ]
      )
    ],
    updated: '2026-07-10'
  },
  'k-qg-qft': {
    id: 'k-qg-qft',
    title:
      'Quantum field theory predicts particle physics to 12 decimal places.',
    note: 'The Standard Model is the most precise empirical theory we have. It is not a theory of spacetime.',
    disciplinePath: 'Physics / Quantum Gravity',
    readingList: [
      {
        id: 'r-qft-peskin',
        title: 'An Introduction to Quantum Field Theory',
        note: 'Peskin & Schroeder — the usual first pass at the machinery.',
        threads: []
      }
    ],
    threads: [],
    updated: '2026-06-12'
  },
  'k-qg-hawking': {
    id: 'k-qg-hawking',
    title:
      'Black holes radiate (Hawking) and carry entropy proportional to horizon area.',
    note: 'Thermodynamics of horizons is as close as we have to a quantum-gravity fact. What the microstates are is still open.',
    disciplinePath: 'Physics / Quantum Gravity',
    readingList: [
      {
        id: 'r-hawking',
        title: 'Particle Creation by Black Holes',
        url: 'https://projecteuclid.org/journals/communications-in-mathematical-physics/volume-43/issue-3/Particle-creation-by-black-holes/cmp/1103899811.full',
        note: 'Hawking, 1975.',
        threads: []
      }
    ],
    threads: [],
    updated: '2026-05-22'
  },
  'k-cos-expand': {
    id: 'k-cos-expand',
    title: 'The universe is expanding and is ~13.8 billion years old.',
    note: 'Age and expansion are not in dispute. What is driving the late-time acceleration is.',
    disciplinePath: 'Physics / Cosmology',
    readingList: [
      {
        id: 'r-hubble',
        title: 'A Relation between Distance and Radial Velocity among Extra-Galactic Nebulae',
        url: 'https://www.pnas.org/doi/10.1073/pnas.15.3.168',
        note: 'Hubble, 1929 — the original distance–redshift relation.',
        threads: []
      }
    ],
    threads: [
      comment(
        'kt-exp',
        'Eli Park',
        'I would teach Hubble’s diagram before any mention of dark energy. Otherwise “expansion” and “acceleration” get fused.',
        '2026-08-01'
      )
    ],
    updated: '2026-08-01'
  },
  'k-cos-budget': {
    id: 'k-cos-budget',
    title:
      'Ordinary matter is ~5% of the cosmos; dark matter ~27%; dark energy ~68%.',
    note: 'The inventory is robust. The identities of the two large terms are not.',
    disciplinePath: 'Physics / Cosmology',
    readingList: [],
    threads: [],
    updated: '2026-07-21'
  },
  'k-cos-cmb': {
    id: 'k-cos-cmb',
    title:
      'The cosmic microwave background is a near-perfect 2.7 K blackbody.',
    note: 'The spectrum is settled. What the polarization may still say about inflation is not.',
    disciplinePath: 'Physics / Cosmology',
    readingList: [
      {
        id: 'r-firas',
        title: 'The Cosmic Microwave Background Spectrum from the Full COBE FIRAS Data Set',
        url: 'https://arxiv.org/abs/astro-ph/9605054',
        note: 'Fixsen et al. — the blackbody measurement.',
        threads: []
      }
    ],
    threads: [],
    updated: '2026-04-18'
  },
  'k-gen-dna': {
    id: 'k-gen-dna',
    title: 'DNA encodes heredity via the four-base genetic code.',
    note: 'The code itself is known. How that code is regulated across a lifetime is the live subject.',
    disciplinePath: 'Biology / Genetics',
    readingList: [
      {
        id: 'r-watson',
        title: 'Molecular Structure of Nucleic Acids',
        url: 'https://www.nature.com/articles/171737a0',
        note: 'Watson & Crick, 1953.',
        threads: []
      }
    ],
    threads: [],
    updated: '2026-06-02'
  },
  'k-gen-count': {
    id: 'k-gen-count',
    title:
      'The human genome contains ~20,000 protein-coding genes.',
    note: 'The count stabilized after the first overestimates. Function is not a count.',
    disciplinePath: 'Biology / Genetics',
    readingList: [],
    threads: [],
    updated: '2026-03-11'
  },
  'k-gen-noncoding': {
    id: 'k-gen-noncoding',
    title: 'Most of the genome is non-coding, much of it regulatory.',
    note: '“Junk DNA” is the wrong slogan. How much is functional is still argued; that regulation lives here is not.',
    disciplinePath: 'Biology / Genetics',
    readingList: [],
    threads: [
      comment(
        'kt-nc',
        'Sofia Nguyen',
        'A good reading list here should include one paper that still uses “junk” and one that refuses it, so the argument is visible.',
        '2026-07-02'
      )
    ],
    updated: '2026-07-02'
  },
  'k-neuro-ap': {
    id: 'k-neuro-ap',
    title: 'Neurons communicate via electrochemical action potentials.',
    note: 'The spike is the known coin of the nervous system. How spikes become experience is not.',
    disciplinePath: 'Biology / Neuroscience',
    readingList: [
      {
        id: 'r-hodgkin',
        title: 'A Quantitative Description of Membrane Current and its Application to Conduction and Excitation in Nerve',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1392413/',
        note: 'Hodgkin & Huxley, 1952.',
        threads: []
      }
    ],
    threads: [],
    updated: '2026-05-09'
  },
  'k-neuro-maps': {
    id: 'k-neuro-maps',
    title:
      'Specific cortical regions map to sensory and motor functions.',
    note: 'Localization is real enough to plan surgery around. It is not a full theory of mind.',
    disciplinePath: 'Biology / Neuroscience',
    readingList: [],
    threads: [],
    updated: '2026-02-20'
  },
  'k-neuro-memory': {
    id: 'k-neuro-memory',
    title: 'Memory involves synaptic plasticity in the hippocampus.',
    note: 'LTP and hippocampal circuits are the known mechanism of one kind of memory. They are not the whole of remembering.',
    disciplinePath: 'Biology / Neuroscience',
    readingList: [],
    threads: [],
    updated: '2026-01-30'
  },
  'k-nt-euclid': {
    id: 'k-nt-euclid',
    title: 'There are infinitely many primes (Euclid).',
    note: 'The proof is older than the rest of this atlas. What remains is how they are distributed.',
    disciplinePath: 'Mathematics / Number Theory',
    readingList: [
      {
        id: 'r-euclid',
        title: 'Elements, Book IX, Proposition 20',
        url: 'https://mathcs.clarku.edu/~djoyce/elements/bookIX/propIX20.html',
        note: 'Euclid’s infinitude of primes.',
        threads: []
      }
    ],
    threads: [
      comment(
        'kt-euclid',
        'Lina Ortiz',
        'This is the rare settled fact where the original text is still the right reading. Everything after it is commentary.',
        '2026-04-04'
      )
    ],
    updated: '2026-04-04'
  },
  'k-nt-fta': {
    id: 'k-nt-fta',
    title: 'Every integer > 1 factors uniquely into primes.',
    note: 'The fundamental theorem of arithmetic. Unique factorization is the reason primes are the atoms of the integers.',
    disciplinePath: 'Mathematics / Number Theory',
    readingList: [],
    threads: [],
    updated: '2026-03-08'
  },
  'k-nt-pnt': {
    id: 'k-nt-pnt',
    title:
      'The prime number theorem describes prime density asymptotically.',
    note: 'We know the density. The Riemann Hypothesis is a sharper claim about the error term.',
    disciplinePath: 'Mathematics / Number Theory',
    readingList: [],
    threads: [],
    updated: '2026-03-08'
  },
  'k-cx-halt': {
    id: 'k-cx-halt',
    title: 'Some problems are provably undecidable (the halting problem).',
    note: 'Undecidability is settled. P vs NP is a question about the decidable remainder.',
    disciplinePath: 'Mathematics / Complexity Theory',
    readingList: [
      {
        id: 'r-turing',
        title: 'On Computable Numbers, with an Application to the Entscheidungsproblem',
        url: 'https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf',
        note: 'Turing, 1936.',
        threads: []
      }
    ],
    threads: [],
    updated: '2026-02-14'
  },
  'k-cx-npc': {
    id: 'k-cx-npc',
    title:
      'Thousands of problems are known to be NP-complete and inter-reducible.',
    note: 'NP-completeness is a map of equivalent difficulty. Whether any of them is in P is the open question.',
    disciplinePath: 'Mathematics / Complexity Theory',
    readingList: [
      {
        id: 'r-karp',
        title: 'Reducibility among Combinatorial Problems',
        url: 'https://cgi.di.uoa.gr/~sgk/teaching/grad/scribe/karp.pdf',
        note: 'Karp, 1972 — twenty-one NP-complete problems.',
        threads: []
      }
    ],
    threads: [],
    updated: '2026-02-14'
  }
}

export const ATLAS_TREE: AtlasTreeNode[] = [
  {
    id: 'd-physics',
    label: 'Physics',
    kind: 'domain',
    children: [
      {
        id: 's-qg',
        label: 'Quantum Gravity',
        kind: 'subfield',
        children: [
          {
            id: 's-qg-known',
            label: 'known',
            kind: 'known',
            factIds: ['k-qg-gr', 'k-qg-qft', 'k-qg-hawking']
          },
          {
            id: 's-qg-unresolved',
            label: 'unresolved',
            kind: 'unresolved',
            questionIds: ['q-qg-unify', 'q-qg-spacetime']
          }
        ]
      },
      {
        id: 's-cos',
        label: 'Cosmology',
        kind: 'subfield',
        children: [
          {
            id: 's-cos-known',
            label: 'known',
            kind: 'known',
            factIds: ['k-cos-expand', 'k-cos-budget', 'k-cos-cmb']
          },
          {
            id: 's-cos-unresolved',
            label: 'unresolved',
            kind: 'unresolved',
            questionIds: ['q-cos-darkenergy', 'q-cos-inflation']
          }
        ]
      }
    ]
  },
  {
    id: 'd-biology',
    label: 'Biology',
    kind: 'domain',
    children: [
      {
        id: 's-gen',
        label: 'Genetics',
        kind: 'subfield',
        children: [
          {
            id: 's-gen-known',
            label: 'known',
            kind: 'known',
            factIds: ['k-gen-dna', 'k-gen-count', 'k-gen-noncoding']
          },
          {
            id: 's-gen-unresolved',
            label: 'unresolved',
            kind: 'unresolved',
            questionIds: ['q-gen-heritability']
          }
        ]
      },
      {
        id: 's-neuro',
        label: 'Neuroscience',
        kind: 'subfield',
        children: [
          {
            id: 's-neuro-known',
            label: 'known',
            kind: 'known',
            factIds: ['k-neuro-ap', 'k-neuro-maps', 'k-neuro-memory']
          },
          {
            id: 's-neuro-unresolved',
            label: 'unresolved',
            kind: 'unresolved',
            questionIds: ['q-neuro-consciousness']
          }
        ]
      }
    ]
  },
  {
    id: 'd-math',
    label: 'Mathematics',
    kind: 'domain',
    children: [
      {
        id: 's-nt',
        label: 'Number Theory',
        kind: 'subfield',
        children: [
          {
            id: 's-nt-known',
            label: 'known',
            kind: 'known',
            factIds: ['k-nt-euclid', 'k-nt-fta', 'k-nt-pnt']
          },
          {
            id: 's-nt-unresolved',
            label: 'unresolved',
            kind: 'unresolved',
            questionIds: ['q-math-riemann']
          }
        ]
      },
      {
        id: 's-cx',
        label: 'Complexity Theory',
        kind: 'subfield',
        children: [
          {
            id: 's-cx-known',
            label: 'known',
            kind: 'known',
            factIds: ['k-cx-halt', 'k-cx-npc']
          },
          {
            id: 's-cx-unresolved',
            label: 'unresolved',
            kind: 'unresolved',
            questionIds: ['q-cs-pnp']
          }
        ]
      }
    ]
  }
]

export function collectAtlasSubmissionTargets(
  tree: AtlasTreeNode[]
): AtlasSubmissionTarget[] {
  const targets: AtlasSubmissionTarget[] = []
  for (const domain of tree) {
    for (const subfield of domain.children ?? []) {
      const unresolved = subfield.children?.find((c) => c.kind === 'unresolved')
      if (unresolved) {
        targets.push({
          nodeId: unresolved.id,
          path: `${domain.label} / ${subfield.label}`
        })
      }
    }
  }
  return targets
}

export function addQuestionToAtlasTree(
  tree: AtlasTreeNode[],
  targetNodeId: string,
  questionId: string
): AtlasTreeNode[] {
  return tree.map((node) => {
    if (node.id === targetNodeId && node.kind === 'unresolved') {
      return { ...node, questionIds: [questionId, ...(node.questionIds ?? [])] }
    }
    if (node.children) {
      return {
        ...node,
        children: addQuestionToAtlasTree(node.children, targetNodeId, questionId)
      }
    }
    return node
  })
}

export function appendAtlasReply(
  comments: AtlasThreadComment[],
  parentId: string | null,
  reply: AtlasThreadComment
): AtlasThreadComment[] {
  if (!parentId) return [...comments, reply]
  return comments.map((item) =>
    item.id === parentId
      ? { ...item, replies: [...item.replies, reply] }
      : {
          ...item,
          replies: appendAtlasReply(item.replies, parentId, reply)
        }
  )
}

export function countAtlasThread(comments: AtlasThreadComment[]): number {
  return comments.reduce(
    (sum, item) => sum + 1 + countAtlasThread(item.replies),
    0
  )
}

export function atlasQuestionDiscussionCount(question: AtlasQuestion): number {
  return (
    countAtlasThread(question.threads) +
    question.readingList.reduce(
      (sum, item) => sum + countAtlasThread(item.threads),
      0
    )
  )
}

const FRONTIER_RANK: Record<AtlasQuestionStatus, number> = {
  emerging: 3,
  active: 2,
  contested: 1,
  settled: 0
}

export function trendingAtlasQuestions(limit = 4): AtlasQuestion[] {
  return Object.values(ATLAS_QUESTIONS)
    .filter((question) => question.status !== 'settled')
    .sort((a, b) => {
      const aHeat =
        atlasQuestionDiscussionCount(a) + FRONTIER_RANK[a.status] * 2
      const bHeat =
        atlasQuestionDiscussionCount(b) + FRONTIER_RANK[b.status] * 2
      if (bHeat !== aHeat) return bHeat - aHeat
      if (b.researchers.length !== a.researchers.length) {
        return b.researchers.length - a.researchers.length
      }
      return b.updated.localeCompare(a.updated)
    })
    .slice(0, limit)
}
