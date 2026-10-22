"""Editing and Post-Production curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "Students learn that editing is not only technical assembly; it is the central language of time, "
    "attention, emotion, causality, and meaning in moving images."
)

UNITS = [
    (
        "Editing as Cinematic Language",
        "Students learn that editing is not only technical assembly; it is the central language of time, attention, emotion, causality, and meaning in moving images.",
        [
            (
                "The grammar of the cut",
                "This subtopic introduces the cut as a meaningful relation between shots, not just a way to remove unwanted footage.",
                [
                    "Shot, take, setup, sequence, scene, transition, and ellipsis",
                    "Cut on action, match cut, jump cut, smash cut, L-cut, J-cut, and dissolve",
                    "Screen direction, eyeline, point of view, emphasis, and narrative clarity",
                ],
            ),
            (
                "Time, duration, and attention",
                "Students learn how editors compress, expand, reorder, and guide time so viewers feel story rather than merely receive information.",
                [
                    "Real time, compressed time, expanded time, flashback, flashforward, and parallel action",
                    "Attention management, withholding, reveal, surprise, suspense, and expectation",
                    "Rhythmic density, visual contrast, and perceptual load",
                ],
            ),
            (
                "Meaning through relation",
                "This section shows how meaning often emerges between shots through juxtaposition, association, and audience inference.",
                [
                    "Kuleshov effect, montage theory, intellectual montage, and associative editing",
                    "Emotional, spatial, graphic, rhythmic, and thematic relationships",
                    "When clarity matters and when productive ambiguity matters",
                ],
            ),
        ],
    ),
    (
        "Story Analysis, Dailies, Coverage, and Editorial Judgment",
        "Students learn how editors read footage, diagnose story problems, evaluate performances, and form a plan before building a cut.",
        [
            (
                "Reading footage critically",
                "The goal is to see what the footage can actually do, not what the script or shoot plan hoped it would do.",
                [
                    "Dailies review, circle takes, continuity notes, script supervisor notes, and director comments",
                    "Performance, blocking, camera movement, focus, exposure, sound, and usability",
                    "Discovering story opportunities, missing beats, and unexpected strengths",
                ],
            ),
            (
                "Coverage and scene options",
                "Students learn to assess coverage as a set of storytelling possibilities and constraints.",
                [
                    "Masters, singles, over-the-shoulders, inserts, cutaways, reaction shots, and wild lines",
                    "Beat mapping, emotional turns, entrances, exits, and scene objectives",
                    "Using coverage to solve pacing, clarity, continuity, and performance problems",
                ],
            ),
            (
                "Editorial judgment",
                "This subtopic frames editing as a sequence of choices about story priority, audience experience, and collaboration.",
                [
                    "Intention, point of view, tone, stakes, character alignment, and audience empathy",
                    "Cutting for story over favorite shots, beautiful images, or technical perfection",
                    "Making defensible creative decisions and explaining them in critique",
                ],
            ),
        ],
    ),
    (
        "Nonlinear Editing Workflow and Assistant Editor Foundations",
        "Students build professional habits for ingesting, organizing, syncing, backing up, editing, and handing off media in modern NLE environments.",
        [
            (
                "Project setup and media management",
                "This subtopic teaches the invisible organization that keeps creative editing from becoming technical chaos.",
                [
                    "Folder structures, project settings, naming conventions, bins, markers, and metadata",
                    "Camera originals, proxies, transcoding, optimized media, relinking, and offline/online workflow",
                    "3-2-1 backup thinking, checksums, drive management, and version control",
                ],
            ),
            (
                "Sync, selects, and assistant workflows",
                "Students learn the assistant editor practices that make an edit room fast, reliable, and collaborative.",
                [
                    "Audio sync, multicam sync, slates, timecode, waveform sync, and grouped clips",
                    "Selects reels, stringouts, scene bins, script sync, markers, and annotations",
                    "Turnover prep, EDL/XML/AAF/OMF basics, project sharing, and handoff etiquette",
                ],
            ),
            (
                "Professional NLE fluency",
                "The course treats software as a craft environment: students should understand concepts that transfer across Premiere, Resolve, Avid, and Final Cut.",
                [
                    "Timelines, tracks, nesting, multicam, source/record editing, trimming, and keyboard shortcuts",
                    "Effects pipelines, adjustment layers, speed changes, stabilization, and basic compositing",
                    "Export settings, render management, project cleanup, and troubleshooting",
                ],
            ),
        ],
    ),
    (
        "Continuity Editing, Spatial Clarity, and Performance Construction",
        "Students learn classical continuity as a powerful system for clarity, then learn how and when to bend it.",
        [
            (
                "Classical continuity systems",
                "This subtopic teaches the conventions that help viewers understand space, action, and character intention without confusion.",
                [
                    "180-degree rule, 30-degree rule, shot/reverse shot, eyeline match, and matching action",
                    "Establishing geography, entrances and exits, eye traces, and screen direction",
                    "Cutaways, inserts, reaction shots, and continuity repair",
                ],
            ),
            (
                "Performance shaping",
                "Students learn that editors often build performances from many takes, pauses, reactions, and rhythms.",
                [
                    "Choosing takes for intention, listening, subtext, vulnerability, and energy",
                    "Combining dialogue, pauses, reactions, overlaps, and breath",
                    "Respecting actors while shaping the emotional truth of the scene",
                ],
            ),
            (
                "Breaking continuity with purpose",
                "This section helps students distinguish expressive discontinuity from accidental confusion.",
                [
                    "Jump cuts, temporal fragmentation, subjective editing, and spatial disorientation",
                    "Experimental, comedic, horror, action, documentary, and music-video uses",
                    "Audience contract, genre expectation, and intentional rule breaking",
                ],
            ),
        ],
    ),
    (
        "Rhythm, Pacing, Scene Shape, and Emotional Momentum",
        "Students develop the editor's ear for timing: when to cut, when to hold, when to breathe, and when to accelerate.",
        [
            (
                "Pacing and scene architecture",
                "This subtopic teaches students to shape scenes around beats, turns, escalation, and release.",
                [
                    "Opening beat, inciting pressure, reversals, reveals, climax, and button",
                    "Scene length, silence, pauses, overlaps, and visual breathing room",
                    "Cutting entrances, exits, repetition, dead air, and redundant information",
                ],
            ),
            (
                "Rhythm across image and sound",
                "Students learn that rhythm is built from picture, performance, sound, music, camera movement, and audience expectation.",
                [
                    "Internal rhythm, external rhythm, musical rhythm, visual rhythm, and dialogue rhythm",
                    "Action cutting, comedy timing, horror timing, trailer pacing, and contemplative pacing",
                    "Using sound bridges, reactions, and offscreen space to control rhythm",
                ],
            ),
            (
                "Emotional momentum",
                "This section focuses on how edits create emotional direction rather than merely accelerate or shorten footage.",
                [
                    "Empathy, tension, release, dread, surprise, curiosity, and catharsis",
                    "Point of view, identification, withheld information, and audience alignment",
                    "When a slower cut is stronger than a faster cut",
                ],
            ),
        ],
    ),
    (
        "Montage, Juxtaposition, Time Compression, and Experimental Structure",
        "Students study montage as a way to build ideas, memory, emotion, argument, and non-linear forms through collision and association.",
        [
            (
                "Montage traditions",
                "This subtopic connects practical montage editing to major film traditions and theories.",
                [
                    "Soviet montage, intellectual montage, metric montage, rhythmic montage, and tonal montage",
                    "Training montage, memory montage, essay film, music video, and advertising montage",
                    "Associative logic, graphic match, contrast, repetition, and motif",
                ],
            ),
            (
                "Temporal construction",
                "Students learn to build story time from fragments, ellipses, repetitions, and parallel structures.",
                [
                    "Compression, expansion, ellipsis, parallel editing, cross-cutting, and recurring timelines",
                    "Flashbacks, subjective memory, dream logic, and unreliable chronology",
                    "Using time jumps without losing viewer orientation",
                ],
            ),
            (
                "Experimental and time-based media",
                "This section draws from MFA moving-image practice to expand editing beyond conventional narrative screen work.",
                [
                    "Duration, loops, installation contexts, projection, monitors, and gallery presentation",
                    "Non-narrative structure, abstraction, performance, documentation, and video art",
                    "Sound-image relationships, audience movement, and screening context",
                ],
            ),
        ],
    ),
    (
        "Documentary, Unscripted, Archival, and Ethical Editing",
        "Students learn how nonfiction editors construct story while honoring consent, context, truthfulness, participants, and archival responsibility.",
        [
            (
                "Documentary structure",
                "This subtopic teaches how documentary story is found and built from interviews, verite, archives, and unfolding reality.",
                [
                    "Character arcs, themes, sequences, act structure, cards, narration, and interview paper cuts",
                    "Verite scenes, observational footage, archival evidence, and found footage",
                    "Balancing exposition, discovery, emotion, argument, and ambiguity",
                ],
            ),
            (
                "Interview and participant ethics",
                "Students learn the ethical weight of editing real people, trauma, memory, and testimony.",
                [
                    "Consent, informed participation, trauma-aware editing, and participant accountability",
                    "Context collapse, misleading juxtaposition, Frankenbites, and selective emphasis",
                    "Duty of care, fair representation, review practices, and impact goals",
                ],
            ),
            (
                "Archival and fair-use workflows",
                "This section grounds archival editing in research, provenance, rights, and visual storytelling.",
                [
                    "Archival logs, source tracking, rights status, releases, citations, and licensing",
                    "Stills, scans, news footage, home movies, social video, and found media",
                    "Fair use reasoning, transformation, risk review, and deliverables documentation",
                ],
            ),
        ],
    ),
    (
        "Sound Editing, Foley, Music, and Mix Preparation",
        "Students learn how post sound shapes space, emotion, point of view, continuity, and professional polish.",
        [
            (
                "Dialogue editing and cleanup",
                "This subtopic teaches the foundation of intelligible, emotionally coherent post audio.",
                [
                    "Dialogue selects, room tone, ambience matching, noise reduction, de-clicking, and de-plosive work",
                    "ADR basics, wild lines, sync, overlaps, and dialogue continuity",
                    "Track organization, naming, handles, and mix handoff",
                ],
            ),
            (
                "Foley, effects, ambience, and sound design",
                "Students use sound to make image worlds feel physical, subjective, and alive.",
                [
                    "Foley performance, footsteps, cloth, props, hard effects, and designed effects",
                    "Ambience, backgrounds, offscreen space, transitions, impacts, and sonic motifs",
                    "Library workflow, recording, editing, layering, and sound perspective",
                ],
            ),
            (
                "Music and mix preparation",
                "This subtopic helps students make music choices and prepare clean sessions for the final mix.",
                [
                    "Temp music, spotting, cue points, licensing, stems, and composer communication",
                    "Levels, panning, EQ basics, compression basics, and loudness awareness",
                    "Stems, M&E, deliverable splits, and communication with sound mixers",
                ],
            ),
        ],
    ),
    (
        "Color Correction, Color Grading, and Image Finishing",
        "Students learn the difference between technical correction and expressive grading, while building an image pipeline that survives handoff.",
        [
            (
                "Color correction fundamentals",
                "This subtopic teaches students to make shots match and read correctly before stylizing them.",
                [
                    "Exposure, contrast, white balance, saturation, skin tone, scopes, and shot matching",
                    "Log, RAW, LUTs, color management, gamma, gamut, and display transforms",
                    "Primary corrections, secondaries, masks, tracking, and noise reduction basics",
                ],
            ),
            (
                "Creative grading",
                "Students learn how color supports genre, emotion, period, point of view, and visual consistency.",
                [
                    "Look development, palettes, contrast curves, highlight rolloff, color separation, and texture",
                    "Mood, continuity, memory, subjectivity, realism, stylization, and restraint",
                    "Director/cinematographer collaboration and grading references",
                ],
            ),
            (
                "Finishing pipeline",
                "This section connects color to conform, online edit, final exports, and quality control.",
                [
                    "Conform from XML/AAF/EDL, relinking camera originals, handles, and timeline prep",
                    "Titles, graphics, VFX shots, stabilization, reframing, and final picture polish",
                    "QC for flash frames, bad frames, dead pixels, illegal levels, and format errors",
                ],
            ),
        ],
    ),
    (
        "Titles, Motion Graphics, VFX Handoffs, and Compositing",
        "Students learn how graphics and effects support story, identity, information, accessibility, and professional finishing.",
        [
            (
                "Titles and information design",
                "This subtopic treats titles as part of storytelling, hierarchy, and viewer orientation.",
                [
                    "Main titles, lower thirds, end credits, intertitles, captions, cards, and subtitles",
                    "Typography, legibility, safe areas, motion, timing, hierarchy, and brand identity",
                    "Credit order, legal names, music credits, and festival/online norms",
                ],
            ),
            (
                "Motion graphics and basic compositing",
                "Students learn the practical bridge between editing and motion/VFX work.",
                [
                    "Keyframes, masks, tracking, mattes, rotoscoping concepts, green screen, and cleanup",
                    "After Effects, Fusion, dynamic links, rendered graphics, and round-trip workflows",
                    "When to solve in the NLE and when to hand off to motion/VFX",
                ],
            ),
            (
                "VFX turnover and review",
                "This section explains how editors communicate clearly with artists and producers during visual-effects work.",
                [
                    "Temp comps, plates, handles, reference exports, shot IDs, frame ranges, and naming",
                    "VFX pulls, pull lists, annotations, review links, notes, and approvals",
                    "Versioning, shot status, final inserts, and conform checks",
                ],
            ),
        ],
    ),
    (
        "Collaboration, Review, Versioning, and Post Supervision",
        "Students learn how professional post-production runs as a collaborative process involving editors, directors, producers, sound, color, VFX, and clients.",
        [
            (
                "Editorial collaboration",
                "This subtopic teaches students to receive notes without losing the project's core intention.",
                [
                    "Director's cut, producer notes, client notes, peer critique, and test screening feedback",
                    "Notes triage, creative diplomacy, problem diagnosis, and alternative versions",
                    "Communicating editorial rationale with clarity and humility",
                ],
            ),
            (
                "Versioning and review systems",
                "Students learn why disciplined versioning protects both creativity and deadlines.",
                [
                    "Version naming, date stamps, cut numbers, exports, review links, and change logs",
                    "Frame.io-style review, timecoded comments, compare versions, and approvals",
                    "Avoiding overwritten timelines, lost media, and unclear handoffs",
                ],
            ),
            (
                "Post schedules and supervision",
                "This section builds professional awareness of the whole post calendar and its dependencies.",
                [
                    "Assembly, rough cut, fine cut, lock, turnover, color, mix, VFX, QC, and delivery milestones",
                    "Roles: editor, assistant editor, post producer, colorist, sound editor, mixer, online editor, VFX supervisor",
                    "Budget, scope, deadlines, revisions, festival needs, and client deliverables",
                ],
            ),
        ],
    ),
    (
        "Finishing, Delivery, Accessibility, Distribution, and Archiving",
        "Students learn how to transform a creative cut into technically correct deliverables for screenings, web, festivals, clients, and archives.",
        [
            (
                "Export, codecs, and deliverables",
                "This subtopic introduces delivery as a professional craft with real consequences for playback, quality, and acceptance.",
                [
                    "Containers, codecs, bitrates, frame rates, resolution, aspect ratio, color space, and audio specs",
                    "H.264/H.265, ProRes, DNxHR/DNxHD, WAV, DCP basics, and social-platform exports",
                    "Masters, screeners, review copies, textless versions, stems, and project archives",
                ],
            ),
            (
                "Accessibility and localization",
                "Students learn that professional media delivery includes viewers who need captions, subtitles, audio description, and language access.",
                [
                    "Closed captions, open captions, subtitles, SDH, transcripts, and audio description",
                    "Caption timing, reading speed, speaker IDs, sound cues, and quality checks",
                    "Localization workflow, burned-in text, textless masters, and translation review",
                ],
            ),
            (
                "Quality control and archiving",
                "This section teaches students to check and preserve their work like professionals.",
                [
                    "QC watchdown, flash frames, sync, audio peaks, clipping, title errors, and missing shots",
                    "Metadata, release forms, cue sheets, rights documents, project files, and media maps",
                    "Long-term storage, drive labels, cloud backups, migration, and portfolio exports",
                ],
            ),
        ],
    ),
    (
        "Complete Project Capstone: Rough Cut to Locked Picture",
        "Students synthesize story, workflow, sound, color, graphics, collaboration, and delivery into a polished short project.",
        [
            (
                "Assembly, rough cut, and fine cut",
                "The capstone follows a real post sequence so students experience editing as iterative problem solving.",
                [
                    "Assembly cut, rough cut, fine cut, picture lock, and final polish",
                    "Cut goals, edit decision list, revision priorities, and faculty/peer notes",
                    "Maintaining continuity between creative intent and technical workflow",
                ],
            ),
            (
                "Integrated post package",
                "Students combine the specialized skills of the course into one coherent professional package.",
                [
                    "Sound edit, temp mix or final mix, color correction, grade, titles, credits, and graphics",
                    "Final exports, captions or subtitles, QC checklist, poster frame, and thumbnail",
                    "Archive folder, media map, project file, release/rights notes, and deliverables log",
                ],
            ),
            (
                "Critique, reflection, and portfolio presentation",
                "This subtopic turns the final project into evidence of craft growth and professional readiness.",
                [
                    "Screening critique, audience response, director/editor statement, and revision reflection",
                    "Before/after examples, scene breakdowns, workflow screenshots, and portfolio excerpts",
                    "Lessons learned, collaboration notes, and next-step goals",
                ],
            ),
        ],
    ),
]


if __name__ == "__main__":
    write_seed(
        "editing-and-post-production",
        "Editing and Post-Production",
        DESC,
        "e9f0a1b2-3c4d-4e44-9a34-4b5c6d7e8f44",
        "edpojson",
        UNITS,
        "editing_and_post_production",
    )
