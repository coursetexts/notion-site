/** Frontend-only seed for /field-atlas. Not wired to a database. */

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
  readingList: AtlasReadingItem[]
  threads?: AtlasThreadComment[]
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
  howDiscovered: string
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
        proponents: 'Witten, Maldacena, and the AdS/CFT community',
        readingList: [
          {
            id: 'r-qg-h1-gs',
            title: 'Superstring Theory',
            note: 'Green, Schwarz & Witten — the first long-form map of the string hypothesis.',
            threads: []
          },
          {
            id: 'r-qg-h1-malda',
            title:
              'The Large N Limit of Superconformal Field Theories and Supergravity',
            url: 'https://arxiv.org/abs/hep-th/9711200',
            note: 'Maldacena, 1997 — why this camp treats AdS/CFT as a working model.',
            threads: []
          }
        ]
      },
      {
        id: 'h2',
        statement:
          'Loop quantum gravity: spacetime itself is quantized into discrete loops of area and volume.',
        weight: 'contender',
        proponents: 'Rovelli, Smolin, Ashtekar',
        readingList: [
          {
            id: 'r-qg-h2-rovelli',
            title: 'Quantum Gravity',
            note: 'Rovelli — the loop-quantized geometry this camp is actually claiming.',
            threads: []
          },
          {
            id: 'r-qg-h2-ashtekar',
            title: 'New Variables for Classical and Quantum Gravity',
            url: 'https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.57.2244',
            note: 'Ashtekar, 1986 — the variables the loops are built from.',
            threads: []
          }
        ]
      },
      {
        id: 'h3',
        statement:
          'Spacetime and gravity are emergent from quantum entanglement (ER = EPR).',
        weight: 'contender',
        proponents: 'Van Raamsdonk, Susskind',
        readingList: [
          {
            id: 'r-qg-h3-erepr',
            title: 'Cool horizons for entangled black holes',
            url: 'https://arxiv.org/abs/1306.0533',
            note: 'Maldacena & Susskind, 2013 — ER = EPR as a claim, not a slogan.',
            threads: []
          },
          {
            id: 'r-qg-h3-vanr',
            title: 'Building up spacetime with quantum entanglement',
            url: 'https://arxiv.org/abs/1005.3035',
            note: 'Van Raamsdonk, 2010 — geometry from entanglement.',
            threads: []
          }
        ]
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
        proponents: 'Van Raamsdonk, Swingle',
        readingList: [
          {
            id: 'r-st-h1-rt',
            title: 'Holographic Derivation of Entanglement Entropy from AdS/CFT',
            url: 'https://arxiv.org/abs/hep-th/0603001',
            note: 'Ryu & Takayanagi, 2006 — the formula this emergence story leans on.',
            threads: []
          },
          {
            id: 'r-st-h1-swingle',
            title: 'Entanglement Renormalization and Holography',
            url: 'https://arxiv.org/abs/0905.1317',
            note: 'Swingle — tensor networks as a picture of emergent bulk.',
            threads: []
          }
        ]
      },
      {
        id: 'h2',
        statement:
          'Spacetime is fundamental; emergence is an artifact of our models.',
        weight: 'contender',
        proponents: 'Traditionalists',
        readingList: [
          {
            id: 'r-st-h2-wald',
            title: 'General Relativity',
            note: 'Wald — spacetime as the thing the theory is about, not a large-N approximation.',
            threads: []
          }
        ]
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
        proponents: 'ΛCDM standard model',
        readingList: [
          {
            id: 'r-de-h1-weinberg',
            title: 'The cosmological constant problem',
            url: 'https://journals.aps.org/rmp/abstract/10.1103/RevModPhys.61.1',
            note: 'Weinberg, 1989 — why a constant is both the default and a scandal.',
            threads: []
          },
          {
            id: 'r-de-h1-riess',
            title:
              'Observational Evidence from Supernovae for an Accelerating Universe',
            url: 'https://arxiv.org/abs/astro-ph/9805201',
            note: 'Riess et al., 1998 — the measurement ΛCDM absorbed.',
            threads: []
          }
        ]
      },
      {
        id: 'h2',
        statement:
          'Quintessence: a dynamical field whose energy density evolves.',
        weight: 'contender',
        proponents: 'Steinhardt et al.',
        readingList: [
          {
            id: 'r-de-h2-rp',
            title: 'Cosmological Consequences of a Rolling Homogeneous Scalar Field',
            url: 'https://journals.aps.org/prd/abstract/10.1103/PhysRevD.37.3406',
            note: 'Ratra & Peebles, 1988 — an evolving field instead of a constant.',
            threads: []
          }
        ]
      },
      {
        id: 'h3',
        statement: 'Modified gravity on cosmic scales, not a new substance.',
        weight: 'fringe',
        proponents: 'MOND / f(R) theorists',
        readingList: [
          {
            id: 'r-de-h3-clifton',
            title: 'Modified Gravity and Cosmology',
            url: 'https://arxiv.org/abs/1106.2476',
            note: 'Clifton et al. — the case that the acceleration is gravity, not a fluid.',
            threads: []
          }
        ]
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
        proponents: 'Guth, Linde, Starobinsky',
        readingList: [
          {
            id: 'r-inf-h1-guth',
            title:
              'Inflationary universe: A possible solution to the horizon and flatness problems',
            url: 'https://journals.aps.org/prd/abstract/10.1103/PhysRevD.23.347',
            note: 'Guth, 1981 — the original inflaton story.',
            threads: []
          },
          {
            id: 'r-inf-h1-linde',
            title: 'A new inflationary universe scenario',
            url: 'https://www.sciencedirect.com/science/article/pii/0370269382909199',
            note: 'Linde, 1982 — slow-roll as a workable field.',
            threads: []
          }
        ]
      },
      {
        id: 'h2',
        statement: 'A cyclic/bouncing cosmology replaces inflation.',
        weight: 'contender',
        proponents: 'Steinhardt, Turok',
        readingList: [
          {
            id: 'r-inf-h2-ekpyrotic',
            title: 'A Cyclic Model of the Universe',
            url: 'https://arxiv.org/abs/hep-th/0111098',
            note: 'Steinhardt & Turok, 2002 — bounce instead of a first inflaton.',
            threads: []
          }
        ]
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
        proponents: 'Pritchard, Boyle',
        readingList: [
          {
            id: 'r-her-h1-omni',
            title: 'An Expanded View of Complex Traits: From Polygenic to Omnigenic',
            url: 'https://www.cell.com/cell/fulltext/S0092-8674(17)30629-3',
            note: 'Boyle, Li, Pritchard, 2017 — the leading “everything is a little causal” claim.',
            threads: []
          }
        ]
      },
      {
        id: 'h2',
        statement: 'Rare variants of large effect missed by common-SNP arrays.',
        weight: 'contender',
        proponents: 'Rare-variant camp',
        readingList: [
          {
            id: 'r-her-h2-manolio',
            title: 'Finding the missing heritability of complex diseases',
            url: 'https://www.nature.com/articles/nature08494',
            note: 'Manolio et al., 2009 — where the rare-variant gap was first priced.',
            threads: []
          }
        ]
      },
      {
        id: 'h3',
        statement:
          'Gene–gene and gene–environment interactions inflate twin estimates.',
        weight: 'contender',
        proponents: 'Epistasis proponents',
        readingList: [
          {
            id: 'r-her-h3-zuk',
            title: 'The mystery of missing heritability: Genetic interactions create phantom heritability',
            url: 'https://www.pnas.org/doi/10.1073/pnas.1119675109',
            note: 'Zuk et al., 2012 — interactions as the thing twin studies overcount.',
            threads: []
          }
        ]
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
        proponents: 'Dehaene, Baars',
        readingList: [
          {
            id: 'r-con-h1-baars',
            title: 'A Cognitive Theory of Consciousness',
            note: 'Baars — the workspace this camp is named for.',
            threads: []
          },
          {
            id: 'r-con-h1-dehaene',
            title: 'Consciousness and the brain',
            note: 'Dehaene — the experimental program attached to global workspace.',
            threads: []
          }
        ]
      },
      {
        id: 'h2',
        statement:
          'Integrated Information Theory: consciousness = integrated information (Φ).',
        weight: 'contender',
        proponents: 'Tononi, Koch',
        readingList: [
          {
            id: 'r-con-h2-tononi',
            title: 'An information integration theory of consciousness',
            url: 'https://bmcneurosci.biomedcentral.com/articles/10.1186/1471-2202-5-42',
            note: 'Tononi, 2004 — Φ as the quantity, not a metaphor.',
            threads: []
          }
        ]
      },
      {
        id: 'h3',
        statement:
          'Higher-order theories: awareness requires representing one’s own states.',
        weight: 'contender',
        proponents: 'Lau, Rosenthal',
        readingList: [
          {
            id: 'r-con-h3-lau',
            title: 'A higher order Bayesian decision theory of consciousness',
            url: 'https://www.sciencedirect.com/science/article/pii/S0079612307680022',
            note: 'Lau — awareness as a representation of one’s own first-order state.',
            threads: []
          }
        ]
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
        proponents: 'Montgomery–Dyson correspondence',
        readingList: [
          {
            id: 'r-rh-h1-mont',
            title: 'The pair correlation of zeros of the zeta function',
            url: 'https://www.ams.org/books/pspum/024.2/',
            note: 'Montgomery, 1973 — the spectral statistics this camp is betting on.',
            threads: []
          },
          {
            id: 'r-rh-h1-odlyzko',
            title: 'On the distribution of spacings between zeros of the zeta function',
            url: 'https://www.ams.org/journals/mcom/1987-48-177/S0025-5718-1987-0866115-0/',
            note: 'Odlyzko — the numerical match to random-matrix theory.',
            threads: []
          }
        ]
      },
      {
        id: 'h2',
        statement:
          'A proof will come via the Langlands program and automorphic forms.',
        weight: 'contender',
        proponents: 'Langlands community',
        readingList: [
          {
            id: 'r-rh-h2-frenkel',
            title: 'Love and Math',
            note: 'Frenkel — a readable door into why automorphic forms are offered as a proof route.',
            threads: []
          }
        ]
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
        proponents: 'Majority of the field',
        readingList: [
          {
            id: 'r-pnp-h1-aaronson',
            title: 'P ≟ NP',
            url: 'https://www.scottaaronson.com/papers/pnp.pdf',
            note: 'Aaronson — why most of the field expects inequality, with the barriers in view.',
            threads: []
          },
          {
            id: 'r-pnp-h1-rrz',
            title: 'Natural Proofs',
            url: 'https://www.cs.utexas.edu/~diz/library/natural.pdf',
            note: 'Razborov & Rudich — the barrier this camp uses to explain decades of stall.',
            threads: []
          }
        ]
      },
      {
        id: 'h2',
        statement: 'P = NP — a hidden efficient algorithm exists.',
        weight: 'fringe',
        proponents: 'A small minority',
        readingList: [
          {
            id: 'r-pnp-h2-impagliazzo',
            title: 'A Personal View of Average-Case Complexity',
            url: 'https://cseweb.ucsd.edu/~russell/average.ps',
            note: 'Impagliazzo’s five worlds — the closest honest map of what P = NP would actually buy.',
            threads: []
          }
        ]
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
    howDiscovered:
      'Einstein wrote the field equations in 1915 after a decade of trying to make gravity geometric. The 1919 eclipse expeditions measured starlight bending as predicted; perihelion, Shapiro delay, and then LIGO’s 2015 waveforms closed the strong-field case. The theory was not voted in. It kept surviving tests that could have killed it.',
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
    howDiscovered:
      'QED was assembled after the war by Feynman, Schwinger, and Tomonaga, then renormalized into a theory that matched the electron’s magnetic moment to absurd precision. Electroweak unification and QCD followed; collider after collider filled in the particle table until the Higgs closed the last predicted gap. The 12 decimal places are not a slogan. They are a laboratory record.',
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
    howDiscovered:
      'Bekenstein argued that black holes must carry entropy proportional to horizon area, or the second law would fail when matter fell in. Hawking’s 1975 calculation showed that quantum fields near the horizon produce a thermal flux — radiation with a temperature. The result is still a calculation, not a telescope detection, but every serious quantum-gravity program treats it as a fact that has to be recovered.',
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
    howDiscovered:
      'Slipher measured redshifts of nebulae; Hubble, in 1929, plotted them against distance and found a line. Friedmann and Lemaître had already written expanding solutions of Einstein’s equations. The age settled later: the Hubble constant, nucleosynthesis, and the microwave background together pin the clock near 13.8 billion years. Expansion was a diagram before it was a consensus.',
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
    howDiscovered:
      'Zwicky saw galaxies in clusters moving too fast for the visible mass; Rubin’s rotation curves made the same point inside spirals. In 1998 two supernova teams found the expansion accelerating, which required a dominant dark-energy term. Planck’s map of the microwave sky then locked the budget: a few percent atoms, about a quarter dark matter, the rest a cosmological constant we still cannot name.',
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
    howDiscovered:
      'Penzias and Wilson found a leftover hiss in a Bell Labs horn in 1965 and could not get rid of it. Dicke’s group recognized it as the predicted relic of a hot early universe. COBE’s FIRAS instrument later showed the spectrum is a 2.725 K blackbody to a part in 10⁴ — the cleanest thermal spectrum in nature, measured rather than assumed.',
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
    howDiscovered:
      'Avery’s group showed that DNA, not protein, carries heredity; Hershey and Chase confirmed it with labeled phage. Watson and Crick’s 1953 model made a copying mechanism geometric. The four-base code itself was cracked in the 1960s by Nirenberg, Matthaei, and Khorana, codon by codon, in cell-free systems — a table, not a metaphor.',
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
    howDiscovered:
      'Early guesses ran to 100,000 genes. The Human Genome Project’s draft, and the finishes that followed, kept cutting the protein-coding count as overlapping predictions were reconciled. Around 20,000 is where the catalogs stopped moving. The surprise was not that we sequenced a genome. It was how few genes it took.',
    disciplinePath: 'Biology / Genetics',
    readingList: [],
    threads: [],
    updated: '2026-03-11'
  },
  'k-gen-noncoding': {
    id: 'k-gen-noncoding',
    title: 'Most of the genome is non-coding, much of it regulatory.',
    note: '“Junk DNA” is the wrong slogan. How much is functional is still argued; that regulation lives here is not.',
    howDiscovered:
      'Most of the sequence does not code for protein — that was clear as soon as genome size and gene count diverged. Comparative genomics, then ENCODE and the regulatory maps that followed, showed promoters, enhancers, and non-coding RNAs living in the remainder. “Junk” lost the argument as a total description. How much of the rest is doing work is the part still being priced.',
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
    howDiscovered:
      'Nineteenth-century electrophysiology showed that nerves speak in electricity. Hodgkin and Huxley, working on the squid giant axon, wrote equations for sodium and potassium currents that reproduce the action potential from ion flow. The spike is a measured waveform with a mechanism, not an analogy.',
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
    howDiscovered:
      'Broca and Wernicke tied lesions to speech. Penfield’s intraoperative stimulations drew the sensory and motor homunculus on the cortex. Later imaging and more careful lesion work refined the maps without erasing them. You can still plan around these regions. You cannot read a mind off them.',
    disciplinePath: 'Biology / Neuroscience',
    readingList: [],
    threads: [],
    updated: '2026-02-20'
  },
  'k-neuro-memory': {
    id: 'k-neuro-memory',
    title: 'Memory involves synaptic plasticity in the hippocampus.',
    note: 'LTP and hippocampal circuits are the known mechanism of one kind of memory. They are not the whole of remembering.',
    howDiscovered:
      'Patient H.M., after a hippocampal resection, lost the ability to form new episodic memories and made the structure’s role undeniable. Bliss and Lømo then recorded long-term potentiation in rabbit hippocampus — synapses that stay stronger after a burst. The circuit and the plasticity are both laboratory facts. They explain a kind of memory, not memory as such.',
    disciplinePath: 'Biology / Neuroscience',
    readingList: [],
    threads: [],
    updated: '2026-01-30'
  },
  'k-nt-euclid': {
    id: 'k-nt-euclid',
    title: 'There are infinitely many primes (Euclid).',
    note: 'The proof is older than the rest of this atlas. What remains is how they are distributed.',
    howDiscovered:
      'Euclid’s Elements, Book IX, Proposition 20: given any finite list of primes, form their product plus one; that number has a prime factor not on the list. The argument is still the one taught. Later proofs exist; none is older, and none made the fact more true.',
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
    howDiscovered:
      'Euclid had existence of a prime factorization. Uniqueness waited: Gauss stated and proved it cleanly in the Disquisitiones Arithmeticae. Once unique factorization is in hand, the integers have atoms. Every later uniqueness theorem in algebra is a descendant of this one.',
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
    howDiscovered:
      'Gauss guessed that the count of primes near x is about x / log x from tables he kept as a teenager. The proof came in 1896, independently, from Hadamard and de la Vallée Poussin, using complex analysis on the zeta function. The theorem is an analytic fact about density. Riemann’s hypothesis is a claim about how tightly that approximation sits.',
    disciplinePath: 'Mathematics / Number Theory',
    readingList: [],
    threads: [],
    updated: '2026-03-08'
  },
  'k-cx-halt': {
    id: 'k-cx-halt',
    title: 'Some problems are provably undecidable (the halting problem).',
    note: 'Undecidability is settled. P vs NP is a question about the decidable remainder.',
    howDiscovered:
      'Turing’s 1936 paper defined a machine and asked whether it could decide, of an arbitrary machine and input, whether computation would halt. A diagonal argument shows that no such decider exists. Church had a parallel result in the λ-calculus. Undecidability is not a rumor about hard problems. It is a proof that some questions have no algorithm at all.',
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
    howDiscovered:
      'Cook and Levin showed that SAT is NP-complete: every problem in NP reduces to it. Karp’s 1972 paper then exhibited twenty-one combinatorial problems that inherit that completeness by reduction. The list grew into the thousands. Completeness is a web of equivalences, built one reduction at a time — not a single experiment.',
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
    ) +
    question.hypotheses.reduce(
      (sum, hypothesis) =>
        sum +
        countAtlasThread(hypothesis.threads ?? []) +
        hypothesis.readingList.reduce(
          (inner, item) => inner + countAtlasThread(item.threads),
          0
        ),
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
