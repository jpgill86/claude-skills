# Manifest fields, local install, and publishing

Sources: https://standardnotes.com/help/plugins/local-setup, https://standardnotes.com/help/plugins/publishing

## Manifest (`ext.json` locally / the published plugin JSON in production)

| Key | Required | Description |
|---|---|---|
| `identifier` | yes | Unique, reverse-domain-style identifier, e.g. `org.yourdomain.my-plugin`. |
| `name` | yes | Display name of the plugin. |
| `content_type` | yes | `"SN|Component"` for editors/stack/tag widgets, `"SN|Theme"` for themes. |
| `area` | yes | One of: `editor-editor`, `editor-stack`, `themes`, `note-tags`, `tags-list`. |
| `version` | yes | Current version. **Must match the `version` in the plugin's `package.json`** when published via a GitHub release zip. |
| `url` | yes | Where the app loads the plugin from. For components: an HTML file (defaults to looking for `index.html`). For themes: a CSS file directly. Used by web and mobile. |
| `description` | no | Shown in the Extensions browser. |
| `download_url` | no | Used by the **desktop** app. Must point to a `.zip`. See "Local Installation" below. |
| `latest_url` | no | Endpoint the app polls to check for/apply updates (autoupdate). Typically the same URL as your published manifest itself. |
| `marketing_url` | no | If set, Extensions manager shows an "Info" button linking here. |
| `thumbnail_url` | no | Image shown for the plugin in the Extensions manager. |
| `dock_icon` | no (themes) | See theme-css-variables.md — adds a colored circle indicator next to the theme name. |

Minimal local `ext.json` for a component:
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
If your entry file isn't `index.html` at the served root, point `url` at it directly, e.g. `http://localhost:8001/dist/index.html`.

## `package.json` `"sn"` block convention

Every package in the official monorepo mirrors its manifest into an `"sn"` object inside `package.json`, which is what the build/release tooling (and the `download_url` zip flow) reads from:

```json
{
  "name": "@standardnotes/simple-task-editor",
  "version": "1.6.17",
  "main": "dist/dist.js",
  "sn": {
    "name": "Checklist",
    "content_type": "SN|Component",
    "main": "dist/index.html",
    "area": "editor-editor",
    "spellcheckControl": true,
    "note_type": "task",
    "file_type": "md",
    "showInGallery": true
  },
  "dependencies": {
    "@standardnotes/component-relay": "..."
  }
}
```

Notable `"sn"` keys beyond the manifest fields above:
- `main` — relative path to the entry file inside the built/zipped package (overrides the desktop app's default `index.html`-at-root assumption). Also settable at top level as `"sn": { "main": "relative/path/to/index.html" }` per the "Local Installation" instructions — can be a `.css` path for themes.
- `spellcheckControl` — whether the editor exposes a spellcheck toggle.
- `file_type` — the underlying content format your editor works with: `'txt' | 'html' | 'md' | 'json'`. Required and safe to set — no special-case behavior like `note_type` below.
- `note_type` — ⚠️ **not just metadata — omit this unless you specifically want one of its side effects.** These both get published into the *runtime* manifest the app actually parses (not just internal build tooling), and the app hard-codes special handling for two of its values: declaring `"plain-text"` or `"super"` makes the app **always** render its own native editor for that note, silently ignoring your `editorIdentifier`, the moment a user converts an *existing* note to yours via "Change Note Type" (new notes created with your editor as default are unaffected — they never touch this field). Full explanation, plus which other values are safe: `known-issues-and-gotchas.md#1`.
- `showInGallery` — whether it's listed in the in-app plugin gallery.

## Local development

1. `npm install -g http-server`
2. In the plugin's root/build directory: `http-server -p 8001 --cors` (`--cors` required for the app's iframe to load it cross-origin).
3. Create `ext.json` (see above) in that same served directory.
4. Verify `http://localhost:8001/ext.json` loads correctly in a browser, and that the `url` value also loads correctly (should show the running plugin — the server looks for `index.html` by default).
5. In Standard Notes: **Extensions** (bottom-left corner) → **Import Extension** (bottom right of the Extensions window) → paste the `ext.json` URL → Enter.
6. Editors: activate via the Editor menu under the note title. Themes: activate directly from Extensions; no separate activation step per-note.
7. **Themes locally**: same flow, but `area: "themes"` and `url` points straight at the `.css` file, e.g. `http://localhost:8001/theme.css`.

