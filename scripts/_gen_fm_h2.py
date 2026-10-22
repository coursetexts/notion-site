"""Film History II curated-course seed generator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _seedlib import write_seed

DESC = (
    "This syllabus preserves a French New Wave-to-streaming arc while adding postwar art cinema, "
    "Third Cinema, African/Latin American/Middle Eastern cinemas, "
    "feminist/queer/Black/Indigenous/decolonial histories, video/time-based media, archive practice, "
    "and a research capstone."
)

UNITS = [
    (
        "Modern Film History as Global Method",
        "This section frames Film History II as a study of postwar and contemporary cinema through movements, institutions, technologies, audiences, archives, and global power.",
        [
            (
                "From national cinema to transnational cinema",
                "Students learn why modern film history cannot be told only as separate national stories.",
                [
                    "Co-productions and festival circuits",
                    "Migration, exile, and diasporic filmmaking",
                    "Global circulation of style, labor, capital, and taste",
                ],
            ),
            (
                "Historiography and critical method",
                "The point is to make historical arguments from films, criticism, industry evidence, and reception.",
                [
                    "Primary and secondary sources",
                    "Close analysis with historical context",
                    "Canon critique and archive awareness",
                ],
            ),
            (
                "Modernity, decolonization, and media change",
                "Students connect cinema to postwar politics, decolonization, television, video, digital media, and globalization.",
                [
                    "Cold War and postcolonial contexts",
                    "Mass media and spectatorship",
                    "Technology as historical force",
                ],
            ),
        ],
    ),
    (
        "Postwar Film Culture and International Art Cinema",
        "This section shows how postwar festivals, critics, art houses, auteurs, and cinephile institutions created a new international film culture.",
        [
            (
                "Festival and art-house systems",
                "Students learn how exhibition institutions shaped what counted as serious cinema.",
                [
                    "Cannes, Venice, Berlin, and festival prestige",
                    "Art-house distribution and subtitled cinema",
                    "Cine-clubs, critics, and film journals",
                ],
            ),
            (
                "Auteurs and modernist narration",
                "The gist is to study ambiguity, style, subjectivity, and open endings as historical art-cinema conventions.",
                [
                    "Authorial signature",
                    "Psychological ambiguity",
                    "Ellipsis, reflexivity, and open form",
                ],
            ),
            (
                "Postwar cultural memory",
                "Students connect modern cinema to trauma, reconstruction, and changing social life.",
                [
                    "War memory and ruins",
                    "Existentialism and alienation",
                    "New spectators and cinephilia",
                ],
            ),
        ],
    ),
    (
        "The French New Wave",
        "The French New Wave is a central case in modern film history because it linked criticism, cinephilia, low-budget production, youth culture, and formal experimentation.",
        [
            (
                "Cahiers du Cinema and auteur politics",
                "Students learn how critics became filmmakers and reframed film history through authorship.",
                [
                    "Auteur theory and mise-en-scene criticism",
                    "Truffaut, Godard, Chabrol, Rohmer, and Rivette",
                    "Cinephilia as method",
                ],
            ),
            (
                "Style and production",
                "The point is to connect handheld cameras, location shooting, jump cuts, and improvisation to economic and cultural change.",
                [
                    "Lightweight equipment and location work",
                    "Fragmented editing and direct address",
                    "Youth culture, urban space, and spontaneity",
                ],
            ),
            (
                "Legacy and critique",
                "Students evaluate both the movement's influence and its limits.",
                [
                    "Global new-wave influence",
                    "Gender and authorship critiques",
                    "New Wave afterlives in independent cinema",
                ],
            ),
        ],
    ),
    (
        "New Waves Around the World",
        "This section expands the New Wave concept into a comparative study of modern cinemas in political, cultural, and institutional transformation.",
        [
            (
                "European new waves",
                "Students compare new film movements that challenged studio tradition and postwar consensus.",
                [
                    "Czech New Wave",
                    "British kitchen-sink realism",
                    "New German Cinema",
                ],
            ),
            (
                "Third Cinema and political modernism",
                "The gist is to examine cinema as anti-colonial, revolutionary, and collective practice.",
                [
                    "Latin American Third Cinema",
                    "Manifestos and militant spectatorship",
                    "Imperfect cinema and political urgency",
                ],
            ),
            (
                "Regional modernisms",
                "Students study modern cinema beyond a Euro-American frame.",
                [
                    "Japanese New Wave",
                    "Indian parallel cinema",
                    "African and Middle Eastern modernist cinemas",
                ],
            ),
        ],
    ),
    (
        "New Hollywood, 1967-1980",
        "New Hollywood marks a major transformation in American cinema through youth audiences, auteur branding, genre revision, political disillusionment, and industry crisis.",
        [
            (
                "Industrial crisis and opportunity",
                "Students learn how declining studio control opened space for new filmmakers and subjects.",
                [
                    "Paramount decrees and studio restructuring",
                    "Television competition and youth markets",
                    "Ratings system and changing censorship",
                ],
            ),
            (
                "Auteurism and genre revision",
                "The point is to connect European art cinema and American genre tradition.",
                [
                    "Road movie, western, crime, horror, and melodrama revision",
                    "Ambiguous protagonists and antiheroes",
                    "Violence, sexuality, and political distrust",
                ],
            ),
            (
                "Race, gender, and counterculture",
                "Students examine the period's promises and blind spots.",
                [
                    "Blaxploitation and independent Black cinema",
                    "Women filmmakers and feminist critique",
                    "Vietnam, Watergate, and social fracture",
                ],
            ),
        ],
    ),
    (
        "The Blockbuster Era and Conglomerate Hollywood",
        "This section studies how Hollywood reorganized around high-concept films, saturation release, franchises, merchandising, and corporate media ownership.",
        [
            (
                "Blockbuster economics",
                "Students learn how Jaws, Star Wars, and franchise logic reshaped production and distribution.",
                [
                    "Wide release and saturation marketing",
                    "Merchandising and ancillary markets",
                    "Risk, spectacle, and event cinema",
                ],
            ),
            (
                "High concept and genre spectacle",
                "The gist is to see style, premise, and marketing as an integrated system.",
                [
                    "Pitchability and visual hooks",
                    "Action, sci-fi, fantasy, and family entertainment",
                    "Sound, effects, and affective scale",
                ],
            ),
            (
                "Conglomeration and synergy",
                "Students connect film to broader media industries.",
                [
                    "Corporate ownership and vertical integration revisited",
                    "Television, cable, music, games, and toys",
                    "IP management and franchise world-building",
                ],
            ),
        ],
    ),
    (
        "Independent American Cinema",
        "Independent cinema offers alternative production models, regional stories, identity politics, and festival-based pathways outside or alongside Hollywood.",
        [
            (
                "Indie institutions",
                "Students learn how festivals, distributors, grants, and specialty divisions built independent film culture.",
                [
                    "Sundance and festival economies",
                    "Miramax and specialty distribution",
                    "Microbudget and regional production",
                ],
            ),
            (
                "Aesthetic and narrative alternatives",
                "The point is to identify how independent films depart from classical and blockbuster norms.",
                [
                    "Minimalism, episodic structure, and character study",
                    "Queer cinema and identity-based movements",
                    "Documentary-fiction overlap",
                ],
            ),
            (
                "Indie mainstreaming",
                "Students analyze the tension between opposition and incorporation.",
                [
                    "Studio specialty arms",
                    "Awards culture and prestige branding",
                    "Streaming-era independent production",
                ],
            ),
        ],
    ),
    (
        "Asian Cinema and Regional Modernities",
        "This section gives sustained attention to major Asian cinemas as modern, industrial, artistic, and transnational formations.",
        [
            (
                "Japanese, Chinese-language, and Korean cinemas",
                "Students examine major movements, auteurs, industries, and historical turning points.",
                [
                    "Postwar Japanese cinema and anime contexts",
                    "Fifth Generation, Hong Kong cinema, and Taiwan New Cinema",
                    "Korean New Wave and global Korean cinema",
                ],
            ),
            (
                "South Asian cinema",
                "The gist is to compare popular, parallel, diasporic, and regional film cultures.",
                [
                    "Hindi popular cinema and song-dance form",
                    "Indian parallel cinema",
                    "Regional industries and diaspora audiences",
                ],
            ),
            (
                "Transnational style and circulation",
                "Students track how Asian cinema shapes global genre, art cinema, and popular culture.",
                [
                    "Martial arts, horror, melodrama, and action",
                    "Festival, remake, and streaming circulation",
                    "Authorship, stars, and regional markets",
                ],
            ),
        ],
    ),
    (
        "African, Latin American, and Middle Eastern Cinemas",
        "A top Film History II must build durable knowledge of cinemas historically marginalized in Euro-American survey models.",
        [
            (
                "African cinemas",
                "Students learn how African filmmakers navigated colonial legacies, state support, oral traditions, and global festival circuits.",
                [
                    "Senegalese and Francophone African cinema",
                    "Nollywood and popular video industries",
                    "Postcolonial memory and social critique",
                ],
            ),
            (
                "Latin American cinemas",
                "The point is to connect film movements to dictatorship, revolution, poverty, memory, and popular culture.",
                [
                    "Cinema Novo and Third Cinema",
                    "Mexican, Argentine, Chilean, and Cuban contexts",
                    "New Latin American cinemas and festival recognition",
                ],
            ),
            (
                "Middle Eastern and Iranian cinemas",
                "Students study censorship, allegory, realism, gender, religion, and transnational reception.",
                [
                    "Iranian art cinema",
                    "Palestinian and diasporic cinema",
                    "Egyptian popular cinema and regional industries",
                ],
            ),
        ],
    ),
    (
        "Documentary Movements",
        "This section examines documentary after World War II as a field of technology, ethics, observation, activism, television, and political memory.",
        [
            (
                "Direct cinema and cinema verite",
                "Students learn how lightweight cameras and sync sound changed nonfiction practice.",
                [
                    "Observation, performance, and presence",
                    "Filmmaker intervention versus invisibility",
                    "Truth claims and editing",
                ],
            ),
            (
                "Political and essay documentary",
                "The gist is to study documentary as argument, testimony, and historical intervention.",
                [
                    "Third Cinema and activist documentary",
                    "Essay film and first-person narration",
                    "Archives, memory, and trauma",
                ],
            ),
            (
                "Contemporary nonfiction ecosystems",
                "Students connect documentary to television, festivals, streaming, true crime, and impact campaigns.",
                [
                    "Docuseries and platform formats",
                    "Ethics of representation and consent",
                    "Impact producing and public debate",
                ],
            ),
        ],
    ),
    (
        "Experimental, Avant-Garde, and Essay Film",
        "Experimental cinema challenges narrative, spectatorship, medium boundaries, and institutional definitions of film.",
        [
            (
                "Postwar avant-garde traditions",
                "Students learn how experimental filmmakers explored perception, materiality, duration, and embodiment.",
                [
                    "Structural film",
                    "Expanded cinema",
                    "Found footage and material film",
                ],
            ),
            (
                "Video and time-based art",
                "The point is to connect film history with gallery, performance, installation, and electronic media.",
                [
                    "Portapak and early video art",
                    "Projection, monitors, and installation contexts",
                    "Performance and documentation",
                ],
            ),
            (
                "Essay film and hybrid forms",
                "Students study works that combine argument, memory, archive, travel, and self-reflection.",
                [
                    "Voice, text, and image thinking",
                    "Personal and political memory",
                    "Hybrid documentary-fiction structures",
                ],
            ),
        ],
    ),
    (
        "Feminist, Queer, Black, Indigenous, and Decolonial Film Histories",
        "This section centers counter-histories, not as add-ons, but as necessary frameworks for understanding modern cinema.",
        [
            (
                "Feminist film histories",
                "Students study women filmmakers, feminist criticism, labor, spectatorship, and representation.",
                [
                    "Second-wave feminist film culture",
                    "Women directors, editors, writers, and producers",
                    "The gaze, spectatorship, and critique",
                ],
            ),
            (
                "Queer and Black film histories",
                "The gist is to trace identity, form, community, market, and resistance.",
                [
                    "New Queer Cinema",
                    "L.A. Rebellion and Black independent cinema",
                    "Representation, authorship, and audience publics",
                ],
            ),
            (
                "Indigenous and decolonial cinemas",
                "Students examine sovereignty, land, language, memory, and anti-colonial image-making.",
                [
                    "Fourth Cinema and Indigenous media",
                    "Decolonial documentary and fiction",
                    "Community accountability and cultural protocols",
                ],
            ),
        ],
    ),
    (
        "Television, Video, and Media Convergence",
        "Film history after 1960 cannot be separated from television, home video, music video, cable, games, and digital convergence.",
        [
            (
                "Television and film culture",
                "Students learn how television changed audiences, financing, aesthetics, and prestige.",
                [
                    "Broadcast competition and made-for-TV movies",
                    "Cable, HBO, and prestige television",
                    "Seriality and long-form storytelling",
                ],
            ),
            (
                "Home video and cinephilia",
                "The point is to understand VHS, DVD, and boutique labels as historical forces.",
                [
                    "Rental culture and video stores",
                    "DVD extras and cinephile education",
                    "Cult film and midnight movie circulation",
                ],
            ),
            (
                "Convergence and transmedia",
                "Students connect film to wider media systems.",
                [
                    "Music video and advertising aesthetics",
                    "Games, comics, and franchise worlds",
                    "Participatory fandom and online communities",
                ],
            ),
        ],
    ),
    (
        "The Digital Cinema Revolution",
        "Digital technologies changed production, post-production, distribution, exhibition, preservation, and the look of moving images.",
        [
            (
                "Digital production and post-production",
                "Students learn how digital cameras, editing systems, VFX, and color workflows changed filmmaking.",
                [
                    "DV, HD, and digital cinematography",
                    "Nonlinear editing and compositing",
                    "Digital color grading and DI workflows",
                ],
            ),
            (
                "Digital aesthetics",
                "The gist is to study how digital tools changed realism, spectacle, movement, and time.",
                [
                    "CGI and photorealism",
                    "Motion capture and virtual production",
                    "Low-budget digital realism",
                ],
            ),
            (
                "Distribution and exhibition change",
                "Students connect digital cinema to theaters, festivals, piracy, and global access.",
                [
                    "Digital projection",
                    "Online circulation and piracy",
                    "DCP, restoration, and preservation challenges",
                ],
            ),
        ],
    ),
    (
        "Contemporary Global Cinema",
        "This section treats contemporary cinema as a network of national industries, festivals, platforms, diasporas, auteurs, genres, and uneven power.",
        [
            (
                "Global auteurs and festival cinema",
                "Students learn how contemporary prestige cinema is produced, circulated, and valued.",
                [
                    "Festival discovery and awards economies",
                    "Slow cinema and contemplative style",
                    "Global art-house branding",
                ],
            ),
            (
                "Popular global industries",
                "The point is to study popular film industries with their own histories and logics.",
                [
                    "Bollywood, Nollywood, Korean cinema, and Chinese markets",
                    "Regional genres and stars",
                    "Cross-border remakes and co-productions",
                ],
            ),
            (
                "Migration, diaspora, and transnational identity",
                "Students analyze films that cross borders thematically and industrially.",
                [
                    "Exile, migration, and memory",
                    "Diasporic spectatorship",
                    "Language, hybridity, and belonging",
                ],
            ),
        ],
    ),
    (
        "Streaming and the Changing Industry",
        "Streaming reorganized film culture around platforms, algorithms, subscription libraries, data, global releases, and changing theatrical norms.",
        [
            (
                "Platform power",
                "Students learn how streamers shape financing, visibility, taste, and global circulation.",
                [
                    "Netflix, Amazon, Disney, Apple, and platform competition",
                    "Recommendation systems and datafication",
                    "Global originals and localization",
                ],
            ),
            (
                "Theatrical, festival, and release windows",
                "The gist is to track how release strategies changed in the platform era.",
                [
                    "Day-and-date release",
                    "Windowing and theatrical exclusivity",
                    "Festival acquisitions and streaming premieres",
                ],
            ),
            (
                "Labor, access, and cultural memory",
                "Students evaluate the consequences of digital abundance and platform control.",
                [
                    "Residuals, strikes, and creative labor",
                    "Catalog instability and disappearance",
                    "Accessibility, subtitling, dubbing, and global publics",
                ],
            ),
        ],
    ),
    (
        "Archives, Restoration, and Canon Formation in the Modern Era",
        "Modern film history depends on what is preserved, restored, subtitled, programmed, streamed, taught, and made available.",
        [
            (
                "Restoration and preservation",
                "Students learn how modern and digital cinema create new preservation challenges.",
                [
                    "Analog-to-digital restoration",
                    "Born-digital fragility",
                    "Color, sound, aspect ratio, and version choices",
                ],
            ),
            (
                "Archives and curatorial power",
                "The point is to understand institutions as active makers of film history.",
                [
                    "National archives, university archives, and private collections",
                    "Criterion, BFI, UCLA, LOC, and boutique distribution",
                    "Rights, access, and programming",
                ],
            ),
            (
                "Canon revision",
                "Students practice questioning inherited lists and syllabi.",
                [
                    "Women, Black, queer, Indigenous, and global canons",
                    "Festival and critic poll influence",
                    "Pedagogical selection and historical responsibility",
                ],
            ),
        ],
    ),
    (
        "Modern Film-History Research Capstone",
        "The capstone asks students to produce a historically grounded argument about modern or contemporary cinema using film analysis, sources, and context.",
        [
            (
                "Research design",
                "Students develop a focused question that can be answered with films, scholarship, criticism, archives, and industry evidence.",
                [
                    "Topic scope and case selection",
                    "Annotated bibliography and source map",
                    "Historical stakes and research contribution",
                ],
            ),
            (
                "Evidence and analysis",
                "The focus is on connecting film form to history rather than summarizing plots or movements.",
                [
                    "Sequence analysis",
                    "Reception and industry evidence",
                    "Comparative or transnational framing",
                ],
            ),
            (
                "Final paper and presentation",
                "Students communicate a polished argument for a film-studies audience.",
                [
                    "Clip or still-based oral presentation",
                    "Research paper with revision",
                    "Reflection on archive, canon, and method",
                ],
            ),
        ],
    ),
]

write_seed(
    "film-history-ii",
    "Film History II",
    DESC,
    "a1b2c3d4-5e6f-4a46-9c56-6d7e8f9a0b46",
    "fh2json",
    UNITS,
    "film_history_ii",
)
