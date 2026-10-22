"""Cinematography curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "Cinematography is a core Film & Media production course focused on camera, lighting, lensing, "
    "movement, color, collaboration, and visual storytelling. Students learn to design images that "
    "serve story and performance, operate professional camera and lighting workflows, work safely "
    "with crew, communicate with directors and post-production, and develop a polished "
    "cinematography portfolio."
)

UNITS = [
    (
        "Cinematography as Visual Storytelling",
        "This opening topic defines cinematography as the disciplined design of images in service of story, emotion, rhythm, and audience attention.",
        [
            (
                "The cinematographer's role",
                "Students learn what the DP contributes creatively, technically, and collaboratively.",
                [
                    "Visual authorship and service to the director's vision",
                    "Relationship to production design, costume, editing, and sound",
                    "Taste, references, tests, and visual decision-making",
                ],
            ),
            (
                "Image as narrative evidence",
                "The goal is to treat every frame as a story choice.",
                [
                    "Mood, theme, character perspective, and point of view",
                    "Visual motifs, contrast, repetition, and transformation",
                    "Reading cinematography in existing films",
                ],
            ),
            (
                "Production constraints as creative tools",
                "Students learn that limitations often generate style.",
                [
                    "Budget, time, location, crew, and gear limits",
                    "Designing images around available resources",
                    "Problem-solving without sacrificing intention",
                ],
            ),
        ],
    ),
    (
        "Camera Systems and Set Workflow",
        "This topic gives students operational confidence with cameras while emphasizing professional workflow and reliability.",
        [
            (
                "Camera bodies and formats",
                "Students learn how camera choice shapes image, workflow, and production logistics.",
                [
                    "Digital cinema, mirrorless, broadcast, and smartphone systems",
                    "Sensor size, resolution, rolling shutter, and dynamic range",
                    "Media, power, monitoring, and accessories",
                ],
            ),
            (
                "Menus, monitoring, and exposure tools",
                "The point is to use camera tools deliberately rather than by habit.",
                [
                    "Waveform, false color, histogram, zebras, and focus peaking",
                    "Frame guides, LUT monitoring, and display calibration",
                    "Metadata, clip naming, and media management",
                ],
            ),
            (
                "On-set workflow discipline",
                "Students practice habits that protect footage and time.",
                [
                    "Camera reports, slating, cards, backups, and checksums",
                    "Communication with assistant camera, DIT, script supervisor, and editor",
                    "Resetting, labeling, and troubleshooting under pressure",
                ],
            ),
        ],
    ),
    (
        "Lens Fundamentals and Optical Choices",
        "Lenses are expressive instruments, not just magnification tools. This topic connects focal length, perspective, depth, texture, and character psychology.",
        [
            (
                "Focal length and perspective",
                "Students learn how lens choice changes spatial relationships and emotional distance.",
                [
                    "Wide, normal, telephoto, macro, and specialty lenses",
                    "Compression, distortion, and proximity",
                    "Matching lens choice to scene intent",
                ],
            ),
            (
                "Aperture, focus, and depth of field",
                "The gist is to control attention through sharpness and blur.",
                [
                    "T-stops, f-stops, bokeh, close focus, and hyperfocal distance",
                    "Rack focus, split focus, and focus pulls",
                    "Depth as a dramatic and spatial device",
                ],
            ),
            (
                "Lens character and testing",
                "Students learn to evaluate lenses before relying on them.",
                [
                    "Sharpness, contrast, flare, breathing, color, and aberration",
                    "Prime versus zoom workflow",
                    "Lens tests, charts, and subjective look evaluation",
                ],
            ),
        ],
    ),
    (
        "Exposure, Dynamic Range, and the Digital Image",
        "This topic teaches students how exposure decisions shape mood, texture, recoverability, and post-production flexibility.",
        [
            (
                "The exposure triangle",
                "Students learn the practical relationship among aperture, shutter, and sensitivity.",
                [
                    "ISO, EI, shutter angle, aperture, ND filtration",
                    "Motion blur, noise, and depth-of-field tradeoffs",
                    "Manual exposure discipline",
                ],
            ),
            (
                "Dynamic range and latitude",
                "The point is to protect highlights, shadows, and skin tones.",
                [
                    "Stops, clipping, noise floor, and middle gray",
                    "Log, raw, and baked image profiles",
                    "Expose-to-the-right debates and production context",
                ],
            ),
            (
                "Measuring and controlling exposure",
                "Students connect meters and scopes to creative judgment.",
                [
                    "Incident and spot metering",
                    "Waveform and false-color interpretation",
                    "Exposure consistency across coverage",
                ],
            ),
        ],
    ),
    (
        "Composition and Framing",
        "Composition organizes attention inside the frame. This topic builds the visual literacy needed to make frames legible, expressive, and cinematic.",
        [
            (
                "Frame geometry",
                "Students learn to compose through balance, line, shape, depth, and negative space.",
                [
                    "Rule of thirds, symmetry, asymmetry, and center framing",
                    "Leading lines, frames within frames, and layered depth",
                    "Headroom, look room, eyelines, and screen direction",
                ],
            ),
            (
                "Aspect ratio and format",
                "The goal is to design images for the chosen canvas.",
                [
                    "1.33, 1.66, 1.85, 2.39, vertical, square, and social formats",
                    "Safe areas, reframing, and platform delivery",
                    "How aspect ratio changes blocking and staging",
                ],
            ),
            (
                "Composition for meaning",
                "Students practice using framing as subtext.",
                [
                    "Power, isolation, intimacy, tension, and reveal",
                    "Subject-object relationships",
                    "Foreground and background as story information",
                ],
            ),
        ],
    ),
    (
        "Camera Movement and Stabilization",
        "Movement changes how viewers feel space and time. This topic teaches when to move, how to move, and when stillness is stronger.",
        [
            (
                "Movement motivation",
                "Students learn to connect camera movement to story rather than decoration.",
                [
                    "Character movement, emotional shift, reveal, pursuit, and discovery",
                    "Stillness, drift, push, pull, pan, tilt, track, crane, and handheld",
                    "Rhythm and editorial consequences",
                ],
            ),
            (
                "Tools and techniques",
                "The point is to understand movement options and their tradeoffs.",
                [
                    "Tripod, dolly, slider, jib, crane, Steadicam, gimbal, drone, vehicle rigs",
                    "Handheld posture and controlled instability",
                    "Safety, rehearsal, marks, and repeatability",
                ],
            ),
            (
                "Movement grammar",
                "Students learn how motion affects continuity and audience orientation.",
                [
                    "Axis, screen direction, motivated reframing, and parallax",
                    "Long takes and blocking complexity",
                    "Cutting into and out of movement",
                ],
            ),
        ],
    ),
    (
        "Light Physics, Fixtures, and Safety",
        "Before expressive lighting, students need the fundamentals of light behavior, fixture choice, power, and safe set practice.",
        [
            (
                "Light behavior",
                "Students learn the physics that makes lighting predictable.",
                [
                    "Intensity, distance, inverse square law, spread, falloff, and direction",
                    "Hardness, softness, diffusion, bounce, and negative fill",
                    "Reflection, absorption, transmission, and color temperature",
                ],
            ),
            (
                "Lighting units and control",
                "The gist is to know what tools do before placing them.",
                [
                    "LED, tungsten, HMI, fluorescent, practicals, tubes, panels, and fresnels",
                    "Flags, nets, scrims, grids, cutters, diffusion, and gels",
                    "DMX, dimming, flicker, and fixture limitations",
                ],
            ),
            (
                "Electrical and set safety",
                "Students learn professional habits that prevent injury and equipment failure.",
                [
                    "Load calculations, circuits, batteries, cabling, and weather",
                    "Grip stands, sandbags, overhead rigging, and hot fixtures",
                    "Set communication and hazard awareness",
                ],
            ),
        ],
    ),
    (
        "Lighting for Mood, Faces, and Story",
        "Lighting is where cinematography becomes emotional architecture. This topic trains students to shape faces, spaces, contrast, and atmosphere.",
        [
            (
                "Key, fill, backlight, and contrast",
                "Students learn classic lighting structure as a flexible language.",
                [
                    "Three-point lighting and its alternatives",
                    "Lighting ratios, mood, and genre conventions",
                    "Silhouette, edge light, toppers, eye light, and wrap",
                ],
            ),
            (
                "Lighting faces and skin",
                "The point is to make ethical and beautiful choices across different people and contexts.",
                [
                    "Face shape, skin tone, texture, age, and makeup",
                    "Soft versus hard sources and directionality",
                    "Exposure choices that respect subject dignity",
                ],
            ),
            (
                "Atmosphere and motivated light",
                "Students connect light to the world of the scene.",
                [
                    "Windows, lamps, screens, signs, fire, moonlight, and streetlight",
                    "Smoke, haze, rain, and texture",
                    "Day, night, dawn, dusk, and continuity across time",
                ],
            ),
        ],
    ),
    (
        "Color, Contrast, and Visual Palette",
        "Color and contrast carry emotion, time, genre, and world-building. This topic links on-set color decisions to post-production and story design.",
        [
            (
                "Color theory for cinematography",
                "Students learn the visual effects of hue, saturation, value, and temperature.",
                [
                    "Complementary, analogous, monochrome, and split palettes",
                    "Warm/cool contrast and emotional associations",
                    "Color scripts and palette boards",
                ],
            ),
            (
                "White balance and color management",
                "The goal is to maintain control from camera to grade.",
                [
                    "Kelvin settings, tint, mixed sources, and gels",
                    "Log, LUTs, transforms, ACES concepts, and display-referred images",
                    "Color charts and controlled references",
                ],
            ),
            (
                "Contrast and tonal design",
                "Students understand tone as composition.",
                [
                    "High key, low key, noir, naturalism, and stylization",
                    "Black levels, highlight rolloff, and skin-tone placement",
                    "Matching contrast across coverage",
                ],
            ),
        ],
    ),
    (
        "Blocking, Coverage, and Director Collaboration",
        "Great images emerge from performance, staging, and collaboration. This topic teaches students to build shots with directors and actors rather than merely record action.",
        [
            (
                "Blocking with story intent",
                "Students learn to place camera and actors around dramatic beats.",
                [
                    "Power shifts, entrances, exits, proximity, and reveal",
                    "Camera position relative to performance",
                    "Rehearsal as image discovery",
                ],
            ),
            (
                "Coverage strategy",
                "The point is to design shots that edit together and preserve performance.",
                [
                    "Masters, singles, over-the-shoulders, inserts, and cutaways",
                    "Shot size progression and emotional escalation",
                    "Efficiency versus expressive specificity",
                ],
            ),
            (
                "Director-DP communication",
                "Students practice translating ideas into shootable plans.",
                [
                    "Lookbooks, references, shot lists, overheads, and tests",
                    "Language for mood, lens, movement, and light",
                    "Negotiating creative priorities under constraints",
                ],
            ),
        ],
    ),
    (
        "Location, Interior, and Exterior Lighting Practice",
        "This topic moves students from theory into repeatable setups under real location constraints.",
        [
            (
                "Interior lighting setups",
                "Students practice building motivated interiors quickly and safely.",
                [
                    "Window key, practical augmentation, book lights, negative fill",
                    "Small room strategy and spill control",
                    "Continuity across coverage",
                ],
            ),
            (
                "Exterior lighting setups",
                "The goal is to work intelligently with the sun and environment.",
                [
                    "Sun path, backlight, shade, diffusion, bounce, and negative fill",
                    "Golden hour, midday, overcast, and night exterior tactics",
                    "Weather, permits, and safety planning",
                ],
            ),
            (
                "Low-light and night work",
                "Students learn to design darkness without losing image quality.",
                [
                    "Moonlight, streetlight, practicals, and motivated sources",
                    "Noise, contrast, color, and exposure strategy",
                    "Power, rigging, crew movement, and visibility",
                ],
            ),
        ],
    ),
    (
        "Camera Department, Crew Roles, and Set Protocol",
        "Cinematography is a team craft. This topic teaches the roles, language, and discipline that keep a set professional.",
        [
            (
                "Camera department roles",
                "Students learn who does what and why it matters.",
                [
                    "DP, camera operator, first AC, second AC, loader/media manager, DIT",
                    "Focus, slating, lens changes, builds, and reports",
                    "Respecting chain of command and communication lanes",
                ],
            ),
            (
                "Grip and electric collaboration",
                "The point is to understand how image plans become physical setups.",
                [
                    "Gaffer, best electric, key grip, dolly grip, swing crew",
                    "Lighting plots, rigging, power, stands, flags, and overheads",
                    "Time estimates and safe setup sequencing",
                ],
            ),
            (
                "Set etiquette and leadership",
                "Students practice professional conduct.",
                [
                    "Clear calls, quiet on set, lockups, and resets",
                    "Inclusive, respectful, and harassment-free sets",
                    "Problem escalation and decision ownership",
                ],
            ),
        ],
    ),
    (
        "Digital Cinema Workflow, LUTs, and DIT Practice",
        "Modern cinematography depends on a reliable image pipeline. This topic teaches students how capture choices flow into dailies, edit, grade, and delivery.",
        [
            (
                "Capture formats",
                "Students understand how codecs and recording settings affect quality and workflow.",
                [
                    "Raw, ProRes, DNx, H.264/H.265, bit depth, chroma subsampling",
                    "Resolution, frame rate, data rate, and storage planning",
                    "Proxy workflow and editorial handoff",
                ],
            ),
            (
                "Look management",
                "The gist is to separate monitoring looks from recorded image data.",
                [
                    "Show LUTs, technical LUTs, CDL, and viewing transforms",
                    "Communicating intended look to post",
                    "Dailies, stills, and continuity references",
                ],
            ),
            (
                "Data integrity",
                "Students learn that footage protection is part of cinematography.",
                [
                    "Card handling, checksum backup, naming, reports, and verification",
                    "DIT station basics and onset color notes",
                    "Failure prevention and recovery protocols",
                ],
            ),
        ],
    ),
    (
        "Pre-Production, Shot Design, and Visual Planning",
        "Strong cinematography is designed before the camera rolls. This topic teaches planning documents that turn ideas into images.",
        [
            (
                "Visual research and lookbooks",
                "Students learn to gather references that guide production rather than merely decorate a pitch.",
                [
                    "Frames, paintings, photography, texture, color, and genre references",
                    "Reference analysis: what to borrow and what to avoid",
                    "Visual rules and exceptions",
                ],
            ),
            (
                "Shot lists and overheads",
                "The point is to translate scenes into efficient production plans.",
                [
                    "Shot numbering, lenses, movement, size, and coverage notes",
                    "Floor plans, sun paths, lighting diagrams, and gear lists",
                    "Contingency plans and schedule realism",
                ],
            ),
            (
                "Camera and lighting tests",
                "Students learn to test assumptions before production.",
                [
                    "Lens, filter, LUT, exposure, skin tone, and wardrobe tests",
                    "Location scouts and tech scouts",
                    "Test review with director, production design, makeup, and post",
                ],
            ),
        ],
    ),
    (
        "Genre, Documentary, and Specialized Cinematography",
        "Different forms ask different things of the camera. This topic prepares students to adapt craft principles across narrative, documentary, commercial, and experimental work.",
        [
            (
                "Narrative genre language",
                "Students learn how genre shapes visual expectations.",
                [
                    "Comedy, horror, drama, thriller, action, musical, and period work",
                    "Genre conventions and creative deviation",
                    "Visual continuity across scenes and acts",
                ],
            ),
            (
                "Documentary cinematography",
                "The goal is to balance responsiveness, ethics, and image quality.",
                [
                    "Interviews, verite, b-roll, observational shooting, and access",
                    "Consent, vulnerability, and representational responsibility",
                    "Small-crew mobility and available-light strategy",
                ],
            ),
            (
                "Specialized techniques",
                "Students survey techniques that require extra planning.",
                [
                    "Green screen, VFX plates, high speed, time-lapse, macro, underwater, drone",
                    "Product, music video, and branded-content lighting",
                    "Safety, permits, insurance, and specialist crew",
                ],
            ),
        ],
    ),
    (
        "Critique, Visual Analysis, and Professional Taste",
        "Students grow by learning to see precisely and speak about images usefully. This topic builds critique habits that improve both craft and collaboration.",
        [
            (
                "Shot analysis",
                "Students practice diagnosing how an image works.",
                [
                    "Lens, composition, exposure, color, light, movement, and blocking",
                    "Cause-and-effect analysis rather than taste alone",
                    "Comparing student work with professional references",
                ],
            ),
            (
                "Critique language",
                "The point is to give feedback that is specific, respectful, and actionable.",
                [
                    "Intention, execution, audience effect, and revision paths",
                    "Separating technical issues from creative choices",
                    "Receiving critique without defensiveness",
                ],
            ),
            (
                "Developing taste",
                "Students learn that taste is trained through viewing and making.",
                [
                    "Shot journals and frame studies",
                    "Cinematographer research and ASC-style interviews",
                    "Personal visual grammar and growth goals",
                ],
            ),
        ],
    ),
    (
        "Ethics, Representation, and Sustainable Production",
        "Images have social consequences. This topic teaches students to make responsible visual choices about people, labor, environment, and power.",
        [
            (
                "Representation and gaze",
                "Students examine how camera choices can dignify, stereotype, objectify, or empower.",
                [
                    "Framing bodies, communities, violence, poverty, and intimacy",
                    "Consent, vulnerability, and image ownership",
                    "Cultural consultation and context",
                ],
            ),
            (
                "Set ethics",
                "The goal is to connect image ambition to humane labor practice.",
                [
                    "Safety, rest, communication, harassment prevention, and accessibility",
                    "Working with actors, minors, stunts, intimacy, and sensitive material",
                    "Leadership under pressure",
                ],
            ),
            (
                "Sustainable production",
                "Students learn basic ecological responsibility in camera and lighting practice.",
                [
                    "Power use, batteries, generators, transport, and waste",
                    "LED efficiency and location impact",
                    "Planning choices that reduce unnecessary footprint",
                ],
            ),
        ],
    ),
    (
        "Cinematography Portfolio and Final Scene Project",
        "The capstone converts practice into evidence of growth. Students create a scene or visual sequence and curate a portfolio that shows intention, craft, and reflection.",
        [
            (
                "Final scene project",
                "Students synthesize camera, light, movement, color, and collaboration in a complete short sequence.",
                [
                    "Script breakdown, references, lookbook, and shot list",
                    "Production, lighting plan, camera reports, and footage management",
                    "Rough cut, grade notes, and final delivery",
                ],
            ),
            (
                "Portfolio curation",
                "The point is to present work professionally.",
                [
                    "Selected frames, lighting diagrams, before/after stills, and final clips",
                    "DP statement and project context",
                    "Reel structure, credits, and permissions",
                ],
            ),
            (
                "Reflection and next steps",
                "Students learn to evaluate their own process and plan future growth.",
                [
                    "Technical strengths and weaknesses",
                    "Collaboration lessons and production constraints",
                    "Personal cinematography goals and practice plan",
                ],
            ),
        ],
    ),
]

write_seed(
    "cinematography",
    "Cinematography",
    DESC,
    "c7d8e9f0-1a2b-4c42-9e12-2f3a4b5c6d42",
    "cinejson",
    UNITS,
    "cinematography",
)
