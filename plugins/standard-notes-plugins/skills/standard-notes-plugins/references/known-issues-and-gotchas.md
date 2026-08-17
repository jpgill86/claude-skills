# Known issues and gotchas (learned the hard way)

Everything in this file was discovered by building and shipping a real editor component (a
CodeMirror-based plain-text editor) across web, desktop (Electron), and mobile (Android). Some of
these cost multiple release cycles to track down because the failures were silent (no thrown
error) or only reproduced on one platform. Read this before you assume something "isn't working
because of my code" — check here first.

## 1. Never declare `note_type: "plain-text"` or `"super"` in your manifest

This is the single most costly trap: it looks like harmless categorization metadata, but it
actively breaks your editor.

**What goes wrong**: with `note_type: "plain-text"` declared, using the app's "Change Note Type"
menu to convert an *existing* note to your editor appears to succeed (you may even see a preview
render correctly) but silently reverts to the native Plain Text editor — every time, no error, no
indication anything went wrong. Meanwhile, setting your editor as the *default* for **new** notes
works perfectly fine, which makes the bug even more confusing (it looks intermittent when it's
actually 100% deterministic based on which code path the app takes).

**Root cause**: the app's `EditorForNoteUseCase.execute()` (in `standardnotes/app`,
`packages/snjs/lib/Services/ComponentManager/UseCase/EditorForNote.ts`) starts with:
```js
if (note.noteType === NoteType.Plain) {
  return new UIFeature(GetPlainNoteFeature())   // always the native editor, full stop
}
if (note.noteType === NoteType.Super) {
  return new UIFeature(GetSuperNoteFeature())   // same, for the native rich editor
}
```
`note.noteType` gets set from your manifest's `note_type` whenever the "Change Note Type" menu
commits a switch — `application.changeAndSaveItem.execute(note, mutator => { mutator.noteType =
uiFeature.noteType; mutator.editorIdentifier = uiFeature.featureIdentifier })`. If your manifest's
`note_type` maps to the enum value `Plain` (`"plain-text"`) or `Super`, that first check wins
unconditionally and `editorIdentifier` — the thing that's actually supposed to select *your*
editor — is never even consulted. New-note creation with a default editor never touches
`noteType` at all, which is why only the "convert an existing note" path is affected.

**The fix**: just don't declare `note_type` unless you deliberately want one of the *other* enum
values (`task`, `markdown`, `code`, `rich-text`, `authentication`, `spreadsheet` — these aren't
special-cased and correctly fall through to `editorIdentifier`-based resolution). If your editor
operates on plain text and doesn't map cleanly onto one of those categories, omitting the field
entirely is correct — the note's `noteType` resolves to `unknown`, which is *not* special-cased,
and `editorIdentifier`-based resolution works as expected. `file_type` (which controls the
"may not display correctly" conversion warning and is a **separate, required, unrelated** field —
`'txt' | 'html' | 'md' | 'json'`) is unaffected and should still be set normally.

If a note somehow already got stuck with a bad `noteType`, redoing the "Change Note Type"
conversion after fixing your manifest and reinstalling the extension resolves it — the mutation
happens fresh from the corrected manifest every time you convert.

## 2. `@standardnotes/component-relay` has a real, currently-unpatched bug affecting Android and Electron

