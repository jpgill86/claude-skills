# The `_Assistant/` folder

The assistant's notebook, inside the user's vault. It is the **only** place the assistant may write. Its existence arms the write-guard hook for that vault. All files are plain Obsidian markdown; use `[[wikilinks]]` to the user's notes so everything is navigable.

```
_Assistant/
  Conventions.md
  Lore Digest.md
  Decisions.md
  Consistency Register.md
  Sessions/
    YYYY-MM-DD.md          (one file per day, a ## section per topic)
  Drafts/
    <Proposed note name>.md
```

Announce every write in one line. Never copy a user note wholesale into this folder; link to it.

## Conventions.md

Per-vault configuration. The user may edit it, and it always wins over your assumptions.

```markdown
# Conventions
*Confirmed with the user on YYYY-MM-DD. Edit freely.*

## Source tiers
- **Canon:** <folders / notes>
- **Idea pool (non-canon):** <folders / notes>
- **Not lore:** <rules PDFs, media, templates, excalidraw>
- **Rejected markers:** <e.g. ~~strikethrough~~>; never resurrect unless asked
- **Dated entries:** <e.g. "4/17:" prefixes; later entries may supersede earlier ones>

## Player-facing
- <tags / notes whose content the players have seen, e.g. #handout, Session 0>

## Tone & themes
<from the campaign frame>

## Naming
- <language / style per culture, source dictionaries, pronunciation format>

## Rules
- <ruleset, edition, where the SRD lives>
```

## Lore Digest.md

A compact map so later sessions get expert fast. Not a source of truth. Always verify against the notes. Decisions live in `Decisions.md`, not here.

```markdown
# Lore Digest
**Last verified:** YYYY-MM-DD HH:MM (re-read any note modified after this; update the stamp whenever the check runs)

## Premise
<2-4 sentences>

## Timeline
| When | Event | Source |
|---|---|---|
| ~N years ago | … | [[Note]] |

## Entities
| Name | Aliases | Kind | One-line summary | Source |
|---|---|---|---|---|

## Who knows what
- **Secret (DM only):** …
- **Player-known:** …
- **In-world rumour / belief (may be false):** …

## Reveal plan
| Secret | DM-only source | How / when players learn it | Clues placed |
|---|---|---|---|
| … | [[Note#Heading]] | … | 1. … 2. … 3. … |

Player-facing text is checked against this table before you offer it.

## Established naming patterns
<e.g. Cuetzpalli place names: Nahuatl roots, Spanish for badlands>

## Gaps (stubs and blank sections in the user's notes)
- [[Note]] → `# Heading` is empty

## Not read
- <source> — <reason> — <YYYY-MM-DD>   (e.g. "SRD 5.2 PDF: pdftoppm missing, 2026-10-11"; retry once per session, remove the line when it works)
```

## Decisions.md

The single home for decisions. Session logs, the register, and the digest point here instead of repeating them. Entries are **not canon**: each one records "the user said X on this date" until the user's notes agree.

```markdown
# Decisions

