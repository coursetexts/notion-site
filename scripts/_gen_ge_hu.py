"""Introduction to the Humanities curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "Introduction to the Humanities is a first-year course in the study of human meaning, expression, "
    "memory, value, and culture. Students read literature, examine philosophy, analyze visual art and "
    "architecture, listen to music, interpret performance, study history and religion, and investigate "
    "how language, media, power, and identity shape cultural life. The course emphasizes close "
    "reading, close looking, historical context, ethical reasoning, cross-cultural comparison, research "
    "literacy, and public communication."
)

UNITS = [
    (
        "What Are the Humanities? Questions, Methods, and Human Meaning",
        "This opening unit defines the humanities as disciplines that study meaning, value, expression, memory, and human experience. Students learn why literature, philosophy, art, history, religion, music, performance, and language remain essential for interpreting culture and modern life.",
        [
            (
                "The scope of humanistic study",
                "Students learn what distinguishes humanities inquiry from scientific and social-scientific explanation while also seeing where the fields overlap.",
                [
                    "Meaning, value, interpretation, and form",
                    "Texts, artifacts, performances, images, and places",
                    "Humanistic questions about identity, justice, mortality, beauty, and belonging",
                    "Connections to liberal arts education",
                ],
            ),
            (
                "Humanities as methods of attention",
                "The point is to cultivate careful noticing before judgment: reading, listening, looking, comparing, and contextualizing.",
                [
                    "Slow reading and close looking",
                    "Description before interpretation",
                    "Historical and cultural framing",
                    "Ambiguity, evidence, and multiple meanings",
                ],
            ),
            (
                "Why the humanities matter now",
                "Students connect the humanities to public life, democratic dialogue, ethical judgment, creativity, and self-understanding.",
                [
                    "Citizenship and civic imagination",
                    "Empathy and perspective-taking",
                    "Cultural memory and public debate",
                    "Humanistic skills in contemporary careers",
                ],
            ),
        ],
    ),
    (
        "Humanistic Inquiry: Close Reading, Interpretation, Context, and Argument",
        "This unit gives students the toolkit for doing humanities work. They practice turning observation into interpretation, interpretation into argument, and argument into clear academic writing.",
        [
            (
                "Close reading and close looking",
                "Students learn to build interpretations from specific evidence rather than broad impressions.",
                [
                    "Diction, image, metaphor, structure, and genre",
                    "Composition, line, color, material, and scale",
                    "Sound, rhythm, gesture, and performance detail",
                    "Patterns, tensions, and anomalies",
                ],
            ),
            (
                "Context and historical method",
                "Students learn that works are made inside worlds: institutions, languages, audiences, technologies, and power relations.",
                [
                    "Author, maker, patron, and audience",
                    "Period, place, movement, and medium",
                    "Reception and changing interpretation",
                    "Archives and primary sources",
                ],
            ),
            (
                "Argument and scholarly conversation",
                "The gist is learning to enter a debate responsibly, with claims, evidence, warrants, and respectful disagreement.",
                [
                    "Research questions and thesis statements",
                    "Evidence selection and explanation",
                    "Counterargument and revision",
                    "Citation and academic integrity",
                ],
            ),
        ],
    ),
    (
        "Literature as World-Making: Poetry, Narrative, Drama, and Myth",
        "Literature gives students practice interpreting language as art, memory, thought, and social imagination. The unit treats literary works as crafted forms that build worlds, voices, conflicts, and ethical possibilities.",
        [
            (
                "Poetry and compressed language",
                "Students learn how poems make meaning through rhythm, image, sound, form, and silence.",
                [
                    "Speaker, tone, and address",
                    "Figurative language and imagery",
                    "Form, meter, line, and stanza",
                    "Translation and performance",
                ],
            ),
            (
                "Narrative and fiction",
                "Students examine how stories organize time, causality, character, perspective, and moral complexity.",
                [
                    "Plot, scene, and structure",
                    "Narrator and point of view",
                    "Character, desire, and conflict",
                    "World-building and social context",
                ],
            ),
            (
                "Drama, myth, and collective imagination",
                "Students explore texts meant for performance and stories that communities use to explain origins, values, and crisis.",
                [
                    "Tragedy, comedy, and ritual",
                    "Mythic patterns and archetypes",
                    "Performance, audience, and embodiment",
                    "Adaptation and reinterpretation",
                ],
            ),
        ],
    ),
    (
        "Philosophy and the History of Ideas: Reality, Knowledge, Ethics, and the Self",
        "Philosophy teaches students to ask precise questions, test assumptions, and evaluate reasons. This unit introduces major philosophical problems that shape humanistic inquiry across periods and cultures.",
        [
            (
                "Reality, knowledge, and skepticism",
                "Students learn how philosophers question what exists, what can be known, and how belief can be justified.",
                [
                    "Metaphysics and being",
                    "Epistemology and evidence",
                    "Skepticism and certainty",
                    "Mind, body, and self",
                ],
            ),
            (
                "Ethics and moral reasoning",
                "Students practice comparing frameworks for judgment and applying them to difficult human situations.",
                [
                    "Virtue ethics",
                    "Deontology and duty",
                    "Consequentialism",
                    "Care, responsibility, and applied ethics",
                ],
            ),
            (
                "Political philosophy and justice",
                "The unit connects ideas about the good life to institutions, rights, authority, and public life.",
                [
                    "Liberty, equality, and rights",
                    "Authority and legitimacy",
                    "Justice and distribution",
                    "Democracy, citizenship, and dissent",
                ],
            ),
        ],
    ),
    (
        "Visual Arts and Architecture: Seeing, Form, Space, and Power",
        "This unit trains visual literacy. Students learn to interpret images, objects, buildings, and spaces as cultural arguments shaped by materials, techniques, patrons, audiences, and histories.",
        [
            (
                "Formal visual analysis",
                "Students learn to describe what they see with precision before moving into meaning.",
                [
                    "Line, color, light, texture, and composition",
                    "Scale, proportion, balance, and movement",
                    "Medium, material, and technique",
                    "Iconography and symbolism",
                ],
            ),
            (
                "Architecture and built environments",
                "Students examine how space organizes social life, ritual, memory, authority, and belonging.",
                [
                    "Function and form",
                    "Sacred, civic, domestic, and commercial spaces",
                    "Urbanism and landscape",
                    "Monuments, memorials, and contested space",
                ],
            ),
            (
                "Museums, display, and cultural power",
                "The unit asks how art becomes heritage, who interprets it, and what responsibilities follow.",
                [
                    "Collection and provenance",
                    "Curatorial framing",
                    "Repatriation and cultural property",
                    "Public access and interpretation",
                ],
            ),
        ],
    ),
    (
        "Music, Theater, Performance, and Embodied Culture",
        "Humanities study is not only textual or visual. This unit examines live, embodied, and sonic forms that create meaning through voice, movement, time, audience, and ritual.",
        [
            (
                "Music and listening",
                "Students learn to discuss music as patterned sound with cultural, emotional, and historical force.",
                [
                    "Melody, rhythm, harmony, timbre, and texture",
                    "Genre and performance context",
                    "Sacred, courtly, popular, and experimental music",
                    "Listening journals and sonic evidence",
                ],
            ),
            (
                "Theater and performance",
                "Students study performance as an event made by bodies, spaces, texts, audiences, and conventions.",
                [
                    "Script, staging, and dramaturgy",
                    "Gesture, voice, costume, and set",
                    "Audience and liveness",
                    "Performance traditions across cultures",
                ],
            ),
            (
                "Embodiment and cultural practice",
                "The goal is to recognize that culture is enacted, repeated, improvised, and contested through bodies.",
                [
                    "Ritual and ceremony",
                    "Dance and movement",
                    "Everyday performance and identity",
                    "Documentation and performance archives",
                ],
            ),
        ],
    ),
    (
        "History, Memory, Archives, and Cultural Context",
        "History gives humanities students a disciplined way to study change over time. This unit distinguishes memory from evidence, narrative from archive, and interpretation from mere chronology.",
        [
            (
                "Historical thinking",
                "Students learn to analyze causation, contingency, continuity, change, and periodization.",
                [
                    "Chronology and periodization",
                    "Cause, consequence, and contingency",
                    "Comparison across places and periods",
                    "Microhistory and global history",
                ],
            ),
            (
                "Archives and primary sources",
                "Students practice reading historical evidence as partial, situated, and often contested.",
                [
                    "Manuscripts, letters, images, maps, and objects",
                    "Source criticism and bias",
                    "Silences in the archive",
                    "Oral history and lived memory",
                ],
            ),
            (
                "Memory, commemoration, and public history",
                "The unit connects history to collective identity and civic debate.",
                [
                    "Monuments and memorials",
                    "Museums and heritage sites",
                    "Trauma, testimony, and remembrance",
                    "History in public controversy",
                ],
            ),
        ],
    ),
    (
        "Religion, Myth, Ritual, and Meaning-Making",
        "Religious and mythic traditions are central to humanistic study because they shape art, literature, ethics, politics, time, community, and ideas of the sacred. This unit approaches religion academically, comparatively, and respectfully.",
        [
            (
                "Academic study of religion",
                "Students learn to analyze religion without reducing it to belief alone or evaluating it devotionally.",
                [
                    "Myth, ritual, doctrine, ethics, and community",
                    "Insider and outsider perspectives",
                    "Text, practice, material culture, and lived religion",
                    "Comparison and its limits",
                ],
            ),
            (
                "Myth and symbolic worlds",
                "Students examine how stories organize cosmology, identity, social order, and human purpose.",
                [
                    "Creation and origin stories",
                    "Heroes, tricksters, gods, and ancestors",
                    "Sacred time and sacred space",
                    "Myth in modern culture",
                ],
            ),
            (
                "Ritual, practice, and ethics",
                "The goal is to understand religion as embodied, communal, and moral practice.",
                [
                    "Pilgrimage, prayer, festival, and sacrifice",
                    "Rites of passage",
                    "Law, ethics, and care",
                    "Religion in public life",
                ],
            ),
        ],
    ),
    (
        "Language, Translation, Rhetoric, and Communication",
        "Language is the medium through which much of the humanities travels. This unit helps students see language as form, power, translation, persuasion, identity, and historical record.",
        [
            (
                "Language and meaning",
                "Students learn that words carry histories, assumptions, connotations, and cultural worlds.",
                [
                    "Denotation and connotation",
                    "Metaphor and figurative meaning",
                    "Dialect, register, and code-switching",
                    "Language change and etymology",
                ],
            ),
            (
                "Translation and world literature",
                "Students examine what changes when works move across languages, media, audiences, and time.",
                [
                    "Literal and interpretive translation",
                    "Untranslatable terms and cultural context",
                    "Adaptation and reception",
                    "Translator visibility and ethics",
                ],
            ),
            (
                "Rhetoric and persuasion",
                "The unit teaches students to analyze how language moves audiences and shapes public life.",
                [
                    "Ethos, pathos, and logos",
                    "Style, arrangement, and audience",
                    "Propaganda and public argument",
                    "Digital rhetoric and attention",
                ],
            ),
        ],
    ),
    (
        "Cross-Cultural Encounters, Global Traditions, and Comparative Humanities",
        "A world-class humanities course must move beyond a single canon. This unit asks students to compare works across regions and traditions while avoiding flattening, exoticizing, or treating cultures as static.",
        [
            (
                "Comparative method",
                "Students learn how to compare responsibly: with specificity, context, and awareness of unequal power.",
                [
                    "Common questions, different forms",
                    "Translation and mediation",
                    "Context before generalization",
                    "Limits of analogy",
                ],
            ),
            (
                "Global traditions and circulation",
                "Students examine how ideas, texts, objects, and practices move through trade, empire, migration, pilgrimage, and media.",
                [
                    "Silk roads and oceanic exchange",
                    "Colonialism and cultural encounter",
                    "Diaspora and migration",
                    "Global modernisms and contemporary culture",
                ],
            ),
            (
                "Canon, inclusion, and curriculum",
                "The unit asks who gets preserved, taught, translated, funded, and remembered.",
                [
                    "Canon formation",
                    "Marginalized voices and recovery work",
                    "Indigenous and decolonial perspectives",
                    "World literature and world art debates",
                ],
            ),
        ],
    ),
    (
        "Aesthetics, Beauty, Taste, and Judgment",
        "Aesthetics helps students ask how humans experience, value, and debate art, beauty, sublimity, ugliness, pleasure, and form. The unit links feeling to argument rather than treating taste as merely personal.",
        [
            (
                "Theories of beauty and art",
                "Students encounter classic and contemporary debates about what makes something art and how aesthetic value is argued.",
                [
                    "Beauty, sublimity, and the picturesque",
                    "Mimesis, expression, form, and concept",
                    "Art, craft, and design",
                    "Institutional and social theories of art",
                ],
            ),
            (
                "Taste, judgment, and criticism",
                "Students practice making evaluative claims that are more rigorous than preference.",
                [
                    "Criteria and evidence",
                    "Reception and audience",
                    "Criticism as public writing",
                    "Disagreement and pluralism",
                ],
            ),
            (
                "Aesthetic experience in everyday life",
                "The unit expands aesthetics beyond museums to media, design, food, fashion, nature, and digital culture.",
                [
                    "Popular culture and taste hierarchies",
                    "Design and everyday objects",
                    "Environment and the sublime",
                    "Attention, boredom, and wonder",
                ],
            ),
        ],
    ),
    (
        "Modernity, Technology, Media, and the Digital Humanities",
        "This unit connects the humanities to modern media systems and digital methods. Students consider how print, photography, film, the internet, data, and AI change cultural memory, authorship, interpretation, and access.",
        [
            (
                "Media and modern life",
                "Students learn that humanities objects are shaped by technologies of production and circulation.",
                [
                    "Manuscript, print, photography, film, and digital media",
                    "Mass culture and popular culture",
                    "Platforms and attention",
                    "Authorship, remix, and participation",
                ],
            ),
            (
                "Digital humanities methods",
                "Students receive an introductory sense of how digital tools can support, but not replace, interpretation.",
                [
                    "Text encoding and digital editions",
                    "Mapping and timelines",
                    "Text mining and distant reading",
                    "Digital archives and metadata",
                ],
            ),
            (
                "AI, interpretation, and human judgment",
                "The goal is to examine new computational tools through humanistic questions about evidence, bias, creativity, and responsibility.",
                [
                    "Generative AI and authorship",
                    "Algorithmic bias and cultural data",
                    "Citation and disclosure",
                    "What human interpretation still does",
                ],
            ),
        ],
    ),
    (
        "Power, Identity, Justice, and Public Humanities",
        "The humanities study how cultures represent people, justify power, imagine justice, and contest exclusion. This unit brings identity, inequality, public memory, and civic dialogue into the center of interpretation.",
        [
            (
                "Representation and identity",
                "Students analyze how race, gender, class, sexuality, disability, nation, and religion are represented and debated.",
                [
                    "Stereotype and counter-narrative",
                    "Voice, agency, and authorship",
                    "Intersectionality",
                    "Embodiment and lived experience",
                ],
            ),
            (
                "Power, institutions, and cultural authority",
                "Students ask how schools, museums, publishers, archives, media, and states shape what becomes visible.",
                [
                    "Gatekeeping and access",
                    "Censorship and patronage",
                    "Cultural property and ownership",
                    "Public funding and cultural value",
                ],
            ),
            (
                "Public humanities and civic dialogue",
                "The unit connects classroom interpretation to community projects, public scholarship, museums, libraries, and democratic life.",
                [
                    "Public-facing writing",
                    "Community archives and oral history",
                    "Dialogue across difference",
                    "Humanities careers and civic practice",
                ],
            ),
        ],
    ),
    (
        "Humanities Research, Sources, Citation, and Ethical Scholarship",
        "This unit teaches students how to research responsibly in the humanities: finding sources, evaluating authority, building bibliographies, citing correctly, and treating cultural materials with care.",
        [
            (
                "Research design",
                "Students learn to move from curiosity to a focused, answerable, interpretive question.",
                [
                    "Topic narrowing",
                    "Research questions",
                    "Working thesis",
                    "Annotated bibliography",
                ],
            ),
            (
                "Sources and evidence",
                "Students practice distinguishing primary, secondary, and reference sources and using each appropriately.",
                [
                    "Primary texts, objects, images, and recordings",
                    "Scholarly books and articles",
                    "Reference works and research guides",
                    "Digital archives and databases",
                ],
            ),
            (
                "Ethics, citation, and academic integrity",
                "The point is to understand citation as participation in a community of knowledge, not a formatting chore.",
                [
                    "Quotation, paraphrase, and summary",
                    "MLA and Chicago basics",
                    "Plagiarism and patchwriting",
                    "Cultural sensitivity and respectful use",
                ],
            ),
        ],
    ),
    (
        "Capstone Humanistic Interpretation: Curate, Present, Reflect, and Connect to Modern Life",
        "The capstone asks students to synthesize the course by interpreting a humanities object or question for an audience. They build a polished project that demonstrates evidence, context, argument, reflection, and public communication.",
        [
            (
                "Project proposal and object selection",
                "Students choose a text, artwork, performance, place, artifact, idea, or cultural debate that rewards humanistic analysis.",
                [
                    "Object or question rationale",
                    "Research plan",
                    "Audience and purpose",
                    "Ethical considerations",
                ],
            ),
            (
                "Interpretive project design",
                "Students translate research into a clear form such as an essay, exhibit, podcast, presentation, digital exhibit, or public-facing guide.",
                [
                    "Argument and structure",
                    "Multimodal evidence",
                    "Visual and textual clarity",
                    "Accessibility and citation",
                ],
            ),
            (
                "Reflection and transfer",
                "The final step asks students to articulate what humanistic inquiry changes in how they read, see, listen, judge, and participate in public life.",
                [
                    "Process reflection",
                    "Peer critique and revision",
                    "Connection to modern life",
                    "Portfolio-ready documentation",
                ],
            ),
        ],
    ),
]


if __name__ == "__main__":
    write_seed(
        "introduction-to-the-humanities",
        "Introduction to the Humanities",
        DESC,
        "c5d6e7f8-9a0b-4c66-9f56-6d7e8f9a0b66",
        "ihumjson",
        UNITS,
        "introduction_to_the_humanities",
    )
