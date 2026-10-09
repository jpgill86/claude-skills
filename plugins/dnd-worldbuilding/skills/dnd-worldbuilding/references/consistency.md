# Consistency checking

Self-consistency of the fiction matters a lot to this user. Check *before* offering a suggestion, and run a full audit when asked.

## What to check

| Category | Examples |
|---|---|
| **Timeline arithmetic** | "70 years ago" vs "a century ago"; lifespans vs generations ("three generations" at 70 years); who could still be alive to remember an event |
| **Names & aliases** | Same entity under different names (check `aliases`); spelling drift; two things sharing a name; a secret true name used by someone who shouldn't know it |
| **Geography** | Distances, travel time, terrain, directions, what's near water/caves; map notes vs prose |
| **Cosmology & rules of the world** | Gods' domains and prior acts, planar logic (e.g. what killing an aboleth does), how magic works here, what the curse/disease/etc. can and cannot do |
| **Causality & motive** | Does the villain's plan follow from what it knows and can do? Why hasn't someone done X already? |
| **Who knows what** | Secrets vs rumours vs player-facing handouts; an NPC acting on information they couldn't have |
| **Population & ecology** | Numbers, food, predators, how a culture survives under the stated threat |
| **Culture & belief** | Factions' stated beliefs vs their customs; religious practice vs the god's established nature |
| **Lore vs mechanics** | CR/stat plausibility for what's described; spell or ability that would trivialise the premise |
| **Tone & theme** | Suggestion clashes with the campaign's stated tone/themes/touchstones |

## Severity

- **Contradiction**: two canon statements cannot both be true. Needs a decision.
- **Tension**: canon vs idea-pool, or two statements that can both be true only with an explanation. Not an error; mention and offer to explore.
- **Ambiguity**: unclear or underspecified; the notes allow several readings.
- **Gap**: stub, blank heading, or unanswered `[!question]`; something the world needs but doesn't have yet.

## Tiers matter

- Check suggestions against **canon** strictly.
- Idea-pool notes are tentative by the user's own declaration. Don't "correct" them; note tensions only when relevant to the topic.
- Struck-through or superseded text (later dated entries replacing earlier ones) is not live. Read it for history only.
- In-world accounts can be wrong on purpose. If a note records what a culture *believes* (a myth, a sermon, a rumour), a mismatch with the "true" history may be intentional. Ask before flagging as a contradiction.

## Reporting

Inline, brief, with evidence:

> ⚠ **Contradiction.** [[Cuetzpalli]] says the empire fell 70 years ago, but [[Pelag'katl]] says "a century ago" the cenote opened and … Which timeline do you want?
> - [[Note A]]: "…quote…"
> - [[Note B]]: "…quote…"

Then log it in `Consistency Register.md` (format in [assistant-folder.md](assistant-folder.md)). Don't repeat an already-registered open flag at length; just reference its ID. Offer resolutions only if the user asks, and give more than one.

For a full **audit**: read all canon, build the digest timeline/entities as you go, list findings grouped by severity, and ask which to tackle first. Don't fix anything.

## Be careful not to

- Invent contradictions from your digest instead of the source text. Re-read the source before flagging.
- Treat your own earlier suggestions or session logs as canon.
- Flag stylistic variation (e.g. "lizardfolk" vs "Cuetzpalli") when `aliases` show they are the same entity.