**Symptom**: your component loads and renders (CodeMirror/whatever UI toolkit initializes fine,
since that's all local), but the host connection never completes — `streamContextItem` never
delivers a note, saves never take effect, and (this is the deceptive part) **nothing throws or
logs an error you'd notice** unless you're specifically watching for it. Confirmed to affect
Android (WebView-hosted) and, per user testing, the desktop Electron app too — anywhere the host
page's origin, as seen by your iframe, isn't a normal `https://` origin.

**Root cause**: the actual *published npm package* (`2.2.2` was the newest version as of writing
— check `npm view @standardnotes/component-relay versions` for whether this has since shipped a
fix) has this in its compiled `postMessage`:
```js
this.contentWindow.parent.postMessage(o, this.component.origin)   // no fallback
```
`this.component.origin` is set from the *first* incoming message's `event.origin`. On platforms
where the host page doesn't have a real HTTP(S) origin (Android's WebView, apparently some
Electron configurations), that's the literal string `"null"`. Browsers throw a synchronous,
**uncaught** `SyntaxError: Failed to execute 'postMessage' on 'Window': Invalid target origin
'null'` for that — and because this happens *inside* `onReady()` (which flushes the queued
`streamContextItem` request as its first act), the exception aborts the rest of `onReady()`,
including the call to *your* `onReady` callback. So you don't even get a "ready" signal to notice
something broke.

The upstream GitHub repo (`main` branch) has fixed this — falls back to `'*'` when origin is falsy
or the string `"null"` — but as of writing that fix has never been published to npm. **Always
diff what's actually in `node_modules/@standardnotes/component-relay/dist/dist.js` against what
you're reading on GitHub before trusting GitHub source for debugging** — they can and do diverge.

