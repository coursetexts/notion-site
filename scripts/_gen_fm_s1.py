"""Screenwriting I curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "This opening unit frames a screenplay as both a literary artifact and a production plan: "
    "a document designed to be read quickly, imagined visually, and made collaboratively."
)

UNITS = [
    (
        "Screenwriting as Visual Storytelling and Blueprint",
        "This opening unit frames a screenplay as both a literary artifact and a production plan: a document designed to be read quickly, imagined visually, and made collaboratively.",
        [
            (
                "The screenplay as a production document",
                "Students learn why screenplay pages must communicate story, image, sound, pacing, and production intent without directing every department from the page.",
                [
                    "master scene format",
                    "slug line / scene heading",
                    "action line economy",
                    "screen time versus page count",
                    "reader clarity",
                    "production readability",
                ],
            ),
            (
                "Showing rather than explaining",
                "This subtopic trains writers to externalize inner life through behavior, objects, setting, and choice instead of relying on abstract exposition.",
                [
                    "visual action",
                    "behavioral evidence",
                    "image systems",
                    "props as story information",
                    "gesture and blocking",
                    "cinematic verbs",
                ],
            ),
            (
                "Writing for the reader and the viewer",
                "Students practice making pages move with enough detail for a professional reader and enough restraint for directors, actors, and designers to collaborate.",
                [
                    "white space",
                    "paragraph rhythm",
                    "lean description",
                    "camera avoidance",
                    "tone on the page",
                    "readability under time pressure",
                ],
            ),
        ],
    ),
    (
        "Story Concept, Premise, and Logline",
        "A strong script begins with a focused dramatic idea. This unit develops the tools for testing whether an idea has conflict, stakes, audience promise, and enough pressure to sustain a film.",
        [
            (
                "Premise and dramatic engine",
                "Students learn to distinguish a topic from a story by identifying the force that keeps events moving and choices escalating.",
                [
                    "inciting situation",
                    "dramatic engine",
                    "story arena",
                    "central contradiction",
                    "narrative pressure",
                    "story promise",
                ],
            ),
            (
                "Logline construction",
                "This subtopic teaches the compact sentence that clarifies protagonist, goal, obstacle, stakes, and hook for workshop and industry contexts.",
                [
                    "protagonist descriptor",
                    "goal phrase",
                    "antagonistic force",
                    "stakes clause",
                    "irony / hook",
                    "genre signal",
                ],
            ),
            (
                "Testing and refining ideas",
                "Students use quick diagnostics to find weak premises early and reshape them before drafting full scenes.",
                [
                    "what-if question",
                    "conflict test",
                    "stakes test",
                    "freshness test",
                    "audience question",
                    "scope test for shorts",
                ],
            ),
        ],
    ),
    (
        "Character, Desire, Need, and Stakes",
        "This unit builds characters who generate story through pursuit, contradiction, and change. Students connect external goals to internal needs without turning characters into abstractions.",
        [
            (
                "Want, need, flaw, and wound",
                "Students learn how visible goals and hidden needs create tension between what a character pursues and what the story ultimately confronts.",
                [
                    "external want",
                    "internal need",
                    "character flaw",
                    "backstory wound",
                    "misbelief",
                    "self-revelation",
                ],
            ),
            (
                "Character function and relationship design",
                "This subtopic maps how allies, antagonists, mentors, foils, and love interests pressure the protagonist from different angles.",
                [
                    "foil",
                    "mirror character",
                    "mentor",
                    "threshold guardian",
                    "relationship arc",
                    "ensemble balance",
                ],
            ),
            (
                "Stakes and consequences",
                "Students learn to make choices matter by clarifying what can be lost, changed, exposed, or saved in every major turn.",
                [
                    "personal stakes",
                    "public stakes",
                    "moral stakes",
                    "emotional jeopardy",
                    "deadline pressure",
                    "irreversibility",
                ],
            ),
        ],
    ),
    (
        "Conflict, Obstacles, and Dramatic Escalation",
        "Screen stories advance through resistance. This unit studies how obstacles, opposition, complications, and reversals transform a premise into a sequence of meaningful decisions.",
        [
            (
                "Types of conflict",
                "Students identify how internal, interpersonal, institutional, environmental, and moral conflict can operate together within the same scene or plotline.",
                [
                    "person versus self",
                    "person versus person",
                    "person versus system",
                    "person versus environment",
                    "moral dilemma",
                    "conflict layering",
                ],
            ),
            (
                "Obstacles and tactics",
                "This subtopic helps writers avoid passive protagonists by giving characters active tactics that shift when obstacles push back.",
                [
                    "tactic",
                    "counter-tactic",
                    "blocking force",
                    "plan failure",
                    "adaptation",
                    "scene objective",
                ],
            ),
            (
                "Escalation and reversals",
                "Students learn to increase pressure across scenes through surprise, cost, revelation, and the closing off of easy exits.",
                [
                    "reversal",
                    "complication",
                    "raising stakes",
                    "point of no return",
                    "turning point",
                    "progressive difficulty",
                ],
            ),
        ],
    ),
    (
        "Scene Construction and Beats",
        "The scene is the basic dramatic unit of screenwriting. This unit teaches students to build scenes around intention, opposition, turn, and aftermath rather than simple information delivery.",
        [
            (
                "Scene objective and conflict",
                "Students learn to enter a scene knowing what each key character wants, why now, and what makes the exchange unstable.",
                [
                    "scene want",
                    "opposition",
                    "urgency",
                    "entrance value",
                    "exit value",
                    "dramatic question",
                ],
            ),
            (
                "Beat-by-beat movement",
                "This subtopic trains students to break scenes into turns so dialogue and action change direction instead of circling the same point.",
                [
                    "beat",
                    "turn",
                    "status shift",
                    "discovery",
                    "decision point",
                    "button",
                ],
            ),
            (
                "Scene openings and endings",
                "Students practice entering late, leaving early, and choosing final images or lines that propel the next scene.",
                [
                    "late entry",
                    "early exit",
                    "scene hook",
                    "cliffhanger",
                    "image button",
                    "transition logic",
                ],
            ),
        ],
    ),
    (
        "Structure: Acts, Sequences, and Turning Points",
        "Structure is not a formula but a way of organizing pressure, expectation, and change. Students compare act structure with sequence thinking and short-film architecture.",
        [
            (
                "Three-act architecture",
                "Students study setup, confrontation, and resolution as flexible containers for dramatic change and audience orientation.",
                [
                    "Act I setup",
                    "Act II complication",
                    "Act III resolution",
                    "inciting incident",
                    "midpoint",
                    "climax",
                ],
            ),
            (
                "Sequence and beat-sheet models",
                "This subtopic compares practical outline systems so writers can choose tools that diagnose story movement rather than mechanically fill slots.",
                [
                    "eight-sequence model",
                    "Save the Cat beats",
                    "plot point",
                    "pinch point",
                    "false victory",
                    "all is lost",
                ],
            ),
            (
                "Short-film structure",
                "Students adapt structural principles to compressed stories where one decisive situation often carries the full arc.",
                [
                    "single situation",
                    "compressed arc",
                    "minimal exposition",
                    "turnaround ending",
                    "visual payoff",
                    "festival short length",
                ],
            ),
        ],
    ),
    (
        "Genre, Tone, and Audience Expectations",
        "Genre gives writers a contract with the audience. This unit examines convention, variation, tonal control, and how genre expectations can guide or mislead viewers.",
        [
            (
                "Genre conventions and promises",
                "Students identify recurring situations, images, character roles, and emotional payoffs that shape audience expectation.",
                [
                    "genre promise",
                    "iconography",
                    "set piece",
                    "convention",
                    "trope",
                    "obligatory scene",
                ],
            ),
            (
                "Tone and tonal consistency",
                "This subtopic explores how page language, character behavior, pacing, stakes, and endings create the emotional temperature of a script.",
                [
                    "comic tone",
                    "dramatic tone",
                    "irony",
                    "dread",
                    "sentimentality",
                    "tonal rupture",
                ],
            ),
            (
                "Subverting expectations",
                "Students learn to revise inherited formulas by changing point of view, outcome, stakes, or character position without losing clarity.",
                [
                    "genre inversion",
                    "hybrid genre",
                    "anti-trope",
                    "audience misdirection",
                    "fresh angle",
                    "ethical subversion",
                ],
            ),
        ],
    ),
    (
        "World, Setting, and Visual Specificity",
        "Settings are active story tools, not neutral backdrops. This unit shows how place, era, objects, and social rules can reveal character and create constraints.",
        [
            (
                "World rules and story arena",
                "Students define the practical, social, and emotional rules that make a script's world feel specific and usable.",
                [
                    "story world",
                    "arena",
                    "rules of the world",
                    "social hierarchy",
                    "institutional pressure",
                    "environmental constraint",
                ],
            ),
            (
                "Location as drama",
                "This subtopic teaches writers to choose spaces that sharpen conflict, block easy exits, and make character choices visible.",
                [
                    "location pressure",
                    "blocking potential",
                    "public versus private space",
                    "threshold",
                    "revealing object",
                    "spatial irony",
                ],
            ),
            (
                "Visual motifs and image systems",
                "Students learn to use repeated images, colors, objects, and contrasts to support theme without explaining it directly.",
                [
                    "motif",
                    "visual metaphor",
                    "recurring object",
                    "contrast image",
                    "setup and payoff",
                    "symbolic restraint",
                ],
            ),
        ],
    ),
    (
        "Dialogue, Subtext, and Voice",
        "Dialogue should sound alive while doing dramatic work. This unit develops spoken language that reveals desire, conceals truth, creates rhythm, and distinguishes characters.",
        [
            (
                "Dialogue as action",
                "Students treat lines as tactics characters use to get something, protect something, or change the terms of an exchange.",
                [
                    "verbal tactic",
                    "objective-driven line",
                    "deflection",
                    "threat",
                    "seduction",
                    "negotiation",
                ],
            ),
            (
                "Subtext and silence",
                "This subtopic focuses on what characters do not say and how omissions, pauses, contradictions, and behavior carry emotional information.",
                [
                    "subtext",
                    "ellipsis",
                    "loaded silence",
                    "misdirection",
                    "double meaning",
                    "unsaid truth",
                ],
            ),
            (
                "Character voice and rhythm",
                "Students learn to distinguish voices through diction, syntax, pace, worldview, and relationship context instead of surface quirks.",
                [
                    "diction",
                    "syntax",
                    "idiosyncrasy",
                    "status language",
                    "rhythmic contrast",
                    "voice consistency",
                ],
            ),
        ],
    ),
    (
        "Theme, Point of View, and Meaning",
        "This unit helps students connect story choices to larger questions without reducing scripts to messages. Theme emerges through conflict, consequence, pattern, and point of view.",
        [
            (
                "Thematic question",
                "Students frame theme as a living dramatic question that scenes test from multiple angles.",
                [
                    "thematic premise",
                    "central question",
                    "moral argument",
                    "counterargument",
                    "choice under pressure",
                    "dramatic proof",
                ],
            ),
            (
                "Point of view and alignment",
                "This subtopic examines how access to information, empathy, camera imagination, and scene selection position the audience.",
                [
                    "protagonist alignment",
                    "restricted knowledge",
                    "dramatic irony",
                    "subjective scene",
                    "empathy strategy",
                    "audience complicity",
                ],
            ),
            (
                "Meaning through pattern",
                "Students learn to revise repeated images, situations, and choices so the script accumulates meaning across its structure.",
                [
                    "recurrence",
                    "variation",
                    "echo scene",
                    "setup and payoff",
                    "parallel action",
                    "final image",
                ],
            ),
        ],
    ),
    (
        "Screenplay Format and Page Craft",
        "Professional format is a reader courtesy and an industry standard. This unit covers technical screenplay conventions and the craft choices that make pages clean, quick, and filmable.",
        [
            (
                "Core format elements",
                "Students practice the fundamental building blocks of screenplay pages and learn when each convention is appropriate.",
                [
                    "scene heading",
                    "action line",
                    "character cue",
                    "parenthetical",
                    "dialogue block",
                    "transition",
                ],
            ),
            (
                "Formatting special cases",
                "This subtopic handles common technical situations that can confuse early drafts if not managed simply.",
                [
                    "intercut",
                    "montage",
                    "series of shots",
                    "voice-over",
                    "off-screen dialogue",
                    "text on screen",
                ],
            ),
            (
                "Page-level polish",
                "Students learn to diagnose overwritten pages, unclear geography, excessive camera directions, and rhythm problems before workshop.",
                [
                    "widows and orphans",
                    "dense action blocks",
                    "active verbs",
                    "line breaks",
                    "page turns",
                    "proofreading standards",
                ],
            ),
        ],
    ),
    (
        "Outlines, Beat Sheets, Treatments, and Pitches",
        "Writers need intermediate documents that test story logic before drafting. This unit gives students practical tools for planning, presenting, and revising an idea.",
        [
            (
                "Beat sheets and scene lists",
                "Students learn to map story movement in compact form so they can see cause, effect, escalation, and missing turns.",
                [
                    "beat sheet",
                    "scene list",
                    "A-story",
                    "B-story",
                    "sequence goal",
                    "turn map",
                ],
            ),
            (
                "Synopsis and treatment writing",
                "This subtopic converts a story into prose summaries of different lengths for workshop, development, and pitching.",
                [
                    "one-paragraph synopsis",
                    "one-page synopsis",
                    "treatment",
                    "present tense prose",
                    "act summary",
                    "emotional spine",
                ],
            ),
            (
                "Pitching the short script",
                "Students practice verbal and written pitches that communicate premise, character, tone, and production feasibility.",
                [
                    "elevator pitch",
                    "comparables",
                    "look and feel",
                    "why now",
                    "target audience",
                    "production scope",
                ],
            ),
        ],
    ),
    (
        "Workshop, Coverage, and Revision Practice",
        "Revision is the core professional habit of screenwriting. This unit teaches students how to give useful notes, receive critique, diagnose drafts, and make intentional changes.",
        [
            (
                "Workshop protocols",
                "Students learn a shared vocabulary for discussing scripts generously, specifically, and rigorously.",
                [
                    "table read",
                    "clarifying question",
                    "reader response",
                    "note hierarchy",
                    "writer listening",
                    "critique etiquette",
                ],
            ),
            (
                "Script coverage and diagnostics",
                "This subtopic introduces professional-style evaluation categories that help students see how readers assess story and craft.",
                [
                    "logline in coverage",
                    "synopsis in coverage",
                    "comments",
                    "consider / pass",
                    "character notes",
                    "structure notes",
                ],
            ),
            (
                "Revision strategies",
                "Students practice moving from notes to action by prioritizing problems and choosing the right scale of rewrite.",
                [
                    "revision plan",
                    "page-one rewrite",
                    "scene rewrite",
                    "dialogue pass",
                    "format pass",
                    "polish pass",
                ],
            ),
        ],
    ),
    (
        "Short Film Screenplay Workshop",
        "The course culminates in a complete short screenplay. Students apply concept, structure, character, scene craft, format, and revision to a script that can plausibly be produced.",
        [
            (
                "Developing a producible short",
                "Students learn to shape ideas around achievable scope while preserving emotional and cinematic ambition.",
                [
                    "limited locations",
                    "small cast",
                    "clear conflict",
                    "visual premise",
                    "short runtime",
                    "production constraint",
                ],
            ),
            (
                "Drafting and table reading",
                "This subtopic moves students from outline to script pages, using performed reading to detect rhythm, confusion, and weak turns.",
                [
                    "first draft",
                    "cold read",
                    "dialogue rhythm",
                    "scene length",
                    "actor readability",
                    "reader confusion",
                ],
            ),
            (
                "Final portfolio polish",
                "Students revise toward a clean submission-ready script package with title page, logline, synopsis, and reflective notes.",
                [
                    "title page",
                    "final draft",
                    "submission formatting",
                    "revision memo",
                    "proofread",
                    "portfolio readiness",
                ],
            ),
        ],
    ),
    (
        "Ethics, Representation, and Authorship",
        "Screenwriting instruction treats representation and authorship as craft questions as well as ethical ones. This unit helps students write with specificity, accountability, and imaginative range.",
        [
            (
                "Writing across difference",
                "Students consider research, humility, collaboration, and limits when writing characters and communities outside their own experience.",
                [
                    "specificity",
                    "stereotype audit",
                    "cultural context",
                    "consultation",
                    "appropriation risk",
                    "character interiority",
                ],
            ),
            (
                "Power, harm, and audience impact",
                "This subtopic examines how scripts can reproduce or challenge harmful patterns through genre, point of view, humor, and consequence.",
                [
                    "framing",
                    "normalization",
                    "punching down",
                    "trauma representation",
                    "violence on page",
                    "consequence",
                ],
            ),
            (
                "Authorship and professional conduct",
                "Students learn basic norms of creative ownership, collaboration, feedback, and respectful workshop participation.",
                [
                    "copyright basics",
                    "collaboration agreement",
                    "credit",
                    "plagiarism",
                    "note boundaries",
                    "professional email",
                ],
            ),
        ],
    ),
]

write_seed(
    "screenwriting-i",
    "Screenwriting I",
    DESC,
    "a7b8c9d0-1e2f-4a52-9c12-2d3e4f5a6b52",
    "scw1json",
    UNITS,
    "screenwriting_i",
)