## D-017 · pending · YYYY-MM-DD
**Decision:** <one line, in the user's words>
**Belongs in:** [[Note#Heading]]
**From:** [[Sessions/YYYY-MM-DD#Topic]]
**Ripples:** <canon / mechanics / player-facing effects, or "none">
**Unverified:** <rules or setting claims from memory that this relies on, if any>
```

| Status | Meaning |
|---|---|
| `pending` | Decided, not yet in the user's notes |
| `partly-migrated` | Some of it is in the notes; say what is missing |
| `migrated` | In the notes; say where |
| `deferred` | The user postponed it (replaces the old ⏸ lists in session logs) |
| `kept-unwritten` | Decided, but the user does not intend to write it into notes (e.g. a fact that only matters at the table) |
| `reversed` | The user changed their mind; link the entry that replaces it |
| `dropped` | No longer applies |

At session start, re-read the target note for each `pending` and `partly-migrated` entry, update its status, and announce changes in one line. Skip the other statuses; mention `deferred` entries in the recap when their topic comes up. Never delete entries.

Only enter decisions the user actually made. Your own suggestions go in the session log's "Ideas floated", not here.

## Consistency Register.md

Open entries on top; resolved ones below as folded callouts, so they stay searchable but collapsed.

```markdown
# Consistency Register

## Open

### C-001 · open · contradiction
**Question for the user:** <what needs a decision>
- [[Note A]]: "<quoted text>"
- [[Note B]]: "<quoted text>"
**Why it matters:** <one line>
**Raised:** YYYY-MM-DD

## Resolved

> [!success]- C-004 · resolved · tension
> **How:** <what the user's notes now say, or the D-ID that settled it>
> **Raised:** YYYY-MM-DD · **Closed:** YYYY-MM-DD
```

Statuses: `open`, `resolved` (the user's notes now agree; say how), `accepted-tension` (user says leave it, e.g. an in-world unreliable account), `stale` (a source note changed and the issue no longer applies). Everything but `open` goes under Resolved. Severity labels are in [consistency.md](consistency.md). Never delete entries; change status and move them. Re-check open entries each session.

## Sessions/YYYY-MM-DD.md

One file per day. A later sitting the same day appends new `##` sections to the same file; a sitting that runs past midnight stays in the file it started in.

```markdown
# YYYY-MM-DD

## <Topic>
**Notes consulted:** [[A]], [[B]]

### Recap of relevant canon
…

### Decisions
- D-017, D-018 *(details in [[Decisions]])*
- ❌ Rejected: … *(why)*

### Ideas floated but not chosen
…

### Open threads / questions for next time
…

### Parked
<extra options and side ideas kept out of the chat reply>

### Consistency flags raised
- C-00N
```

## Drafts/<Name>.md

Copy-ready notes in the vault's own style: look at sibling notes first and match their frontmatter (`aliases`), heading structure, bolding of the entity's name in the opening line, and piped wikilinks.

One draft per topic. To revise, read the file first, treat any edits the user made as current, and **append** a dated revision section rather than replacing text. Do not create `X v2.md`. Never delete drafts.

```markdown
---
assistant-draft: true
status: draft            # draft | applied | partly-applied | superseded
updated: YYYY-MM-DD
for: "[[Target Note]]"   # or "new note"
based-on: [D-012, D-017]
superseded-by: "[[…]]"   # only when superseded
---
> [!info] Draft by the assistant, not canon. Edit and move into your notes yourself.

<note text>
```

Body conventions: `> [!warning] DM only` around secrets, `> [!todo]` / `> [!question]` for gaps (the same way the user marks open questions). For additions to an existing note, say which heading it belongs under and quote the surrounding text.

**Sweep** at session start and at wrap-up: compare each draft that is not `applied` or `superseded` with its `for:` note, update `status`, and list drafts still waiting at wrap-up.

## Migration checklist

Written to chat; if long, also to `Drafts/Migration checklist.md` (same draft rules). Built from `pending` and `partly-migrated` decisions plus drafts that are `draft` or `partly-applied`.

- Group by note; within each note: **Core rewrites**, **Smaller edits**, **Optional**.
- Tag each item `decided (D-NNN)` or `suggestion`.
- Each item gives the target as a heading anchor (`[[Note#Heading]]`), the **quoted existing text** to find, and the new text. **Never use line numbers**; they go stale as the user edits.
- End with **Undecided gaps**: questions the user still has to answer, not edits.

## Moving an existing vault to this layout

If `_Assistant/` exists but has no `Decisions.md`, **ask once** before migrating. If the user agrees:

1. Build `Decisions.md` only from decisions the user clearly made. Old logs mix the user's decisions with your suggestions; ask when unclear. Set each status by checking the user's notes.
2. Add the draft frontmatter above to existing drafts.
3. Reorder the register into Open and Resolved.
4. Add Reveal plan and Not read to the digest, and make "Last verified" a timestamp.

Announce each step in one line. Delete nothing; leave old session logs as they are.
