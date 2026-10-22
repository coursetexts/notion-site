"""Introduction to Media Production curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "Understand how ideas move through development, pre-production, production, "
    "post-production, delivery, and critique."
)

UNITS = [
    (
        "Media Production Foundations, Roles, and Workflow",
        "Understand how ideas move through development, pre-production, production, post-production, delivery, and critique.",
        [
            (
                "The production lifecycle",
                "This subtopic gives students the map of how media projects move from first idea to finished deliverable.",
                [
                    "Development, pre-production, production, post-production, delivery, and archiving",
                    "How decisions made early affect cost, schedule, image, sound, and editability",
                    "Iteration, review, and revision as normal parts of professional production",
                ],
            ),
            (
                "Creative and technical roles",
                "Students learn who does what on a small crew so collaboration becomes orderly rather than improvised.",
                [
                    "Producer, director, cinematographer, sound recordist, editor, production designer, and assistant roles",
                    "Chain of communication, decision rights, and set etiquette",
                    "How responsibilities scale from solo creator to larger crew",
                ],
            ),
            (
                "Production literacy",
                "The goal is to make students conversant in the basic vocabulary, tools, and standards of media-making.",
                [
                    "Shot, scene, sequence, take, coverage, slate, call sheet, dailies, rough cut, fine cut, and final export",
                    "File formats, codecs, frame rates, aspect ratios, and project settings",
                    "Professional habits: labeling, backups, shared folders, and version control",
                ],
            ),
        ],
    ),
    (
        "Visual Storytelling, Shot Grammar, and Composition",
        "Learn how framing, shot choice, movement, and visual continuity communicate story, tone, and meaning.",
        [
            (
                "Shot types and visual grammar",
                "Shot grammar helps students understand how image choices guide attention, emotion, and story comprehension.",
                [
                    "Extreme wide, wide, medium, close-up, insert, cutaway, over-the-shoulder, and point-of-view shots",
                    "Establishing shots, reactions, eyeline matches, and screen direction",
                    "Continuity, axis of action, and the 180-degree rule",
                ],
            ),
            (
                "Composition and frame design",
                "Composition turns a camera image into a deliberate arrangement of meaning and emphasis.",
                [
                    "Rule of thirds, balance, symmetry, negative space, depth, foreground, middle ground, and background",
                    "Headroom, lead room, frame edges, blocking, and movement through the frame",
                    "Color, shape, texture, line, contrast, and visual hierarchy",
                ],
            ),
            (
                "Storyboards, shot lists, and visual plans",
                "Planning visual coverage before the shoot helps students make creative choices under time pressure.",
                [
                    "Storyboards, overhead diagrams, shot lists, mood boards, and look references",
                    "Coverage strategy for action, dialogue, interviews, demonstrations, and B-roll",
                    "Matching visual ambition to available time, crew, locations, and equipment",
                ],
            ),
        ],
    ),
    (
        "Camera Operation, Exposure, Lenses, and Image Control",
        "Build practical camera literacy so technical settings become deliberate storytelling choices.",
        [
            (
                "Camera fundamentals",
                "Students learn the camera as a controllable image-making system rather than a point-and-record device.",
                [
                    "Camera bodies, sensors, menus, media cards, batteries, tripods, stabilizers, and monitors",
                    "Resolution, frame rate, shutter speed, ISO, white balance, and picture profiles",
                    "Focus, zoom, stabilization, handheld work, and basic camera movement",
                ],
            ),
            (
                "Exposure and image quality",
                "Exposure literacy lets students create usable images and understand tradeoffs among brightness, motion, noise, and depth of field.",
                [
                    "Aperture, shutter, ISO, neutral density, zebras, histograms, false color, and waveform basics",
                    "Dynamic range, highlights, shadows, noise, clipping, and underexposure",
                    "Natural light, mixed light, available light, and practical exposure decisions",
                ],
            ),
            (
                "Lenses and perspective",
                "Lens choice shapes how space, faces, motion, and emotional distance feel on screen.",
                [
                    "Focal length, field of view, lens compression, distortion, minimum focus, and depth of field",
                    "Prime versus zoom lenses, macro, wide, normal, telephoto, and specialty lenses",
                    "Matching lens decisions to subject, genre, location, and blocking",
                ],
            ),
        ],
    ),
    (
        "Lighting Fundamentals and Visual Mood",
        "Use light direction, quality, contrast, color, and safety to shape visibility, emotion, and space.",
        [
            (
                "Qualities of light",
                "Students learn to see light before they try to control it.",
                [
                    "Hard and soft light, direction, intensity, falloff, contrast, color temperature, and motivation",
                    "Key, fill, backlight, practicals, bounce, diffusion, negative fill, and flags",
                    "Naturalistic, expressive, documentary, interview, and low-budget lighting styles",
                ],
            ),
            (
                "Basic lighting setups",
                "Lighting setups give students repeatable approaches for interviews, scenes, products, and documentary situations.",
                [
                    "Three-point lighting, window-light setups, motivated practicals, and available-light control",
                    "Lighting faces, backgrounds, depth, texture, and movement",
                    "Matching lighting across angles and maintaining continuity",
                ],
            ),
            (
                "Safety and electrical awareness",
                "Lighting work must be creative without being careless.",
                [
                    "Heat, cables, stands, sandbags, power load, weather, fire risk, and trip hazards",
                    "Safe handling of fixtures, modifiers, batteries, and extension cords",
                    "Location policies, crew communication, and shutdown procedures",
                ],
            ),
        ],
    ),
    (
        "Location Sound, Microphones, and Audio Recording",
        "Capture intelligible, usable production audio and understand why sound quality often determines perceived professionalism.",
        [
            (
                "Sound priorities",
                "Students learn why clean dialogue, room tone, and controlled noise are essential to a finished project.",
                [
                    "Dialogue intelligibility, signal-to-noise ratio, room tone, ambience, and unwanted noise",
                    "Monitoring with headphones and reading audio meters",
                    "Common audio problems: clipping, handling noise, wind, hum, echo, rustle, and phase issues",
                ],
            ),
            (
                "Microphones and recording setups",
                "This subtopic builds practical knowledge of how microphones hear space and subjects.",
                [
                    "Shotgun, lavalier, handheld, stereo, and onboard microphones",
                    "Boom technique, lav placement, wind protection, wireless systems, and recorder settings",
                    "Dual-system sound, sync sound, slating, timecode basics, and backup tracks",
                ],
            ),
            (
                "Production audio workflow",
                "Students practice the habits that make audio usable in the edit.",
                [
                    "Sound reports, file naming, takes, wild lines, room tone, and ambient beds",
                    "Interview audio, dialogue scenes, documentary observation, and B-roll sound",
                    "Handing audio to the editor with organized folders and notes",
                ],
            ),
        ],
    ),
    (
        "Pre-Production, Producing, Scheduling, and Production Management",
        "Plan a project through script breakdowns, budgets, schedules, locations, permissions, risk, and crew logistics.",
        [
            (
                "Development and feasibility",
                "Pre-production teaches students to shape good ideas into projects that can actually be made well.",
                [
                    "Concept, logline, treatment, proposal, audience, scope, constraints, and deliverables",
                    "Choosing locations, subjects, cast, crew, props, gear, and production approach",
                    "Balancing ambition with time, access, budget, skill level, and risk",
                ],
            ),
            (
                "Planning documents",
                "Professional productions rely on clear documents that let teams coordinate under pressure.",
                [
                    "Script breakdown, shot list, storyboard, call sheet, production schedule, budget, gear list, and contact sheet",
                    "Location scout notes, release forms, risk assessment, insurance basics, and contingency plans",
                    "Crew communication, file sharing, and decision tracking",
                ],
            ),
            (
                "Production management",
                "Students learn how producers protect the creative work by managing logistics, constraints, and people.",
                [
                    "Scheduling, meals, transportation, permissions, equipment checkout, backup gear, and wrap procedures",
                    "Time management on set and prioritizing must-have coverage",
                    "Problem solving when weather, people, gear, or locations change",
                ],
            ),
        ],
    ),
    (
        "Screenwriting, Story Development, and Script Breakdown",
        "Develop short-form ideas into producible scripts, treatments, shot plans, and production-ready documents.",
        [
            (
                "Short-form storytelling",
                "Students learn how small projects need clear stakes, strong structure, and producible moments.",
                [
                    "Premise, character, objective, obstacle, change, scene beats, and visual action",
                    "Narrative, documentary, experimental, promotional, and social-video forms",
                    "Writing for images, sound, behavior, and production reality",
                ],
            ),
            (
                "Script formats and development documents",
                "Different formats help teams understand different kinds of media projects.",
                [
                    "Screenplay format, two-column AV script, treatment, pitch deck, documentary proposal, and interview plan",
                    "Scene headings, action lines, dialogue, transitions, and production notes",
                    "Revisions, table reads, feedback notes, and locking a production draft",
                ],
            ),
            (
                "Script breakdown",
                "Breaking down the script connects writing to the real needs of production.",
                [
                    "Cast, locations, props, wardrobe, set dressing, vehicles, effects, sound needs, and special equipment",
                    "Coverage planning, scene priorities, pages-per-day, and scheduling implications",
                    "Identifying legal, ethical, safety, accessibility, and budget concerns",
                ],
            ),
        ],
    ),
    (
        "Directing, Blocking, Performance, and On-Set Communication",
        "Practice directing actors, subjects, crew, camera, and action with clear communication and ethical leadership.",
        [
            (
                "Directing actors and participants",
                "Directing is about creating conditions where people can give truthful, usable performances or testimony.",
                [
                    "Objectives, beats, playable actions, adjustments, rehearsal, improvisation, and listening",
                    "Working with non-actors, interview subjects, children, communities, and vulnerable participants",
                    "Consent, comfort, boundaries, and trauma-aware communication",
                ],
            ),
            (
                "Blocking and staging",
                "Blocking connects bodies, camera, light, sound, and space into a coherent scene.",
                [
                    "Entrances, exits, marks, eyelines, camera movement, actor movement, and props",
                    "Blocking for continuity, motivated movement, tension, and emotional focus",
                    "Staging interviews, demonstrations, documentary action, and group scenes",
                ],
            ),
            (
                "Set communication",
                "Good on-set communication preserves time, morale, safety, and creative clarity.",
                [
                    "Calls, resets, quiet on set, rolling, cut, pickups, notes, and department communication",
                    "Giving concise direction, receiving crew feedback, and resolving conflicts",
                    "Leadership habits: respect, clarity, inclusion, punctuality, and accountability",
                ],
            ),
        ],
    ),
    (
        "Documentary and Nonfiction Production Basics",
        "Introduce research, interviews, observation, verite practice, archival material, consent, and truthful nonfiction structure.",
        [
            (
                "Research and access",
                "Nonfiction projects depend on trust, preparation, and a clear reason for filming.",
                [
                    "Topic research, participant outreach, access negotiations, background reading, and archival discovery",
                    "Ethical framing, positionality, consent, transparency, and participant expectations",
                    "Planning for actuality, interviews, verite, reenactment, and archival media",
                ],
            ),
            (
                "Interview and observation",
                "Students practice capturing unscripted material with technical control and human sensitivity.",
                [
                    "Interview questions, listening, follow-up prompts, silence, room setup, eye line, and release forms",
                    "Observational shooting, B-roll, sequences, action coverage, and environmental sound",
                    "Working in real locations with changing light, sound, time, and participant comfort",
                ],
            ),
            (
                "Nonfiction structure",
                "Documentary editing begins before the shoot through research questions and story hypotheses.",
                [
                    "Character, conflict, theme, argument, chronology, essay structure, and process structure",
                    "Voice-over, text cards, archival material, evidence, and fair representation",
                    "Accountability to participants, audience, and truth claims",
                ],
            ),
        ],
    ),
    (
        "Editing Software, Continuity, and Post-Production Workflow",
        "Organize media, build assemblies, shape continuity, manage versions, and develop editorial judgment in modern NLEs.",
        [
            (
                "NLE foundations",
                "Students learn to operate editing software with organized, repeatable workflow rather than trial-and-error clutter.",
                [
                    "Premiere Pro, DaVinci Resolve, Final Cut, or comparable NLE workspace basics",
                    "Ingest, bins, metadata, markers, syncing, multicam basics, timelines, and project settings",
                    "Proxy workflow, relinking, backups, autosaves, versioning, and exports",
                ],
            ),
            (
                "Continuity and story editing",
                "Editing teaches students to shape material into coherent time, space, emotion, and meaning.",
                [
                    "Assembly, rough cut, fine cut, picture lock, continuity, pacing, rhythm, and clarity",
                    "J-cuts, L-cuts, match cuts, cutaways, reaction shots, montage, and ellipsis",
                    "Performance selection, scene beats, transitions, and audience attention",
                ],
            ),
            (
                "Collaboration and review",
                "Post-production is a collaborative process of notes, revisions, and disciplined decision-making.",
                [
                    "Exporting review cuts, naming versions, receiving notes, spotting issues, and making revision logs",
                    "Working with directors, producers, sound editors, colorists, and peers",
                    "Avoiding common problems: lost media, mixed frame rates, weak backups, and unclear file names",
                ],
            ),
        ],
    ),
    (
        "Sound Editing, Music, Color, Graphics, and Finishing",
        "Move beyond assembly into polished finishing through audio, color, titles, export settings, and quality control.",
        [
            (
                "Sound post-production",
                "Sound finishing adds clarity, space, continuity, emotion, and polish.",
                [
                    "Dialogue editing, noise reduction, room tone, ambience, Foley, effects, music, levels, and basic mixing",
                    "Sound bridges, perspective, offscreen sound, silence, and emotional rhythm",
                    "Loudness targets, stereo export, headphones versus speakers, and quality checks",
                ],
            ),
            (
                "Color and image finishing",
                "Color work helps shots match, images feel intentional, and exports meet platform expectations.",
                [
                    "Color correction, white balance fixes, exposure matching, scopes, contrast, saturation, skin tone, and shot matching",
                    "Creative looks, LUTs, consistency, restraint, and avoiding overcorrection",
                    "Graphics, titles, captions, credits, lower thirds, and motion basics",
                ],
            ),
            (
                "Export and quality control",
                "Finishing is where creative work becomes a reliable deliverable.",
                [
                    "Codec, container, bitrate, resolution, frame rate, audio settings, captions, thumbnails, and stills",
                    "Checking sync, spelling, levels, legal credits, dead frames, glitches, and compression artifacts",
                    "Archiving project files, masters, web exports, captions, releases, and production stills",
                ],
            ),
        ],
    ),
    (
        "Ethics, Safety, Copyright, Releases, and Inclusive Production",
        "Build responsible habits around people, locations, law, representation, accessibility, and set safety.",
        [
            (
                "Ethical production practice",
                "Students learn that media production affects real people and communities, not only images on a screen.",
                [
                    "Consent, representation, power, privacy, dignity, context, and harm reduction",
                    "Working with communities, vulnerable subjects, sensitive topics, and public spaces",
                    "Accountability in documentary, fiction, branded, campus, and social media projects",
                ],
            ),
            (
                "Legal and rights basics",
                "Introductory creators need enough legal literacy to avoid preventable problems.",
                [
                    "Talent releases, location releases, music rights, archival rights, fair use, Creative Commons, public domain, and trademarks",
                    "Credits, contracts, ownership, collaboration agreements, and distribution permissions",
                    "Using school equipment, platform terms, and festival submission requirements responsibly",
                ],
            ),
            (
                "Safety, accessibility, and inclusion",
                "World-class production habits include protecting people and making work accessible.",
                [
                    "Set safety, equipment safety, weather, fatigue, harassment prevention, and emergency plans",
                    "Inclusive casting, respectful crew culture, cultural competence, and accessible communication",
                    "Captions, transcripts, alt text, audio description awareness, and accessible screening practices",
                ],
            ),
        ],
    ),
    (
        "Digital Delivery, Platforms, Festivals, and Audience Strategy",
        "Prepare work for real audiences across classroom critique, web platforms, festivals, portfolios, and social distribution.",
        [
            (
                "Audience and platform fit",
                "Distribution decisions should be shaped by who the work is for and how they will encounter it.",
                [
                    "Class screening, web video, social platforms, festival submission, portfolio site, installation, and live event contexts",
                    "Aspect ratios, duration norms, thumbnails, descriptions, metadata, captions, and accessibility",
                    "Audience persona, viewing environment, attention span, and call to action",
                ],
            ),
            (
                "Festival and professional presentation",
                "Students learn the basics of presenting work beyond the classroom.",
                [
                    "Festival strategy, submission platforms, deadlines, premiere status, screening copies, stills, synopsis, logline, director statement, and bio",
                    "Press kits, posters, trailers, social assets, and public-facing project descriptions",
                    "Ethical promotion, participant approval, and expectation management",
                ],
            ),
            (
                "Portfolio and career readiness",
                "Delivery also means preparing evidence of skill for internships, jobs, grants, and future coursework.",
                [
                    "Reel selection, project page, process notes, credits, role clarity, and reflective artist statement",
                    "Networking, collaboration records, recommendation materials, and professional communication",
                    "Archiving masters, documentation, production stills, behind-the-scenes images, and release paperwork",
                ],
            ),
        ],
    ),
    (
        "Critique, Revision, Collaboration, and Production Portfolio",
        "Use critique, reflection, peer collaboration, and revision to strengthen the final project and professional portfolio.",
        [
            (
                "Critique literacy",
                "Critique turns feedback into better creative judgment when students know how to give and receive it.",
                [
                    "Descriptive feedback, interpretive feedback, evaluative feedback, and actionable notes",
                    "Separating intention, execution, audience response, and technical issue",
                    "Using evidence from the work rather than vague preference",
                ],
            ),
            (
                "Revision strategy",
                "Revision helps students prioritize the changes that most improve clarity, emotion, ethics, and finish.",
                [
                    "Note triage, revision logs, alternate cuts, test screenings, and deadlines",
                    "Fixing story, structure, pacing, audio, color, graphics, credits, and export problems",
                    "Knowing when to reshoot, rerecord, rewrite, cut, simplify, or finish",
                ],
            ),
            (
                "Collaborative professionalism",
                "The course should build habits students can carry into advanced production and creative work.",
                [
                    "Peer roles, accountability, credits, conflict resolution, shared folders, and meeting notes",
                    "Reflective memos on creative decisions, constraints, and lessons learned",
                    "Portfolio assembly, role descriptions, and evidence of process",
                ],
            ),
        ],
    ),
    (
        "Final Short Media Project Capstone",
        "Synthesize the course by developing, shooting, editing, finishing, and presenting a short media work.",
        [
            (
                "Project proposal and greenlight",
                "The capstone begins with a clear, feasible idea that can be evaluated before production starts.",
                [
                    "Logline, treatment, audience, aesthetic references, schedule, budget, roles, and risk plan",
                    "Script, storyboard, shot list, interview plan, location plan, release plan, and equipment list",
                    "Instructor or peer greenlight based on feasibility, ethics, safety, and learning goals",
                ],
            ),
            (
                "Production and post-production execution",
                "Students synthesize camera, sound, lighting, directing, producing, editing, and finishing in one complete work.",
                [
                    "Principal photography, sound recording, lighting, directing, production notes, backups, and dailies",
                    "Assembly, rough cut, fine cut, picture lock, sound edit, color, titles, captions, and final export",
                    "Technical quality control, credits, archive package, and delivery specifications",
                ],
            ),
            (
                "Screening, reflection, and portfolio package",
                "The final step is presenting the work, learning from response, and turning the project into future evidence.",
                [
                    "Public or class screening, critique, artist statement, production reflection, and revision note",
                    "Portfolio page, thumbnail, stills, credits, synopsis, role description, and release documentation",
                    "Next-step plan for festivals, web release, reshoots, advanced coursework, or portfolio refinement",
                ],
            ),
        ],
    ),
]

write_seed(
    "introduction-to-media-production",
    "Introduction to Media Production",
    DESC,
    "f6a7b8c9-0d1e-4f51-8b01-1c2d3e4f5a51",
    "impdjson",
    UNITS,
    "introduction_to_media_production",
)
