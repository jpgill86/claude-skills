---
name: standard-notes-plugins
description: Build, test, and publish Standard Notes plugins (editors, editor-stack components, note-tags/tags-list widgets, themes). Use when creating a new Standard Notes plugin, working in a repo with an ext.json or a package.json "sn" block, wiring up @standardnotes/component-relay, writing theme CSS against --sn-stylekit-* variables, or publishing a plugin via Listed.to / GitHub Releases.
---

# Standard Notes Plugins

## What a plugin is

A Standard Notes plugin is two things, both hosted somewhere the app can reach over HTTP(S):

1. A JSON **manifest** — `ext.json` locally, or a note named e.g. `my-plugin.json` published via [Listed.to](https://listed.to) in production — describing `identifier`, `name`, `content_type`, `area`, `version`, `url`, etc.
2. Static, self-contained web assets: an `index.html` (+ JS bundle) for components, or a single `.css` file for themes.

The app fetches the manifest, then loads `url` — in an iframe for components, as a `<link>` for themes. Components talk to the host app **exclusively** via `postMessage`, wrapped by the `@standardnotes/component-relay` npm package. There is no other API surface — no REST API, no direct database access.

## Two plugin kinds

- **Component** (`content_type: "SN|Component"`) — editors, editor-stack panels, note-tags widgets, tags-list widgets. Runs as an iframe with JS.
- **Theme** (`content_type: "SN|Theme"`) — a CSS file overriding `--sn-stylekit-*` custom properties. No JS; works automatically on mobile.

`area` determines where it mounts — one of: `editor-editor`, `editor-stack`, `themes`, `note-tags`, `tags-list`.

## Study existing plugins first

The single best source of truth is the official monorepo — find a package similar to what you're building and read it before writing code:
https://github.com/standardnotes/plugins/tree/main/packages

- Small, readable editor: `org.standardnotes.simple-task-editor`
- CSS-only theme: `com.sncommunity.dracula-theme`
- Feature-rich editor: `org.standardnotes.advanced-markdown-editor`

Every package's `package.json` has an `"sn"` block that mirrors the manifest fields (see `references/manifest-and-publishing.md`). Packages build with webpack (`webpack.dev.js` → `start`, `webpack.prod.js` → `build`) and depend on `@standardnotes/component-relay`.

⚠️ The `sn-extensions/react-blank-slate` starter that the official "Introduction to plugins" doc links to is **stale** (React 15, `sn-components-api` v1, Babel 6, moved to `standardnotes/react-blank-slate`). Prefer cloning/adapting a current package from the monorepo above instead of that starter.

## Component ↔ host communication (`@standardnotes/component-relay`)

```js
import ComponentRelay from '@standardnotes/component-relay'

const relay = new ComponentRelay({
  targetWindow: window,
  onReady: () => { /* safe to call relay methods now */ },
  // Full-pane editor (area: "editor-editor"): return undefined, don't compute
  // a height — see references/known-issues-and-gotchas.md#3 for why.
  // Editor-stack widgets DO need a real value, e.g. document.body.scrollHeight.
  handleRequestForContentHeight: () => undefined,
})

relay.streamContextItem((note) => {
  // note.isMetadataUpdate === true means only metadata changed (not content) — usually skip these
  // note.content.text is the note body; note.content.<anything> for editor-specific custom fields
})

relay.saveItemWithPresave(note, () => {
  note.content.text = newText
  note.content.preview_plain = 'short preview'   // shown in the notes list
  note.content.preview_html = '<div>...</div>'   // used by editor-stack components
})
```

Full method list — `streamItems`, `createItem`/`createItems`, `deleteItem`/`deleteItems`, `getComponentDataValueForKey`/`setComponentDataValueForKey`/`clearComponentData`, `setSize`, `platform`/`environment` getters, `isRunningInDesktopApplication`/`isRunningInMobileApplication`, `getItemAppDataValue`, `sendCustomEvent` — is in `references/component-relay-api.md`. Read it before implementing anything beyond a trivial editor.

Key behaviors to know:
- Saves are debounced ~250ms and coalesced by default; `streamContextItem` flushes any pending save immediately when the context item changes to a different note, so don't fight the debouncer — just call `saveItem*` on every change.
- `getComponentDataValueForKey`/`setComponentDataValueForKey` store small per-component preferences scoped to that component instance (e.g. "has the user dismissed onboarding"), **not** note content.
- Origin-checking against the parent window happens automatically inside the relay — *in theory*. ⚠️ The npm-published package has a real, currently-unpatched bug here that breaks the entire host connection on Android (and reportedly Electron desktop) with no thrown error you'd notice. It requires a runtime patch. Full writeup + the patch + why a naive fix makes it worse: `references/known-issues-and-gotchas.md#2`.
- ⚠️ **Do not set `note_type: "plain-text"` or `"super"` in your manifest** unless you've read why first — it silently breaks "Change Note Type" for existing notes while looking like it works for new ones. `references/known-issues-and-gotchas.md#1`.

## Local development loop

1. `npm install -g http-server`
2. From the plugin's served root (build output dir): `http-server -p 8001 --cors` — `--cors` is required or the app's iframe load will be blocked.
3. Create `ext.json` at that served root:
   ```json
   {
     "identifier": "org.yourdomain.my-plugin",
     "name": "My Extension",
     "content_type": "SN|Component",
     "area": "editor-editor",
     "version": "1.0.0",
     "url": "http://localhost:8001"
   }
   ```
   For a theme: `content_type: "SN|Theme"`, `area: "themes"`, `url` pointing straight at the compiled `.css` file.
4. Sanity check by opening `http://localhost:8001/ext.json` in a browser.
5. In the Standard Notes app: **Extensions** (bottom-left) → **Import Extension** → paste `http://localhost:8001/ext.json` → Enter.
6. Activate: components run via the note's Editor menu (or automatically for stack/tag areas); themes apply immediately once activated.

Full manifest field reference and the production publishing flow (Listed.to, GitHub Releases zip + `download_url`, `latest_url` autoupdate, `package.json` `"sn.main"` override for non-root entry files) is in `references/manifest-and-publishing.md`.

## Theme CSS variables

Themes override `--sn-stylekit-*` root variables (colors, fonts, spacing) plus an optional set of component-specific overrides (`--editor-*`, `--navigation-*`, `--items-column-*`, etc.). Full variable list with default values, the `dock_icon` manifest field for a colored circle indicator, and links to the official client's source-of-truth SCSS: `references/theme-css-variables.md`.

## Known issues and gotchas

Before debugging something that "should just work," check `references/known-issues-and-gotchas.md`
— it covers real, non-obvious traps found while building and shipping a component across web,
desktop, and mobile: the `note_type` manifest trap, a real unpatched bug in the published
component-relay npm package (breaks Android/Electron silently), `handleRequestForContentHeight`
guidance, an on-screen diagnostic pattern for mobile (where devtools aren't available and some
failures never throw), a live-theme-update limitation that isn't your plugin's fault, why sparse
"Remote" note history isn't a plugin bug, CodeMirror 6-specific pitfalls (including a padding
gotcha that's the exact same root cause as the cursor-color one — a CSS change can silently do
nothing at all), Plain Text's actual padding/font-size values for a seamless note-type toggle, why
offline support for remotely-loaded plugins is currently broken on Android by iframe sandboxing
(a platform limitation, not something fixable from your own code — includes the exact error text
to recognize it and links to the upstream discussion), and two CI/release gotchas (GitHub Pages
deploy-on-tag environment policy; building your own desktop-install zip).

## Getting unstuck

**Search `standardnotes/forum`'s Issues tab *before* deep-diving independently, especially for
anything that smells like a platform/mobile limitation rather than a bug in your own code.**
`standardnotes/app` (the main repo) has GitHub Issues disabled entirely and its description points
here instead — `standardnotes/forum` is a real GitHub repo whose Issues tab **is** the actual
community bug tracker/support forum (`gh search issues "<terms>" --repo standardnotes/forum`, or
`gh issue list --repo standardnotes/forum`). It goes back to 2018 and has real technical
back-and-forth from the SN team on exactly the kind of thing you'd otherwise spend hours
reverse-engineering yourself — mobile offline-editor limitations (gotcha #10) were independently
discussed there years before being rediscovered the hard way while building sn-bujo; checking first
would have saved that entire investigation. If you do end up with a novel finding (a precise root
cause an existing thread doesn't have, or confirmation across a different plugin), commenting on
the existing issue is more useful to the community than a fresh one — check for a match first.

- Forum / real bug tracker (GitHub Issues, searchable): https://github.com/standardnotes/forum/issues
- Forum (same thing, friendlier URL): https://standardnotes.com/forum
- Discord `#dev` channel: https://standardnotes.com/discord
