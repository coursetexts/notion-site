"""Documentary Production curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "Students learn the major nonfiction traditions so production choices are grounded in film history, "
    "ethics, and form."
)

UNITS = [
    (
        "Documentary Modes, Histories, and Traditions",
        "Students learn the major nonfiction traditions so production choices are grounded in film history, ethics, and form.",
        [
            (
                "Documentary modes",
                "This subtopic introduces the formal families documentary makers draw from when shaping reality into cinema.",
                [
                    "Expository",
                    "Observational",
                    "Participatory",
                    "Reflexive",
                    "Performative",
                    "Poetic",
                ],
            ),
            (
                "Nonfiction traditions",
                "Students connect current practice to newsreel, ethnographic film, cinema verite, direct cinema, essay film, and public media.",
                [
                    "Newsreel",
                    "Direct cinema",
                    "Cinema verite",
                    "Essay film",
                    "Ethnographic film",
                    "Public television",
                ],
            ),
            (
                "Authorship and point of view",
                "The point is to identify the filmmaker's stance rather than pretending documentaries have no perspective.",
                [
                    "Voice",
                    "Narration",
                    "Subjectivity",
                    "Reflexivity",
                    "Access",
                    "Audience address",
                ],
            ),
        ],
    ),
    (
        "Research, Topic Discovery, and Subject Development",
        "Strong documentaries begin before the camera: with research, access, trust, stakes, and an evolving central question.",
        [
            (
                "Topic discovery",
                "Students learn to turn interests into filmable questions with conflict, stakes, visual life, and ethical clarity.",
                [
                    "Research question",
                    "Logline",
                    "Central tension",
                    "Dramatic stakes",
                    "Visual potential",
                    "Feasibility",
                ],
            ),
            (
                "Background research",
                "This subtopic covers the factual work needed before interviews or scenes are recorded.",
                [
                    "Source audit",
                    "Timeline",
                    "Expert interview",
                    "Archive search",
                    "Fact pattern",
                    "Context brief",
                ],
            ),
            (
                "Access and relationship-building",
                "Students learn that access is negotiated continuously through trust, boundaries, clarity, and reciprocity.",
                [
                    "Gatekeepers",
                    "Release discussion",
                    "Participant trust",
                    "Access agreement",
                    "Boundaries",
                    "Reciprocity",
                ],
            ),
        ],
    ),
    (
        "Story Concept, Treatment, and Production Design",
        "Students transform research into a practical nonfiction blueprint without locking the film into a false script.",
        [
            (
                "Treatment writing",
                "The treatment clarifies story shape, tone, access, characters, scenes, and production path.",
                [
                    "Synopsis",
                    "Director's statement",
                    "Character list",
                    "Scene possibilities",
                    "Visual approach",
                    "Story arc",
                ],
            ),
            (
                "Production design for nonfiction",
                "This subtopic covers planning the film's look, locations, visual motifs, and access constraints.",
                [
                    "Location palette",
                    "Visual motif",
                    "Observational scene",
                    "Interview setting",
                    "B-roll plan",
                    "Mood board",
                ],
            ),
            (
                "Work samples and proof of concept",
                "Students learn how short samples communicate cinematic promise to collaborators, funders, and mentors.",
                [
                    "Sizzle reel",
                    "Sample scene",
                    "Trailer",
                    "Lookbook",
                    "Pitch deck",
                    "Access reel",
                ],
            ),
        ],
    ),
    (
        "Documentary Ethics, Consent, and Accountability",
        "Documentary craft depends on responsibility to participants, audiences, collaborators, and communities.",
        [
            (
                "Informed consent",
                "Students learn consent as an ongoing process, not a one-time form.",
                [
                    "Release form",
                    "Ongoing consent",
                    "Power imbalance",
                    "Withdrawal",
                    "Minor consent",
                    "Plain-language explanation",
                ],
            ),
            (
                "Representation and harm",
                "This subtopic develops judgment about dignity, context, stereotyping, privacy, and unintended consequences.",
                [
                    "Representation",
                    "Privacy",
                    "Context collapse",
                    "Stigma",
                    "Community review",
                    "Duty of care",
                ],
            ),
            (
                "Participant accountability",
                "Students learn to plan for participant communication before, during, and after production.",
                [
                    "Expectation setting",
                    "Rough-cut discussion",
                    "Trauma-informed practice",
                    "Safety plan",
                    "Credit",
                    "Impact feedback",
                ],
            ),
        ],
    ),
    (
        "Producing, Crew Roles, and Production Management",
        "Students learn how professional documentary sets stay organized, lawful, safe, and collaborative.",
        [
            (
                "Producer workflow",
                "The producer turns creative intent into logistics, budget, schedule, paperwork, and delivery.",
                [
                    "Budget",
                    "Schedule",
                    "Call sheet",
                    "Crew deal memo",
                    "Insurance",
                    "Deliverables",
                ],
            ),
            (
                "Crew roles",
                "This subtopic clarifies who does what on lean documentary teams.",
                [
                    "Director",
                    "Producer",
                    "DP",
                    "Sound recordist",
                    "Editor",
                    "Impact producer",
                ],
            ),
            (
                "Risk and field logistics",
                "Students plan for travel, access, data security, weather, equipment, safety, and participant vulnerability.",
                [
                    "Risk assessment",
                    "Location release",
                    "Travel logistics",
                    "Equipment checklist",
                    "Data backup",
                    "Emergency contact",
                ],
            ),
        ],
    ),
    (
        "Interviewing Techniques and Character Development",
        "Interviews are not just information gathering; they reveal character, memory, emotion, conflict, and perspective.",
        [
            (
                "Interview preparation",
                "Students learn to design questions that invite story, specificity, and reflection.",
                [
                    "Pre-interview",
                    "Question arc",
                    "Follow-up",
                    "Active listening",
                    "Silence",
                    "Chronology",
                ],
            ),
            (
                "Interview production",
                "This subtopic covers technical and relational choices during interview filming.",
                [
                    "Eyeline",
                    "Framing",
                    "Lighting",
                    "Room tone",
                    "Lav mic",
                    "Consent reminder",
                ],
            ),
            (
                "Character development",
                "Students learn to shape complex participants without flattening them into talking points.",
                [
                    "Motivation",
                    "Contradiction",
                    "Backstory",
                    "Desire",
                    "Obstacle",
                    "Change",
                ],
            ),
        ],
    ),
    (
        "Observational and Verite Field Production",
        "Students practice capturing unscripted life as scenes with action, stakes, duration, and cinematic attention.",
        [
            (
                "Observational shooting",
                "This subtopic teaches patience, anticipation, coverage, and ethical presence.",
                [
                    "Scene coverage",
                    "Follow focus",
                    "Continuity",
                    "Patience",
                    "Blocking",
                    "Natural light",
                ],
            ),
            (
                "Verite storytelling",
                "Students learn how real-time scenes create story without explanatory narration.",
                [
                    "Action",
                    "Reaction",
                    "Beat",
                    "Dramatic question",
                    "Scene arc",
                    "Conflict",
                ],
            ),
            (
                "Field conduct",
                "Students develop habits for being present without overwhelming the event.",
                [
                    "Small footprint",
                    "Participant comfort",
                    "Crew communication",
                    "Respectful distance",
                    "Reset ethics",
                    "Field notes",
                ],
            ),
        ],
    ),
    (
        "Cinematography, Lighting, and Visual Language",
        "The camera creates meaning through where it stands, how it moves, what it excludes, and how it observes.",
        [
            (
                "Camera grammar",
                "Students connect shot choice to attention, intimacy, geography, and power.",
                [
                    "Wide shot",
                    "Medium shot",
                    "Close-up",
                    "POV",
                    "Movement",
                    "Lens choice",
                ],
            ),
            (
                "Lighting for documentary",
                "This subtopic covers naturalistic, mobile, and interview lighting for real-world conditions.",
                [
                    "Key light",
                    "Fill",
                    "Backlight",
                    "Available light",
                    "Negative fill",
                    "Color temperature",
                ],
            ),
            (
                "Visual continuity",
                "Students plan images that can cut together while preserving truthfulness and atmosphere.",
                [
                    "Coverage",
                    "Cutaway",
                    "Sequence",
                    "Screen direction",
                    "Match action",
                    "Visual motif",
                ],
            ),
        ],
    ),
    (
        "Production Sound and Sonic Storytelling",
        "Sound carries place, emotion, credibility, rhythm, and memory; weak sound can break an otherwise strong film.",
        [
            (
                "Field recording",
                "Students learn clean dialogue and ambient sound capture in uncontrolled locations.",
                [
                    "Lav mic",
                    "Boom mic",
                    "Room tone",
                    "Wild sound",
                    "Gain staging",
                    "Monitoring",
                ],
            ),
            (
                "Sound as story",
                "This subtopic treats sound as a narrative layer rather than a technical afterthought.",
                [
                    "Atmosphere",
                    "Motif",
                    "Silence",
                    "Voice",
                    "Music cue",
                    "Sonic perspective",
                ],
            ),
            (
                "Post sound workflow",
                "Students learn the basics of organizing, cleaning, mixing, and delivering audio.",
                [
                    "Sync",
                    "Noise reduction",
                    "Dialogue edit",
                    "Sound design",
                    "Mix",
                    "Loudness",
                ],
            ),
        ],
    ),
    (
        "Archival, Found Footage, and Fair Use",
        "Archival work expands time, evidence, memory, and texture, but requires research discipline and legal care.",
        [
            (
                "Archive research",
                "Students learn how to locate, evaluate, log, and contextualize historical material.",
                [
                    "Archive log",
                    "Source citation",
                    "Metadata",
                    "Provenance",
                    "Public domain",
                    "Orphan work",
                ],
            ),
            (
                "Rights and clearances",
                "This subtopic introduces permissions, releases, copyright, fair use, and errors-and-omissions concerns.",
                [
                    "Copyright",
                    "Fair use",
                    "License",
                    "Release",
                    "E&O insurance",
                    "Chain of title",
                ],
            ),
            (
                "Creative archival use",
                "Students learn to make archival material cinematic instead of merely illustrative.",
                [
                    "Montage",
                    "Text on screen",
                    "Photo move",
                    "Rephotography",
                    "Layering",
                    "Counterpoint",
                ],
            ),
        ],
    ),
    (
        "Documentary Structure and Editing",
        "Editing is where documentary argument, character, rhythm, evidence, and emotional shape become visible.",
        [
            (
                "From footage to story",
                "Students learn logging, selects, paper edits, cards, and assembly cuts.",
                [
                    "Logging",
                    "Selects",
                    "Stringout",
                    "Paper edit",
                    "Scene card",
                    "Assembly",
                ],
            ),
            (
                "Narrative structure",
                "This subtopic covers act structure, sequence building, reveals, turning points, and endings.",
                [
                    "Act break",
                    "Sequence",
                    "Reveal",
                    "Escalation",
                    "Parallel structure",
                    "Resolution",
                ],
            ),
            (
                "Revision and critique",
                "Students learn how rough cuts improve through feedback, diagnostics, and ethical reconsideration.",
                [
                    "Rough cut",
                    "Fine cut",
                    "Feedback screening",
                    "Story note",
                    "Pacing",
                    "Ethical review",
                ],
            ),
        ],
    ),
    (
        "Writing, Narration, Graphics, and Exposition",
        "Documentaries often need words, but the best writing supports image, evidence, and feeling instead of explaining everything.",
        [
            (
                "Narration and voiceover",
                "Students decide when narration clarifies and when it over-controls the viewer.",
                [
                    "Voiceover",
                    "First-person narration",
                    "Expository narration",
                    "Tone",
                    "Restraint",
                    "Rewrite",
                ],
            ),
            (
                "On-screen text and graphics",
                "This subtopic covers lower thirds, maps, dates, statistics, captions, and visual explanation.",
                [
                    "Lower third",
                    "Title card",
                    "Map",
                    "Infographic",
                    "Caption",
                    "Source label",
                ],
            ),
            (
                "Scripted connective tissue",
                "Students learn to write bridges, introductions, endings, and pitch copy.",
                [
                    "Opening hook",
                    "Transition",
                    "Setup",
                    "Payoff",
                    "Synopsis",
                    "Director statement",
                ],
            ),
        ],
    ),
    (
        "Funding, Pitching, and Documentary Business",
        "Students learn how documentary ideas become funded, scheduled, legally protected, and professionally presented.",
        [
            (
                "Funding landscape",
                "This subtopic introduces grants, labs, broadcasters, foundations, crowdfunding, and fiscal sponsorship.",
                [
                    "Grant",
                    "Fiscal sponsor",
                    "Lab",
                    "Commissioning editor",
                    "Crowdfunding",
                    "Equity",
                ],
            ),
            (
                "Pitch materials",
                "Students assemble clear materials that communicate story, access, team, budget, audience, and impact.",
                [
                    "Pitch deck",
                    "Budget top sheet",
                    "Schedule",
                    "Trailer",
                    "Lookbook",
                    "Impact statement",
                ],
            ),
            (
                "Professional presentation",
                "Students practice concise verbal pitches and constructive response to questions.",
                [
                    "Verbal pitch",
                    "Q&A",
                    "Comparable films",
                    "Audience",
                    "Team credibility",
                    "Follow-up",
                ],
            ),
        ],
    ),
    (
        "Distribution, Festivals, Public Media, and Impact",
        "A documentary's life continues after export through festivals, broadcast, streaming, classrooms, communities, and campaigns.",
        [
            (
                "Distribution pathways",
                "Students compare realistic pathways for short and feature documentaries.",
                [
                    "Festival strategy",
                    "Public media",
                    "Streaming",
                    "Educational distribution",
                    "Community screening",
                    "Self-distribution",
                ],
            ),
            (
                "Impact producing",
                "This subtopic covers audience strategy, partnerships, campaigns, and ethical outreach.",
                [
                    "Impact campaign",
                    "Stakeholder map",
                    "Partner organization",
                    "Screening guide",
                    "Call to action",
                    "Evaluation",
                ],
            ),
            (
                "Deliverables and publicity",
                "Students learn the materials required for professional circulation.",
                [
                    "Press kit",
                    "Poster",
                    "Trailer",
                    "Stills",
                    "Captions",
                    "DCP/export specs",
                ],
            ),
        ],
    ),
    (
        "Trauma-Informed, Community-Based, and Collaborative Practice",
        "Documentary production requires care with vulnerable stories, shared authority, and long-term relationships.",
        [
            (
                "Trauma-informed production",
                "Students learn practices that reduce coercion, retraumatization, and extractive storytelling.",
                [
                    "Choice",
                    "Control",
                    "Pacing",
                    "Grounding",
                    "Referral resources",
                    "Safety check-in",
                ],
            ),
            (
                "Collaborative methods",
                "This subtopic explores co-creation, participant review, community screenings, and shared decision-making.",
                [
                    "Co-authorship",
                    "Participant review",
                    "Community advisory board",
                    "Shared footage",
                    "Collective credit",
                    "Reciprocity",
                ],
            ),
            (
                "Accountability after release",
                "Students plan for consequences that may emerge after a film enters public circulation.",
                [
                    "Impact risk",
                    "Participant follow-up",
                    "Public response",
                    "Correction",
                    "Context update",
                    "Long-tail accountability",
                ],
            ),
        ],
    ),
    (
        "Capstone: Producing a Short Documentary",
        "Students synthesize the course by completing a short nonfiction film with a research file, production binder, edit history, and public-facing release plan.",
        [
            (
                "Pre-production package",
                "Students assemble the practical and creative materials needed before shooting.",
                [
                    "Logline",
                    "Treatment",
                    "Access plan",
                    "Schedule",
                    "Interview guide",
                    "Consent packet",
                ],
            ),
            (
                "Production and post-production workflow",
                "This subtopic manages footage from shoot through picture lock and sound mix.",
                [
                    "Media ingest",
                    "Backup",
                    "Sync",
                    "Assembly",
                    "Fine cut",
                    "Color/sound pass",
                ],
            ),
            (
                "Final presentation",
                "Students deliver the film and defend creative, ethical, and technical decisions.",
                [
                    "Artist statement",
                    "Screening",
                    "Critique",
                    "Impact plan",
                    "Reflection memo",
                    "Portfolio link",
                ],
            ),
        ],
    ),
]


if __name__ == "__main__":
    write_seed(
        "documentary-production",
        "Documentary Production",
        DESC,
        "d8e9f0a1-2b3c-4d43-8f23-3a4b5c6d7e43",
        "docpjson",
        UNITS,
        "documentary_production",
    )
