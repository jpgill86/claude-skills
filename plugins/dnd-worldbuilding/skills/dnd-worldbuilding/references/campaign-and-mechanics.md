# Campaign planning, player knowledge, mechanics, naming

## Arc and session planning

Same rhythm as [facilitation.md](facilitation.md): ask first, offer options when stuck. Useful questions and structures:

- **Premise to play.** What do the PCs want in the first session? What do they lose if they do nothing? Check the campaign frame's pitch, tone, and themes.
- **Central question.** What tension drives the arc? (The user may have written one in Ideation.) What can "people of action" actually *do* about it?
- **Secrets & clues.** List the secrets the arc will reveal. For each important secret, ensure **at least three independent clues** pointing to it, in different places and forms (NPC, location, object, rumour, event), so one missed clue doesn't stall play.
- **Fronts / clocks.** What does each major antagonist or faction do while the PCs are elsewhere? Give each a short ladder of steps that advance on a timer or on PC inaction.
- **Faction intersections.** Which factions will the PCs meet in this arc? What does each offer or demand? Where do their goals collide?
- **Locations & hooks.** Which places carry the arc (hexes, dungeons, towns)? What's the hook into each? Lean on existing map/notes.
- **Pacing.** Mix of exploration, social, combat, mystery, and rest. Where's the first reveal, midpoint turn, and climax? Where can players choose?
- **Failure and flexibility.** What happens if the PCs fail, skip, or surprise you? Keep plans as options, not rails.
- **Session 0 and handouts.** What have the players been told? Anchor the opening to it.

Write arc outlines as session-log content and/or drafts in `_Assistant/`. They are plans, not canon.

## Player knowledge

Many vaults mix DM secrets with player-facing material. Use the vault's markers (e.g. `#handout`, Session 0, a campaign frame the players saw) recorded in `Conventions.md`.

- Track in the digest what is **secret**, **player-known**, and **in-world belief**, and keep its **Reveal plan** table (secret, DM-only source, how/when players learn it, clues placed) current.
- **Player-facing material mode** (Session 0 text, handouts, rumours): draft in a separate file marked player-facing, never include `[!warning] DM only` content, and run the spoiler check against the Reveal plan by default.
- When the user plans a handout, rumour, NPC dialogue, or reveal, check it for **leaks**: does it state a secret, name a hidden entity by its true name, or contradict what players were told?
- When players were told something in a handout, treat it as fixed from their perspective, even if it's incomplete or in-world false. Ask before contradicting it.
- Flag leaks and spoilers plainly, with the source note and the sentence at issue.
- Don't paste DM secrets into anything player-facing. Draft handouts separately, clearly marked.

## Mechanics

Consult the ruleset the user names in `Conventions.md` (often an SRD PDF under `Rulesets/`). Try Read on the PDF by page range once per session and cite pages. If it fails (e.g. `pdftoppm` is missing), don't try scripts or converters; the hook blocks them anyway. Offer instead: (a) the user pastes the pages you name, (b) the user puts the text in a markdown note under `Rulesets/`, or (c) you use a cited web source such as the online SRD. Record the failure in the digest's **Not read** line (source, reason, date) and retry next session.

Don't rely on memory for exact rules text. Anything you state from memory (age bands, lifespans, which book a creature comes from) is **unverified (from memory)** until checked against one of those sources; say so, and list it in the ledger entry's **Unverified:** field if a decision rests on it. If the edition is ambiguous (2014 vs 2024), ask.

- **Creatures:** suggest a base stat block from the SRD, then modifications. Check CR plausibility against the fiction: a "sickly" ancient horror and its CR should agree with the story.
- **Encounters:** consider party level, number, resources, environment. Offer options (tougher/easier), and note when mechanics undermine the premise (e.g. a spell that bypasses a core threat; ask how the world handles it).
- **Magic items / hazards / tables:** tie to the world's themes and established materials. Keep them distinct from SRD verbatim text when drafting; paraphrase and cite.
- **Random tables:** if the user has a tables note, match its dice and format. Offer entries as suggestions for them to adopt.
- Mark all mechanical content as a suggestion, same as lore.

## Naming and language

- Read the naming conventions in `Conventions.md` and look at existing names in the vault. Infer patterns (language roots, syllable shapes, how places vs. people are named).
- Offer 4-8 name candidates with meaning, source (dictionary link if the user's notes use them), and pronunciation if the vault gives IPA. Show the user's own format.
- Check each candidate against existing names for collisions or accidental resemblance to unrelated entities or real-world meanings. Be honest about uncertainty in a language: say when you're guessing at morphology, and recommend verifying in the dictionary the vault already cites.
- For real-world-inspired cultures, favour respectful, grounded detail over caricature, and say when something is a loose inspiration rather than an accurate reflection.
- Names are suggestions: the user picks.
