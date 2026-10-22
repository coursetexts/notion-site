"""Directing curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

# No labeled Catalog Description, Course Description, Course Overview,
# Course Aim, or Course purpose. First expanded-guide prose paragraph.
DESC = (
    "Directing begins with point of view: the ability to interpret material, lead collaborators, "
    "and make choices that serve story, audience, and production reality."
)

UNITS = [
    (
        "The Director's Role, Vision, Voice, and Ethical Responsibility",
        "Directing begins with point of view: the ability to interpret material, lead collaborators, and make choices that serve story, audience, and production reality.",
        [
            (
                "Director as interpreter and author",
                "Students learn how a director turns a script or concept into a specific cinematic or theatrical experience.",
                [
                    "Interpretive thesis",
                    "Personal voice",
                    "Audience contract",
                    "Genre and tone",
                ],
            ),
            (
                "Leadership and responsibility",
                "The director's authority is studied as a service role grounded in clarity, respect, and preparation.",
                [
                    "Creative decision-making",
                    "Crew morale",
                    "Power dynamics",
                    "Inclusive leadership",
                ],
            ),
            (
                "Ethical storytelling",
                "This subtopic asks what directors owe subjects, performers, communities, and audiences.",
                [
                    "Representation",
                    "Consent and harm",
                    "Cultural context",
                    "Accountability",
                ],
            ),
        ],
    ),
    (
        "Script Analysis, Dramatic Action, Structure, and Theme",
        "Directors need to understand story architecture deeply enough to make practical choices about performance, camera, staging, rhythm, and emphasis.",
        [
            (
                "Beats, objectives, and turning points",
                "Students break scenes into playable units so intention and conflict become directable.",
                [
                    "Beat shifts",
                    "Character desire",
                    "Obstacles",
                    "Reversals",
                ],
            ),
            (
                "Theme and dramatic question",
                "This work connects local scene choices to the larger argument or emotional engine of the piece.",
                [
                    "Central question",
                    "Motifs",
                    "Subtext",
                    "Moral stakes",
                ],
            ),
            (
                "Adaptation from page to performance",
                "Students learn how directors translate written material into behavior, image, sound, space, and time.",
                [
                    "Scene spine",
                    "Compression",
                    "Externalizing inner life",
                    "Script notes",
                ],
            ),
        ],
    ),
    (
        "Director's Concept, Research, World-Building, and Visual References",
        "A director's concept organizes research, taste, design, and rehearsal into a coherent production world.",
        [
            (
                "Research methods for directors",
                "Students build habits of historical, cultural, visual, and embodied research.",
                [
                    "Precedent films",
                    "Image boards",
                    "Location research",
                    "Interviews and observation",
                ],
            ),
            (
                "Concept statements and lookbooks",
                "This subtopic teaches students to communicate vision before production pressure starts.",
                [
                    "Mood boards",
                    "Tone references",
                    "Design keywords",
                    "Pitch language",
                ],
            ),
            (
                "World-building and rules",
                "Directors define the rules of the world so actors, designers, and editors can make aligned choices.",
                [
                    "Social world",
                    "Visual logic",
                    "Sound world",
                    "Behavioral rules",
                ],
            ),
        ],
    ),
    (
        "Visual Storytelling, Shot Design, Composition, and Camera Strategy",
        "This section turns directorial intention into images through shot size, angle, movement, composition, lens choice, and visual progression.",
        [
            (
                "Shot grammar",
                "Students learn how camera placement and shot scale communicate power, proximity, isolation, and attention.",
                [
                    "Shot size",
                    "Angle",
                    "Lens perspective",
                    "Point of view",
                ],
            ),
            (
                "Storyboards, floor plans, and shot lists",
                "Planning tools are treated as thinking tools rather than paperwork.",
                [
                    "Overheads",
                    "Storyboard panels",
                    "Shot list priorities",
                    "Coverage maps",
                ],
            ),
            (
                "Visual progression",
                "Students design how image patterns change across a scene or film.",
                [
                    "Escalation",
                    "Contrast",
                    "Repetition",
                    "Visual payoff",
                ],
            ),
        ],
    ),
    (
        "Blocking, Staging, Movement, Space, and Screen Geography",
        "Blocking is where story, character, camera, space, and rhythm meet in physical action.",
        [
            (
                "Blocking for intention",
                "Students connect actor movement to objectives, relationships, and scene turns.",
                [
                    "Entrances and exits",
                    "Status shifts",
                    "Proximity",
                    "Reveals",
                ],
            ),
            (
                "Staging for camera and stage",
                "The course compares cinematic framing with theatrical composition so students can direct across media.",
                [
                    "Sightlines",
                    "Depth",
                    "Axis of action",
                    "Planes of space",
                ],
            ),
            (
                "Continuity and geography",
                "Students learn to preserve clarity while using movement and coverage creatively.",
                [
                    "180-degree rule",
                    "Eyelines",
                    "Screen direction",
                    "Spatial transitions",
                ],
            ),
        ],
    ),
    (
        "Working with Actors, Casting, Rehearsal, and Performance Direction",
        "Effective directing requires playable communication with actors, not vague result-oriented notes.",
        [
            (
                "Casting and actor fit",
                "Students learn how casting shapes interpretation, chemistry, rhythm, and production feasibility.",
                [
                    "Auditions",
                    "Callbacks",
                    "Chemistry reads",
                    "Inclusive casting",
                ],
            ),
            (
                "Playable direction",
                "This subtopic replaces abstract notes with actions, circumstances, and adjustments actors can use.",
                [
                    "Action verbs",
                    "Given circumstances",
                    "Private adjustments",
                    "Listening and behavior",
                ],
            ),
            (
                "Rehearsal process",
                "Students structure rehearsal to discover choices, build trust, and prepare for efficient shooting or performance.",
                [
                    "Table work",
                    "Improvisation",
                    "Blocking rehearsal",
                    "Scene runs",
                ],
            ),
        ],
    ),
    (
        "Collaboration with Cinematography, Production Design, Costume, Sound, and Editing",
        "Directors do not make work alone; they translate vision into shared choices with every department.",
        [
            (
                "Director and cinematographer",
                "Students learn to align dramatic intent with camera, lighting, color, and movement.",
                [
                    "Lens tests",
                    "Lighting mood",
                    "Camera movement",
                    "Visual references",
                ],
            ),
            (
                "Design collaboration",
                "This subtopic covers how space, props, costume, makeup, and color shape story and character.",
                [
                    "Production design",
                    "Costume palette",
                    "Props as action",
                    "Period and world logic",
                ],
            ),
            (
                "Sound and editorial collaboration",
                "Students think about sound and editing before shooting so coverage supports the final experience.",
                [
                    "Sound motifs",
                    "Edit points",
                    "Room tone",
                    "Post conversations",
                ],
            ),
        ],
    ),
    (
        "Pre-Production, Scheduling, Budget Awareness, and Production Planning",
        "Creative freedom depends on preparation: directors need enough production literacy to make strong choices inside real constraints.",
        [
            (
                "Breakdowns and feasibility",
                "Students learn to read scripts for locations, cast, props, effects, time, risk, and cost.",
                [
                    "Scene breakdown",
                    "Location needs",
                    "Company moves",
                    "Special requirements",
                ],
            ),
            (
                "Scheduling and shot priorities",
                "This subtopic teaches directors to protect story priorities under time pressure.",
                [
                    "One-line schedule",
                    "Shot priority tiers",
                    "Company time",
                    "Contingency planning",
                ],
            ),
            (
                "Director's prep packet",
                "Students assemble the documents that make creative intent usable on set.",
                [
                    "Lookbook",
                    "Shot list",
                    "Rehearsal plan",
                    "Production notes",
                ],
            ),
        ],
    ),
    (
        "On-Set Leadership, Communication, Safety, and Problem-Solving",
        "The set tests a director's preparation, emotional regulation, communication, and ability to keep the work humane and focused.",
        [
            (
                "Set communication",
                "Students practice precise, respectful communication with assistant directors, actors, and department heads.",
                [
                    "Director-AD channel",
                    "Notes to actors",
                    "Crew briefings",
                    "Decision language",
                ],
            ),
            (
                "Safety and professional conduct",
                "The course treats safety as a creative condition, not an administrative afterthought.",
                [
                    "Intimacy and stunt protocols",
                    "Fatigue",
                    "Equipment awareness",
                    "Harassment prevention",
                ],
            ),
            (
                "Adaptive problem-solving",
                "Students learn to preserve the heart of the scene when weather, time, performance, or logistics change.",
                [
                    "Triage",
                    "Alternative coverage",
                    "Performance resets",
                    "Creative compromise",
                ],
            ),
        ],
    ),
    (
        "Coverage, Continuity, Scene Construction, and Shooting Strategy",
        "Coverage is not just quantity; it is the director's plan for how a scene will be built in the edit.",
        [
            (
                "Coverage logic",
                "Students design coverage around emotion, information, and rhythm instead of default setups.",
                [
                    "Masters",
                    "Singles",
                    "Inserts",
                    "Motivated close-ups",
                ],
            ),
            (
                "Continuity and script supervision",
                "This subtopic teaches directors to track action, props, eyelines, and emotional continuity.",
                [
                    "Continuity notes",
                    "Matching action",
                    "Prop tracking",
                    "Emotional temperature",
                ],
            ),
            (
                "Shooting for the edit",
                "Students learn to give the editor meaningful options without diluting intention.",
                [
                    "Transitions",
                    "Cut points",
                    "Overlaps",
                    "Alternate readings",
                ],
            ),
        ],
    ),
    (
        "Directing for Post-Production: Editing, Sound, Color, and Final Cut",
        "Directing continues after production as the film is rewritten through rhythm, juxtaposition, sound, color, and feedback.",
        [
            (
                "Director-editor relationship",
                "Students practice giving notes, watching cuts, and making structural decisions.",
                [
                    "Assembly cut",
                    "Rough cut",
                    "Notes process",
                    "Scene restructuring",
                ],
            ),
            (
                "Sound and music direction",
                "This subtopic shows how sound can guide attention, emotion, memory, and world-building.",
                [
                    "Dialogue edit",
                    "Atmospheres",
                    "Music spotting",
                    "Silence",
                ],
            ),
            (
                "Color, finishing, and delivery",
                "Students learn how finishing choices clarify tone and prepare the work for public viewing.",
                [
                    "Color correction",
                    "Titles",
                    "Mix review",
                    "Export deliverables",
                ],
            ),
        ],
    ),
    (
        "Stage Directing, Theatre Rehearsal, Audience, and Live Composition",
        "Theatre directing deepens the director's command of rehearsal, ensemble, space, live rhythm, and audience relationship.",
        [
            (
                "Stage composition",
                "Students study bodies in shared space over continuous time.",
                [
                    "Pictures on stage",
                    "Focus",
                    "Levels",
                    "Entrances and exits",
                ],
            ),
            (
                "Rehearsal room practice",
                "This subtopic builds a repeatable process for table work, staging, notes, and room culture.",
                [
                    "Read-through",
                    "Scene work",
                    "Run-throughs",
                    "Tech rehearsal",
                ],
            ),
            (
                "Design and live audience",
                "Students connect acting, design, pacing, and audience attention in live performance.",
                [
                    "Lighting cues",
                    "Sound cues",
                    "Audience sightlines",
                    "Pacing across acts",
                ],
            ),
        ],
    ),
    (
        "Directing Documentary, Nonfiction, Interviews, and Real People",
        "Directors also need nonfiction judgment: listening, ethics, structure, access, and responsiveness to reality.",
        [
            (
                "Documentary point of view",
                "Students identify the difference between topic, argument, character, and cinematic experience.",
                [
                    "Premise",
                    "Access",
                    "Character arc",
                    "Ethical frame",
                ],
            ),
            (
                "Interview direction",
                "This subtopic teaches how to prepare questions and direct attention without over-controlling the subject.",
                [
                    "Question design",
                    "Listening",
                    "Follow-ups",
                    "Silence and space",
                ],
            ),
            (
                "Ethics of real people",
                "Students examine consent, risk, editorial power, and responsibility to subjects.",
                [
                    "Informed consent",
                    "Vulnerability",
                    "Context collapse",
                    "Review and release",
                ],
            ),
        ],
    ),
    (
        "Critique, Revision, Inclusive Practice, and Artistic Growth",
        "Directors grow through making, watching, receiving feedback, revising, and learning how to keep a durable artistic practice.",
        [
            (
                "Critique methods",
                "Students learn to separate intention, execution, reception, and actionable revision.",
                [
                    "Descriptive feedback",
                    "Question-based critique",
                    "Director response",
                    "Revision priorities",
                ],
            ),
            (
                "Inclusion and access",
                "This subtopic supports directing practices that welcome diverse bodies, voices, schedules, and audiences.",
                [
                    "Accessible rehearsal",
                    "Anti-bias practice",
                    "Community agreements",
                    "Language access",
                ],
            ),
            (
                "Process documentation",
                "Students use reflective documentation to understand their own directing patterns.",
                [
                    "Director journal",
                    "Production postmortem",
                    "Clip analysis",
                    "Portfolio notes",
                ],
            ),
        ],
    ),
    (
        "Capstone Short, Festival Strategy, Portfolio, and Professional Pathways",
        "The course culminates in a directed scene or short film that demonstrates interpretation, collaboration, craft, and reflection.",
        [
            (
                "Capstone production",
                "Students synthesize script analysis, actors, visual design, set leadership, and post-production in one finished work.",
                [
                    "Director's packet",
                    "Casting",
                    "Production",
                    "Final cut",
                ],
            ),
            (
                "Public screening and critique",
                "The final project becomes a public communication event with feedback, context, and revision thinking.",
                [
                    "Screening notes",
                    "Artist statement",
                    "Q&A",
                    "Audience response",
                ],
            ),
            (
                "Professional pathways",
                "Students learn how emerging directors position their work for festivals, labs, crews, and future collaborations.",
                [
                    "Director reel",
                    "Festival submissions",
                    "Networking",
                    "Next project plan",
                ],
            ),
        ],
    ),
]

write_seed(
    "directing",
    "Directing",
    DESC,
    "b6c7d8e9-0f1a-4b41-8d01-1e2f3a4b5c41",
    "fdirjson",
    UNITS,
    "directing",
)
