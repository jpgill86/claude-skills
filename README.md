# claude-skills

A personal [Claude Code](https://claude.com/claude-code) plugin marketplace. This repo is both the
marketplace catalog and the home of the plugins it lists, so adding it on a new machine takes one
command and installing anything from it takes one more.

## Install

```sh
claude plugin marketplace add jpgill86/claude-skills
claude plugin install standard-notes-plugins@jpgill86-skills
```

Or interactively from inside Claude Code, with `/plugin`.

## Available plugins

| Plugin | What it's for |
|---|---|
| [`standard-notes-plugins`](plugins/standard-notes-plugins) | Building, testing, and publishing [Standard Notes](https://standardnotes.com) plugins — editors, editor-stack components, note-tags/tags-list widgets, and themes. Includes a hard-won [known issues and gotchas](plugins/standard-notes-plugins/skills/standard-notes-plugins/references/known-issues-and-gotchas.md) reference covering silent, platform-specific failures that cost real debugging time to find. |

## Updating

Changes pushed here reach an installed machine via:

```sh
claude plugin marketplace update jpgill86-skills
claude plugin update standard-notes-plugins@jpgill86-skills
```

The `@jpgill86-skills` suffix on `plugin update` is required, not optional — the bare plugin name
fails with `Plugin "standard-notes-plugins" not found`, which reads like the plugin is missing
rather than like a syntax problem.

Restart Claude Code to apply. Marketplaces also refresh on their own in the background, so this is
mainly for pulling a change immediately.

No plugin declares a `version`. For a git-sourced plugin the commit SHA *is* the version, so every
push is picked up automatically. A declared-but-forgotten version bump silently blocks updates,
which is a failure mode with no visible symptom — not worth the risk for a personal collection. If
tagged releases are ever wanted, `claude plugin tag` creates a `{name}--v{version}` tag and
validates that `plugin.json` and the marketplace entry agree.

## Editing a skill

The installed copy under `~/.claude/plugins/` is managed by Claude Code — don't edit it directly,
since the next update will overwrite it. Edit the copy in this repo, push, then update as above.

## Adding another plugin

1. Create `plugins/<name>/.claude-plugin/plugin.json` with at minimum a `name`.
2. Put the actual content at the plugin root — `skills/<skill-name>/SKILL.md`, and/or `commands/`,
   `agents/`, `hooks/`. Only `plugin.json` belongs inside `.claude-plugin/`.
3. Add an entry to [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) with
   `"source": "./plugins/<name>"`.
4. Validate before pushing:
   ```sh
   claude plugin validate .
   claude plugin validate ./plugins/<name>
   ```
   Expect one warning per plugin about the missing `version` — that's the deliberate choice
   described above, and it's why `--strict` (which promotes warnings to errors) isn't used here.
   Anything *else* it reports is a real problem worth fixing.

Give each skill an explicit `name:` in its frontmatter. Without one it inherits the directory name
at install time, which can drift across updates.

### Why one repo instead of one repo per skill

A marketplace is added once per machine; a plugin is installed selectively from it. Separate repos
per skill wouldn't remove the need for a marketplace — it would just mean adding one marketplace
per skill on every machine, for no benefit.

The choice is also reversible. If a skill outgrows this repo and wants its own issues and stars,
move the directory out and change its `source` from `"./plugins/foo"` to
`{"source": "github", "repo": "jpgill86/foo"}`. Anyone who installed it re-resolves on the next
marketplace update without re-adding anything.

## License

[MIT](LICENSE)