## Publishing to production

The manifest JSON must be hosted somewhere reachable by the app. The docs' recommended path is **Listed** (https://listed.to), which turns a Standard Notes note into a hosted JSON/text endpoint:

1. Create a note named e.g. `my-plugin.json` with a Listed frontmatter block plus your manifest:
   ```
   ---
   metatype: json
   ---

   {
     "identifier": "org.yourdomain.my-markdown-editor",
     "name": "My Markdown Editor",
     "content_type": "SN|Component",
     "area": "editor-editor",
     "version": "1.0.0",
     "description": "...",
     "url": "https://domain.org/link-to-hosted-plugin",
     "download_url": "https://github.com/you/your-plugin/archive/1.0.0.zip",
     "latest_url": "https://listed.to/my-plugin-json-link",
     "marketing_url": "https://standardnotes.com/features/advanced-markdown",
     "thumbnail_url": "https://domain.org/editors/adv-markdown.jpg"
   }
   ```
2. Go to https://listed.to, click "Generate Author Link", copy it. In Standard Notes → Extensions → Import Extension → paste that author link → accept. (This links your account to Listed so it can publish notes.)
3. Back in the `my-plugin.json` note: **Actions** menu → **Publish to Private Link** → **Open Private Link** to get/preview the hosted JSON endpoint URL.
4. Import that endpoint URL the same way (Extensions → Import Extension) to install your own published plugin and confirm it works end-to-end.

You are not required to use Listed — any URL that serves the manifest JSON (and the plugin assets) works; Listed is just the path of least resistance for solo/small plugin authors without their own hosting.

**Alternative: GitHub Pages**, driven by a tag-triggered Actions workflow (build → generate the
production manifest JSON with the `version` from `package.json` → deploy `dist/` to Pages), is a
solid self-hosted option and avoids the Listed dependency entirely — but the `github-pages`
environment GitHub auto-creates the first time you enable Pages ("Source: GitHub Actions")
defaults to a deployment-branch policy that only allows `main`. A workflow triggered by `push:
tags:` will fail the deploy job immediately (empty step list) unless you add a deployment rule of
**type "Tag"** (pattern `v*` or similar) under Settings → Environments → `github-pages` first.

## Local (offline) installation via GitHub Releases — desktop app

The desktop app supports installing straight from a downloaded zip, driven by `download_url`:

1. In your plugin's GitHub repo: **Releases** → **Draft New Release** → **Publish release** (no assets needed — GitHub auto-generates a "Source code (zip)" archive).
2. Right-click "Source code (zip)" → Copy Link Address → use as `download_url` in your manifest.
3. The desktop app expects `index.html` at the zip's root by default. GitHub's auto-zip nests everything one folder deep; the desktop app automatically un-nests it.
4. If your entry file isn't at the root (or isn't named `index.html`, or is a `.css` file for a theme), add to `package.json` at the repo root:
   ```json
   {
     "sn": {
       "main": "relative/path/to/index.html"
     }
   }
   ```
   The zip must contain a `package.json` with at least a `version` key — this is also how the app cross-checks the manifest's `version` against the shipped code.

⚠️ **This only works if your repo root *is* the loadable plugin** (no build step). If your plugin
needs a bundler (Vite, webpack, etc.), GitHub's auto-generated source zip contains your unbuilt
`src/` files, not the compiled output, and won't load. Build your own zip in CI instead — zip your
actual build output directory (with `index.html`/`main.css` at its root, plus a `package.json`
containing at least `"version"`) and attach *that* as a release asset, pointing `download_url` at
the asset's URL rather than GitHub's auto-generated archive link.

## Autoupdate

Set `latest_url` to the same hosted manifest endpoint (e.g. your Listed private link) — the app periodically polls it and updates the plugin when the `version` field there is newer than the installed one.

## Questions

Discord `#dev` channel: https://standardnotes.com/discord
