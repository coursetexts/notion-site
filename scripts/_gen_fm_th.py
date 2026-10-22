"""Film Theory and Criticism curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "Ground students in the formal language of cinema so theory remains tied to specific choices "
    "visible and audible on screen."
)

UNITS = [
    (
        "Film Language, Close Analysis, and Critical Vocabulary",
        "Ground students in the formal language of cinema so theory remains tied to specific choices visible and audible on screen.",
        [
            (
                "Cinematic form",
                "Why it matters: Close analysis starts by naming the formal systems that organize what viewers see and hear.",
                [
                    "Mise-en-scene",
                    "Cinematography",
                    "Editing",
                    "Sound",
                ],
            ),
            (
                "Shot-level analysis",
                "Why it matters: Students learn to move from impression to evidence by describing specific screen choices.",
                [
                    "Framing",
                    "Camera movement",
                    "Shot scale",
                    "Duration",
                ],
            ),
            (
                "Critical vocabulary",
                "Why it matters: A shared vocabulary lets students make precise claims about style, affect, narrative, and meaning.",
                [
                    "Diegesis",
                    "Motif",
                    "Point of view",
                    "Continuity and discontinuity",
                ],
            ),
        ],
    ),
    (
        "Film Historiography, Archives, and Canon Formation",
        "Study how film histories are written, preserved, contested, and organized into canons and counter-canons.",
        [
            (
                "Historiography",
                "Why it matters: Film history is constructed through methods, archives, institutions, and critical priorities.",
                [
                    "Periodization",
                    "Primary sources",
                    "Industrial history",
                    "Reception history",
                ],
            ),
            (
                "Archives and preservation",
                "Why it matters: Students learn how survival, restoration, and access shape what can be studied.",
                [
                    "Film archives",
                    "Restoration",
                    "Lost films",
                    "Material formats",
                ],
            ),
            (
                "Canon and counter-canon",
                "Why it matters: Canons reveal value judgments and exclusions, making them objects of critique.",
                [
                    "Auteur canon",
                    "National cinemas",
                    "World cinema",
                    "Marginalized film histories",
                ],
            ),
        ],
    ),
    (
        "Realism, Formalism, Montage, and Classical Film Theory",
        "Introduce foundational debates about cinema's relation to reality, artifice, movement, editing, and modernity.",
        [
            (
                "Realism",
                "Why it matters: Realist theory asks what cinema reveals about the world and how indexicality matters.",
                [
                    "Bazin",
                    "Kracauer",
                    "Long takes",
                    "Deep focus",
                ],
            ),
            (
                "Formalism",
                "Why it matters: Formalist theory treats cinema as an art of construction, rhythm, defamiliarization, and design.",
                [
                    "Eisenstein",
                    "Pudovkin",
                    "Formal pattern",
                    "Cinematic specificity",
                ],
            ),
            (
                "Montage theory",
                "Why it matters: Montage shows how editing can produce ideas, affect, conflict, and political force.",
                [
                    "Metric montage",
                    "Intellectual montage",
                    "Kuleshov effect",
                    "Dialectical editing",
                ],
            ),
        ],
    ),
    (
        "Mise-en-Scene, Cinematography, Editing, and Sound as Theory",
        "Treat style not as decoration but as an argument about meaning, perception, power, and experience.",
        [
            (
                "Mise-en-scene",
                "Why it matters: Staging, performance, setting, costume, and lighting are theoretical claims about worlds and bodies.",
                [
                    "Blocking",
                    "Lighting",
                    "Production design",
                    "Performance style",
                ],
            ),
            (
                "Image and camera",
                "Why it matters: Cinematography shapes spectatorship through perspective, scale, movement, texture, and color.",
                [
                    "Lens choice",
                    "Camera angle",
                    "Color design",
                    "Aspect ratio",
                ],
            ),
            (
                "Editing and sound",
                "Why it matters: Editing and sound organize time, space, attention, rhythm, and interiority.",
                [
                    "Continuity editing",
                    "Discontinuity",
                    "Sound bridge",
                    "Voice-over",
                ],
            ),
        ],
    ),
    (
        "Narrative Theory, Authorship, and Auteur Criticism",
        "Analyze story, narration, authorship, collaboration, and the critical uses and limits of auteur theory.",
        [
            (
                "Narration and story",
                "Why it matters: Narrative theory separates what happens from how films organize knowledge, time, and perspective.",
                [
                    "Fabula and syuzhet",
                    "Narrator",
                    "Focalization",
                    "Unreliable narration",
                ],
            ),
            (
                "Auteur theory",
                "Why it matters: Auteur criticism asks how authorship appears across collaboration, style, theme, and institution.",
                [
                    "Director signature",
                    "Collaborative authorship",
                    "Studio authorship",
                    "Auteurism critique",
                ],
            ),
            (
                "Adaptation and intertextuality",
                "Why it matters: Films speak with other texts, genres, and cultural memory.",
                [
                    "Adaptation theory",
                    "Remake",
                    "Intertextual reference",
                    "Franchise authorship",
                ],
            ),
        ],
    ),
    (
        "Genre Theory, Popular Cinema, and Cultural Meaning",
        "Understand genres as historical systems of convention, repetition, difference, industry practice, and social meaning.",
        [
            (
                "Genre systems",
                "Why it matters: Genres are not fixed categories but evolving contracts among filmmakers, industries, texts, and audiences.",
                [
                    "Conventions",
                    "Iconography",
                    "Narrative patterns",
                    "Audience expectations",
                ],
            ),
            (
                "Genre and ideology",
                "Why it matters: Genre films encode social fantasies, conflicts, fears, and desires.",
                [
                    "Western",
                    "Film noir",
                    "Horror",
                    "Melodrama",
                ],
            ),
            (
                "Genre change",
                "Why it matters: Genres mutate through cycles, hybridity, parody, revision, and global circulation.",
                [
                    "Genre cycles",
                    "Hybridity",
                    "Revisionist genre",
                    "Transnational genre",
                ],
            ),
        ],
    ),
    (
        "Psychoanalysis, Apparatus Theory, and Spectatorship",
        "Examine theories of desire, identification, cinematic apparatus, subject formation, and viewing positions.",
        [
            (
                "Psychoanalytic concepts",
                "Why it matters: Psychoanalysis shaped film theory's accounts of desire, fantasy, identification, and lack.",
                [
                    "Freud",
                    "Lacan",
                    "The unconscious",
                    "Desire",
                ],
            ),
            (
                "Apparatus theory",
                "Why it matters: Apparatus theory asks how cinema's technological and institutional setup positions viewers.",
                [
                    "Suture",
                    "Identification",
                    "Ideological apparatus",
                    "The cinematic subject",
                ],
            ),
            (
                "Spectatorship",
                "Why it matters: Spectatorship theories examine how viewers are invited, constrained, or able to resist.",
                [
                    "Gaze",
                    "Voyeurism",
                    "Audience position",
                    "Counter-spectatorship",
                ],
            ),
        ],
    ),
    (
        "Feminist, Queer, and Gender Film Theory",
        "Study how cinema constructs gender, sexuality, embodiment, desire, and resistance.",
        [
            (
                "Feminist film theory",
                "Why it matters: Feminist theory critiques representation, spectatorship, labor, and cinematic pleasure.",
                [
                    "Male gaze",
                    "Women as image",
                    "Feminist counter-cinema",
                    "Authorship and labor",
                ],
            ),
            (
                "Queer film theory",
                "Why it matters: Queer approaches study desire, temporality, performance, ambiguity, and nonnormative spectatorship.",
                [
                    "Queer coding",
                    "Camp",
                    "Queer temporality",
                    "New Queer Cinema",
                ],
            ),
            (
                "Embodiment and intersectionality",
                "Why it matters: Gender and sexuality are inseparable from race, class, disability, nation, and embodiment.",
                [
                    "Intersectionality",
                    "Trans cinema",
                    "Disability and embodiment",
                    "Affect and the body",
                ],
            ),
        ],
    ),
    (
        "Race, Postcolonial, Indigenous, and Transnational Film Theory",
        "Analyze cinema through empire, migration, diaspora, racial formation, and global power relations.",
        [
            (
                "Race and representation",
                "Why it matters: Students analyze how cinema constructs racial meaning and how filmmakers contest dominant images.",
                [
                    "Stereotype",
                    "Counter-image",
                    "Racial formation",
                    "Black film theory",
                ],
            ),
            (
                "Postcolonial theory",
                "Why it matters: Postcolonial film theory links image-making to empire, nation, language, migration, and resistance.",
                [
                    "Orientalism",
                    "Third Cinema",
                    "Hybridity",
                    "Decolonial critique",
                ],
            ),
            (
                "Transnational and Indigenous cinemas",
                "Why it matters: These frameworks challenge national containers and center sovereignty, diaspora, and circulation.",
                [
                    "Diaspora cinema",
                    "Indigenous media",
                    "Border cinema",
                    "Festival circuits",
                ],
            ),
        ],
    ),
    (
        "Marxist, Ideological, and Cultural Studies Approaches",
        "Connect films to capitalism, labor, ideology, institutions, audiences, and everyday cultural life.",
        [
            (
                "Ideology critique",
                "Why it matters: Ideology criticism asks how films naturalize or challenge social arrangements.",
                [
                    "Base and superstructure",
                    "Hegemony",
                    "Interpellation",
                    "Contradiction",
                ],
            ),
            (
                "Industry and labor",
                "Why it matters: Cinema is an art and an industry, shaped by money, labor, technology, and ownership.",
                [
                    "Studio system",
                    "Independent production",
                    "Creative labor",
                    "Distribution power",
                ],
            ),
            (
                "Cultural studies",
                "Why it matters: Cultural studies links texts to audience practices, subcultures, institutions, and everyday meaning.",
                [
                    "Encoding/decoding",
                    "Reception",
                    "Popular culture",
                    "Fan studies",
                ],
            ),
        ],
    ),
    (
        "Documentary, Nonfiction, and Ethics of Representation",
        "Evaluate documentary truth claims, performance, evidence, voice, consent, and representational responsibility.",
        [
            (
                "Documentary modes",
                "Why it matters: Documentary theory distinguishes forms of truth claim, voice, observation, and performance.",
                [
                    "Expository",
                    "Observational",
                    "Participatory",
                    "Performative",
                ],
            ),
            (
                "Evidence and ethics",
                "Why it matters: Nonfiction images carry responsibilities around consent, context, harm, and truth.",
                [
                    "Consent",
                    "Voice",
                    "Witnessing",
                    "Staged reality",
                ],
            ),
            (
                "Essay and experimental nonfiction",
                "Why it matters: Nonfiction can also be reflexive, poetic, archival, or essayistic.",
                [
                    "Essay film",
                    "Archive film",
                    "Ethnographic film",
                    "Reflexivity",
                ],
            ),
        ],
    ),
    (
        "Cognitive, Phenomenological, Affect, and Post-Theory Approaches",
        "Introduce theories of perception, embodiment, emotion, cognition, and debates over grand theory.",
        [
            (
                "Cognitive film theory",
                "Why it matters: Cognitive approaches explain comprehension, attention, emotion, and inference.",
                [
                    "Narrative comprehension",
                    "Schema",
                    "Emotion",
                    "Attention",
                ],
            ),
            (
                "Phenomenology and affect",
                "Why it matters: Embodied approaches ask how cinema is felt through perception, sensation, and bodily response.",
                [
                    "Embodiment",
                    "Haptics",
                    "Affect",
                    "Sonic experience",
                ],
            ),
            (
                "Post-theory debates",
                "Why it matters: Post-theory critiques grand theory and pushes for middle-level, evidence-based explanation.",
                [
                    "Bordwell",
                    "Carroll",
                    "Historical poetics",
                    "Theory critique",
                ],
            ),
        ],
    ),
    (
        "Digital Cinema, Streaming, Platforms, and Media Convergence",
        "Explore how digital production, distribution, data, streaming, and platform culture reshape film theory and criticism.",
        [
            (
                "Digital aesthetics",
                "Why it matters: Digital cinema changes indexicality, realism, editing, color, effects, and production workflows.",
                [
                    "Digital cinematography",
                    "CGI",
                    "Color grading",
                    "Virtual production",
                ],
            ),
            (
                "Platforms and streaming",
                "Why it matters: Streaming changes circulation, attention, archives, algorithms, and criticism.",
                [
                    "Recommendation systems",
                    "Binge viewing",
                    "Platform catalogs",
                    "Datafication",
                ],
            ),
            (
                "Media convergence",
                "Why it matters: Film now intersects with television, games, social media, video essays, and installation art.",
                [
                    "Transmedia",
                    "Interactive media",
                    "Video essays",
                    "Expanded cinema",
                ],
            ),
        ],
    ),
    (
        "Research Methods, Scholarly Sources, and Critical Film Writing",
        "Develop rigorous film-critical writing through close reading, theory use, research methods, and argument design.",
        [
            (
                "Film research methods",
                "Why it matters: Strong criticism combines close analysis with historical, theoretical, and scholarly research.",
                [
                    "Scholarly databases",
                    "Archives",
                    "Trade press",
                    "Reception materials",
                ],
            ),
            (
                "Critical argument",
                "Why it matters: Students learn to turn observations into a focused, contestable, well-supported thesis.",
                [
                    "Thesis design",
                    "Evidence selection",
                    "Scene analysis",
                    "Counterargument",
                ],
            ),
            (
                "Citation and style",
                "Why it matters: Professional film writing requires clean citation, frame-specific evidence, and precise prose.",
                [
                    "MLA or Chicago style",
                    "Film citation",
                    "Shot description",
                    "Revision process",
                ],
            ),
        ],
    ),
    (
        "Critical Essay, Video Essay, or Curatorial Capstone",
        "Synthesize theory, history, formal analysis, and research in a polished critical or curatorial project.",
        [
            (
                "Critical essay",
                "Why it matters: The essay capstone asks students to use theory and evidence in a polished scholarly argument.",
                [
                    "Research question",
                    "Theoretical framework",
                    "Close reading",
                    "Annotated bibliography",
                ],
            ),
            (
                "Video essay",
                "Why it matters: The video essay option turns criticism into audiovisual argument.",
                [
                    "Clip selection",
                    "Voice-over",
                    "Fair use reasoning",
                    "Visual evidence",
                ],
            ),
            (
                "Curatorial project",
                "Why it matters: The curatorial option frames films through programming, notes, public scholarship, and historical context.",
                [
                    "Program rationale",
                    "Screening notes",
                    "Audience design",
                    "Public-facing criticism",
                ],
            ),
        ],
    ),
]

write_seed(
    "film-theory-and-criticism",
    "Film Theory and Criticism",
    DESC,
    "b2c3d4e5-6f7a-4b47-8d67-7e8f9a0b1c47",
    "fthcjson",
    UNITS,
    "film_theory_and_criticism",
)