**The fix — patch it yourself, and get the scoping right**:
```js
import ComponentRelay from '@standardnotes/component-relay'

const originalPostMessage = ComponentRelay.prototype.postMessage
ComponentRelay.prototype.postMessage = function patchedPostMessage(...args) {
  const realOrigin = this.component.origin
  const needsFallback = !realOrigin || realOrigin === 'null'
  if (needsFallback) this.component.origin = '*'
  try {
    return originalPostMessage.apply(this, args)
  } finally {
    if (needsFallback) this.component.origin = realOrigin   // <- the part that's easy to get wrong
  }
}
```
**Critical, non-obvious detail**: `this.component.origin` isn't only read when *sending*. The
library's own incoming-message handler also compares every future message's `event.origin`
against this same stored value to decide whether to accept it (`else if (e.origin !==
this.component.origin) return`). A naive first attempt at this patch — permanently overwriting
`this.component.origin = '*'` the first time a bad value is seen — fixes the immediate crash but
then silently drops *every subsequent incoming message*, since a real event origin never equals
the literal string `'*'`. That's a worse bug than the one it replaced, and it won't throw either.
Only substitute the value for the duration of the one outgoing call, then restore the real
original (even if that's `"null"`) immediately after.

Write a unit test for both directions of this contract (fallback applied + origin restored
afterward; real origins left untouched) — it's cheap insurance against reintroducing exactly this
regression, and it *will* catch a naive fix.

## 3. `handleRequestForContentHeight` — return `undefined` for full-pane editors

For a full-pane `area: "editor-editor"` component that fills its own container (`height: 100%` +
internal scrolling), you don't need or want the host resizing the iframe to fit content — that's
what `editor-stack` widgets need (they're inline items in a list). Returning a computed
`document.body.scrollHeight`-based value from a full-pane editor is at best a no-op on
desktop/web and at worst (per one Android test session) contributes to the host mis-sizing the
native WebView container, producing a visually blank editor for any note with real content while
empty notes render fine (the height value only gets large enough to matter once there's content).
Match what official full-pane-style components do (e.g. `com.sncommunity.advanced-checklist`
returns `undefined` unconditionally) rather than reaching for a computed value by default.

## 4. Build in on-screen diagnostics from day one if you'll ever test on mobile

There is no devtools/remote-debugging story that's always available on mobile, and — per gotcha
#2 above — some real failures never throw an exception, so `window.onerror` alone isn't enough.
The pattern that actually worked for finding #2:

- A rolling **milestone trace** (plain text, appended to a `<div>` in the corner): log each stage
  of your host-connection handshake (`constructed`, `stream-requested`, `ready`, `item-received`,
  etc.) as it happens. Whatever stage never appears is exactly where the connection broke.
- Also catch `window.addEventListener('error', ...)` and `('unhandledrejection', ...)` and append
  those to the same trace.
- A **save-status indicator** ("Saving…" → "Saved HH:MM:SS", the latter only after the host's
  save callback actually fires) — this catches saves that silently never reach the host, which
  looks identical to "working" from the UI alone otherwise.
- Once things are stable, hide the trace by default so it doesn't eat screen space — but reveal it
  on *either* a thrown error *or* a one-shot stall timer (e.g. reveal if no "healthy" milestone has
  been reached within ~8s of starting). Error-only reveal will miss the exact class of silent
  failure this section exists to catch.
- Make the trace element genuinely readable when it does appear: wrap text (`white-space:
  pre-wrap`), don't set `pointer-events: none` on it (that also blocks scrolling/selecting a long
  error message), and give it a background so it's legible over editor content.

This is worth building even for a first pass — it's what actually found gotcha #2, and a manual
"add some console.logs and ask the user to plug in a USB cable" loop is much slower.

## 5. Custom (self-hosted) editors may not repaint live on an app theme switch

Confirmed on the actual app: switching the user's active theme while a note using a custom
iframe-based editor is open does **not** reliably update that editor's colors until the note is
closed and reopened — even though the host demonstrably broadcasts the new theme to every mounted
component (`ComponentManager.postActiveThemesToAllViewers()` iterates all viewers unconditionally,
confirmed in source). This reproduces identically with an official, unrelated third-party editor
(`com.sncommunity.advanced-checklist`), so it's an app-level characteristic of custom/iframe
editors generally, not a bug in your specific plugin — don't spend time chasing it, and don't
assume a workaround (forcing a reflow, `requestMeasure()`, etc.) will fix it, since it won't.

## 6. Server-side "Remote" revision history is throttled — this is not a bug in your plugin

The note history panel's "Remote" tab is populated entirely by a server API call
(`_listRevisions.execute(...)` in `NoteHistoryController.ts`) — there is no client-side logic to
inspect or influence. If it looks sparse/empty during active development, it's very likely just
the server's own revision-creation throttling reacting to a burst of small, rapid test edits, not
anything specific to your editor. Confirmed by reproducing the identical "slow to add entries"
behavior with the built-in Plain Text editor under the same rapid-edit test pattern. Don't
diagnose this as a plugin bug without first comparing against a native note type under the same
edit cadence.

## 7. CodeMirror 6 specifics (if that's your editor toolkit)

- **Cursor is invisible in dark themes by default.** `drawSelection()` hardcodes
  `.cm-cursor { border-left: 1.2px solid black }` unless you opt into CodeMirror's own dark-theme
  flag (which doesn't apply here, since you're following the host's theme instead). Override with
  higher specificity than CodeMirror's own injected stylesheet — a compound selector like
  `.cm-editor .cm-cursor` beats CodeMirror's single-class rule regardless of DOM insertion order:
  ```css
  .cm-editor .cm-cursor, .cm-editor .cm-dropCursor {
    border-left-color: var(--sn-stylekit-editor-foreground-color, #000);
  }
  ```
- **Same problem, same fix, for content padding.** CodeMirror's base theme sets
  `.cm-content { padding: 4px 0 }` *and* `.cm-line { padding: 0 2px 0 6px }`, both injected the
  same way (a runtime `<style>` tag added after your bundled CSS) and both silently winning over a
  plain `.cm-content`/`.cm-line` override regardless of what value you give it — a padding change
  can appear to do *nothing at all*, before or after you "fix" it, which is a confusing symptom if
  you don't already know this class of bug exists. Same compound-selector fix, and zero out
  `.cm-line`'s padding too or it stacks on top of `.cm-content`'s:
  ```css
  .cm-editor .cm-content { padding: 15px; }
  .cm-editor .cm-line { padding: 0; }
  ```
- **Same problem again for line-height, but it isn't a specificity war this time — easier to miss.**
  CodeMirror's base theme sets `.cm-scroller { line-height: 1.4 }` as a **direct declaration** on
  that element, not something `.cm-scroller` inherits from `.cm-editor`. Setting `line-height` on
  `.cm-editor` alone has *zero* visible effect, no matter how correct the value is — a property
  declared directly on a descendant always wins over an inherited one, full stop, independent of
  any specificity or DOM-insertion-order question (unlike the cursor/padding cases above, this one
  isn't even about which stylesheet loaded last). Override `.cm-scroller` itself:
  ```css
  .cm-editor .cm-scroller { line-height: 1.5; }
  ```
- **Distinguish host-driven updates from user edits with a transaction `Annotation`, not a mutable
  boolean flag.** A flag toggled synchronously around `dispatch()` only reliably works if update
  listeners are guaranteed to fire synchronously within that same call — annotate the transaction
  instead so the check can't race regardless of listener timing:
  ```js
  const remoteUpdate = Annotation.define()
  // when applying host content: view.dispatch({ changes: {...}, annotations: remoteUpdate.of(true) })
  // in the update listener: update.transactions.some(tr => tr.annotation(remoteUpdate))
  ```
- **Testing in Vitest + jsdom**: jsdom doesn't implement layout, so mounting a real `EditorView`
  throws on `Range.getClientRects`/`getBoundingClientRect` during cursor/selection measurement.
  Stub both before constructing the view if you want clean test output:
  ```js
  Range.prototype.getClientRects = () => []
  Range.prototype.getBoundingClientRect = () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 })
  ```
  Use a per-file `// @vitest-environment jsdom` pragma so only editor-view tests pay for a DOM
  environment.

## 8. Matching Plain Text's exact padding/font-size/line-height — and knowing when to stop

If the goal is for switching a note between your editor and the built-in Plain Text editor to
change *only* colors/styling (not visually reflow the text), match its real numbers instead of
eyeballing something plausible. Padding, font-size, and line-height are all real, fixable bugs on
desktop/web (see below) — but full parity also has to survive the *mobile* app, and that's where
this stopped being worth it for one real project (sn-bujo): the desktop match was pixel-perfect,
but Android still diverged (smaller, more "typewriter"-looking text) for a reason that isn't a
bug in your CSS — see the monospace-font bullet below. That project shipped the padding fix and
reverted the font-size/line-height/font-family ones rather than chase Android parity further.
Treat matching padding as close to always-worth-it; treat font-size/line-height/font-family
matching as something to attempt only if you're prepared to also handle the mobile runtime
override, or to accept the platforms will diverge slightly there.
- **Padding**: Plain Text's actual textarea CSS is `.editable { padding: 15px }`
  (`packages/web/src/stylesheets/_editor.scss` in `standardnotes/app`) — a flat `15px` on all
  sides, not the more generous margins it might look like at a glance.
- **Font size**: with the default "Normal" editor font-size preference, Plain Text's textarea
  resolves (via a Tailwind class) to `var(--sn-stylekit-font-size-editor)` on desktop.
  ⚠️ **Consuming that variable in your own CSS does *not* actually match it** — this specific
  variable is only ever defined in the *app's own* base stylesheet
  (`packages/web/src/stylesheets/_main.scss`), never in a theme file. Color variables reach your
  iframe because the host injects the *active theme's* CSS file into it; this one isn't part of
  any theme file, so it never crosses the iframe boundary at all, and `var(--sn-stylekit-font-size-
  editor, yourFallback)` silently resolves to `yourFallback` 100% of the time, on every platform,
  regardless of what value you picked. Hardcode the real value instead of trusting the variable to
  arrive, including its responsive breakpoint:
  ```css
  --sn-stylekit-font-size-editor: 0.9375rem;              /* desktop, > 768px */
  @media screen and (max-width: 768px) {
    --sn-stylekit-font-size-editor: 1rem;                  /* mobile/narrow */
  }
  ```
  (`Small`/`Medium`/`Large`/etc. font-size preferences map to other fixed rem values instead — see
  `getPlaintextFontSize.tsx` — but Normal is the default.) Keep wrapping your own rule in `var()`
  with this hardcoded value as the fallback anyway — cheap insurance in case a specific theme ever
  does redeclare it, which would then correctly take precedence.
- The outer margin around the whole editor pane (`EditorContentWithSafeAreaPadding`, driven by the
  user's "editor line width" preference) is applied identically to every editor, custom or native,
  since they're all direct children of the same wrapper — that part is never something your plugin
  needs to account for; only the padding *inside* your own component's rendered area is on you.
- **`--sn-stylekit-monospace-font` has the identical never-reaches-your-iframe problem**, defined
  in the same app-only stylesheet as font-size-editor above, never in a theme file. If you're
  reaching for a monospace font, the app's real desktop default is `'SFMono-Regular', Consolas,
  'Liberation Mono', Menlo, 'Ubuntu Mono', 'Courier New', monospace`. **This is the actual root
  cause of the Android divergence mentioned above**: on Android specifically, the app overrides
  this variable further, *at runtime* via JS (`setDefaultMonospaceFont.tsx`, keyed off
  `Platform.Android`), to `'"Roboto Mono", "Droid Sans Mono", monospace'` — a value that exists
  nowhere in any stylesheet, static or theme, so hardcoding the desktop default as your CSS
  fallback (the normal fix for this variable) silently does *not* cover Android; your plugin falls
  through to the browser's bare generic `monospace` keyword instead, which Android's WebView
  resolves to a visibly different, smaller-looking font than the app's own Roboto Mono override.
  Matching the desktop stack is a straightforward CSS fallback; matching the Android override too
  means checking `relay.isRunningInMobileApplication()` / `relay.platform` and setting the
  variable yourself at runtime, matching a value that lives in JS, not CSS — real added surface
  area, worth doing only if pixel-parity on Android specifically matters enough to justify it, not
  by default.
- **Line height**, unlike the two above, is *not* a theme variable at all — Plain Text's default
  "Editor Line Height" preference is "Normal", which is just Tailwind's `leading-normal`
  (`line-height: 1.5`, a plain unitless multiplier from `PrefDefaults.ts`/`EditorLineHeight.ts`).
  No iframe-boundary issue, no CodeMirror base-theme conflict to fight (it doesn't set an explicit
  line-height anywhere) — just set `line-height: 1.5` directly and it's correct.

## 9. GitHub Pages deploy fails silently (zero steps run) if triggered by a tag push

If your release workflow deploys to Pages on a `push: tags:` trigger rather than a branch push,
the auto-created `github-pages` environment (created the first time you enable Pages with
"Source: GitHub Actions") defaults to a deployment-branch policy that only allows `main` — tag
refs don't match, and the `deploy-pages` job fails immediately with an empty step list, no useful
log. Fix: repo Settings → Environments → `github-pages` → add a deployment branch/tag rule of
**type "Tag"**, pattern `v*` (or whatever your tag scheme is) — matches all future tags without
per-release changes.

## 10. Mobile offline support for remotely-loaded plugins is broken by iframe sandboxing — a long-standing, acknowledged platform limitation, not something your code can fix

**Symptom**: with no network connection, the plugin's iframe fails to load at all on the Standard
Notes Android app — Chrome's own "Webpage not available" / `net::ERR_CONNECTION_RESET` /
`net::ERR_INTERNET_DISCONNECTED` error page, before any of your own JS ever runs. Note content
itself is unaffected (it's delivered via `postMessage`, not a fetch) — this is purely about the
plugin's own HTML/CSS/JS bundle never being cached anywhere.

**A service worker is the correct, standard fix for this class of problem in general** (cache the
app shell after a successful load, serve it cache-first when the network is down) — but on
Android inside the real Standard Notes app, registering one throws synchronously:
```
SecurityError: Failed to read the 'serviceWorker' property from 'Navigator': Service worker is
disabled because the context is sandboxed and lacks the 'allow-same-origin' flag.
```
That's Chromium's specific error for an iframe loaded with a `sandbox` attribute that omits
`allow-same-origin`. **This is the host's own iframe embedding, not your plugin's markup** — there
is no way for content inside a sandboxed frame to opt itself out of its own sandbox restrictions,
by design. Confirmed via manual on-device testing that this reproduces on every load, not
intermittently. It likely also explains why `localStorage` doesn't reliably persist for
custom/iframe editors on Android (same non-opaque-origin storage requirement) — if you've hit that
independently, this may be the same root cause.

**This is a real, long-acknowledged limitation, not an intentional security decision you'd be
wasting anyone's time reporting.** `standardnotes/app` has GitHub Issues disabled entirely (see the
"Getting unstuck" section of `SKILL.md` for where the real tracker lives) — searching there found
[standardnotes/forum#3925](https://github.com/standardnotes/forum/issues/3925) (open, filed 2025,
identical symptom on a *different* editor plugin, confirming this isn't specific to any one
plugin), and a much older thread
([standardnotes/forum#2040](https://github.com/standardnotes/forum/issues/2040),
[#827](https://github.com/standardnotes/forum/issues/827)) where the SN founder and a contributor
investigated Service Workers as the fix for mobile offline editors as far back as 2018, and
concluded Android's WebView supports Service Workers in general — this sandboxing is an
*additional*, separate restriction on top of that general WebView-level support, which is new
information not previously on record in either thread.

**Don't waste time on this**: no client-side technique (Cache API without a service worker,
localStorage-based tricks, etc.) can substitute — if the top-level frame's own navigation request
fails outright, your JS never gets a chance to run at all, regardless of what it would have done.
The only real fix is the host adding `allow-same-origin` to how it sandboxes plugin iframes, which
is out of your hands. Build the service worker anyway if you want it (it's genuinely correct on
desktop/web/desktop-app, and would start working on mobile too if this ever gets fixed on the host
side) but ship it knowing it's a no-op there for now, and say so plainly in your own README rather
than implying it works everywhere.

**Implementation gotcha if you do build one**: wrap the *entire* feature-detection-and-registration
function body in `try/catch`, not just the code that sets up a deferred call to it. Registration is
typically deferred to the `load` event (so the service worker's own network fetches don't compete
with your host-handshake's), and a throw from *inside* an event-listener callback happens on a
fresh call stack that a `try/catch` established back when `addEventListener()` was merely *called*
is no longer in scope for — it becomes an uncaught global error instead of being caught, even
though the enclosing code visually looks protected. Confirmed the hard way: an initial version
protected the `if ('serviceWorker' in navigator)` check and the synchronous "run now" path
correctly, but let the exact same exception escape uncaught once it actually ran from the deferred
`load` listener, which is the common case in practice.

**A related false lead worth knowing about**: a broken/absent service worker can *look* like it's
working for a short window after a fresh load, because GitHub Pages (and most static hosts) set an
ordinary HTTP `Cache-Control: max-age=...`. A fresh cache entry doesn't need a network round-trip
to be served — that's unrelated to any service worker, and stops working the moment the freshness
window lapses. Don't mistake this for real offline capability; verify by checking whether a service
worker is actually registered and active (e.g. via an on-screen diagnostic — see gotcha #4), not by
testing "does it work offline right after I opened it."

## 11. Desktop offline install needs a zip you build yourself, not GitHub's auto source zip

`download_url` pointing at GitHub's auto-generated "Source code (zip)" only works for plugins
whose repo root already *is* the finished, loadable asset (no build step). If your plugin needs a
bundler (Vite, webpack, etc.), that zip contains unbuilt `src/` files and won't load. Build your
own zip as a release-workflow step: zip up your actual `dist/` output (containing `index.html` at
the root, or point `"sn": { "main": "path/to/index.html" }` at it), including a `package.json`
with at least a `"version"` key at the zip's root (required — the desktop app cross-checks this
against the manifest's own `version`), and attach it as a release asset. Point `download_url` at
that asset's URL, not the repo's auto-generated archive.
