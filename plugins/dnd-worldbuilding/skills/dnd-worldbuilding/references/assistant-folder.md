# The `_Assistant/` folder

The assistant's notebook, inside the user's vault. It is the **only** place the assistant may write. Its existence arms the write-guard hook for that vault. All files are plain Obsidian markdown; use `[[wikilinks]]` to the user's notes so everything is navigable.

```
_Assistant/
  Conventions.md
  Lore Digest.md
  Consistency Register.md
  Sessions/
    YYYY-MM-DD <topic>.md
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

A compact map so later sessions get expert fast. Not a source of truth. Always verify against the notes.

```markdown
# Lore Digest
**Last verified:** YYYY-MM-DD (re-read any note modified after this)

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

## Established naming patterns
<e.g. Cuetzpalli place names: Nahuatl roots, Spanish for badlands>

## Gaps (stubs and blank sections in the user's notes)
- [[Note]] → `# Heading` is empty
```

## Consistency Register.md

```markdown
# Consistency Register

## C-001 · open · contradiction
**Question for the user:** <what needs a decision>
- [[Note A]]: "<quoted text>"
- [[Note B]]: "<quoted text>"
**Why it matters:** <one line>
**Raised:** YYYY-MM-DD
```

Statuses: `open`, `resolved` (the user's notes now agree; say how), `accepted-tension` (user says leave it, e.g. an in-world unreliable account), `stale` (a source note changed and the issue no longer applies). Severity labels are in [consistency.md](consistency.md). Never delete entries; change status. Re-check open entries each session.

## Sessions/YYYY-MM-DD <topic>.md

```markdown
# <Topic>
**Date:** YYYY-MM-DD · **Notes consulted:** [[A]], [[B]]

## Recap of relevant canon
…

## Decisions (user's words, not canon until in their notes)
- ✅ Accepted: …
- ❌ Rejected: … *(why)*
- ⏸ Deferred: …

## Ideas floated but not chosen
…

## Open threads / questions for next time
…

## Consistency flags raised
- C-00N
```

## Drafts/<Name>.md

Copy-ready notes in the vault's own style: look at sibling notes first and match their frontmatter (`aliases`), heading structure, bolding of the entity's name in the opening line, and piped wikilinks. Mark clearly as a draft:

```markdown
---
assistant-draft: true
proposes: new note | addition to [[Existing Note]]
drafted: YYYY-MM-DD
aliases: []
---
> [!info] Draft for review. Not canon. Edit and move into your notes yourself.

<note text>
```

For additions to an existing note, say which heading it belongs under and quote the surrounding text. Keep unresolved questions visible as `> [!question]` callouts, the same way the user does.
