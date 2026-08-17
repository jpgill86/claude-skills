# `@standardnotes/component-relay` API reference

Source: https://github.com/standardnotes/component-relay (`lib/ComponentRelay.ts`)

Install with `npm install @standardnotes/component-relay` (or `yarn add`). Every component plugin imports this and instantiates exactly one `ComponentRelay`.

## Construction

```js
import ComponentRelay from '@standardnotes/component-relay'

const relay = new ComponentRelay({
  targetWindow: window,               // required — usually `window`
  onReady: () => {},                  // called once the component has registered with the host app
  handleRequestForContentHeight: () => number,  // required if you ever call saveItems; host asks for iframe height
  onThemesChange: () => {},           // optional — called after active themes are (de)activated
  options: {
    coallesedSaving: true,            // default true — debounce/coalesce saves
    coallesedSavingDelay: 250,        // ms, default 250
    acceptsThemes: true,              // default true — set false if your component ignores theme CSS injection
    debug: false,
  },
})
```

Constructor throws if `targetWindow` is missing. It immediately registers `message`/`keydown`/`keyup`/`click` listeners and begins the handshake with the parent app; do not call other methods until `onReady` fires (messages sent before then are queued automatically, but reads like `getComponentDataValueForKey` will return nothing until ready).

## Reading data

| Method | Description |
|---|---|
| `streamContextItem(callback)` | Streams the single item currently "in context" (e.g. the open note for an editor). Callback receives the item every time it changes. Check `item.isMetadataUpdate` — `true` means only metadata changed, not content; usually skip re-rendering in that case. |
| `streamItems(contentTypes: ContentType[], callback)` | Streams all items of the given content type(s) (e.g. `['Tag']`) as they change. Callback receives `data.items`. |
| `getComponentDataValueForKey(key)` | Reads a value from this component's private persisted key/value store (per-component settings, not note content). Returns `undefined` if unset. |
| `getItemAppDataValue(item, key)` | Reads `item.content.appData['org.standardnotes.sn'][key]` — standard app-level metadata attached to any item (e.g. pinned, locked, spellcheck). |
| `platform` (getter) | String platform identifier reported by the host. |
| `environment` (getter) | String environment identifier (maps to desktop/web/mobile). |
| `isRunningInDesktopApplication()` | `true` if environment is Desktop. |
| `isRunningInMobileApplication()` | `true` if environment is Mobile. |
| `getSelfComponentUUID()` | UUID assigned to this component instance by the host. |

## Writing data

| Method | Description |
|---|---|
| `saveItem(item, callback?, skipDebouncer?)` | Save a single existing item. Shorthand for `saveItems([item], ...)`. |
| `saveItems(items, callback?, skipDebouncer?, presave?)` | Save existing items. Debounced/coalesced by default (see `options`); pass `skipDebouncer: true` to force an immediate save (use for non-keystroke-driven saves, e.g. a button click). |
| `saveItemWithPresave(item, presave, callback?)` | **The pattern used by virtually every editor.** `presave` is a function run synchronously right before the (debounced) save actually fires — mutate `item.content` inside it. This lets you keep local UI state fast and only compute expensive things (like `preview_html`) once, at save time. |
| `saveItemsWithPresave(items, presave, callback?)` | Same, for multiple items. |
| `createItem(item, callback)` | Create and persist a new item. `callback(createdItem)`. |
| `createItems(items, callback)` | Create and persist multiple items. `callback(createdItems)`. |
| `deleteItem(item, callback)` | Delete a single item. |
| `deleteItems(items, callback)` | Delete multiple items. |
| `setComponentDataValueForKey(key, value)` | Persist a per-component preference. Throws if called before the component is initialized (i.e. before `onReady`). |
| `clearComponentData()` | Wipes this component's entire private key/value store. |

### `preview_plain` / `preview_html`

Set inside your `presave` callback on the note's `content`:
- `content.preview_plain` — short plain-text preview shown in the notes list.
- `content.preview_html` — richer preview HTML, used by editor-stack components that render a summary of the note (e.g. progress bar for a checklist).

## UI / layout

| Method | Description |
|---|---|
| `setSize(width, height)` | Requests the host resize the iframe container. `width`/`height` can be numbers or CSS strings. |
| `sendCustomEvent(action, data, callback?)` | Escape hatch to send an arbitrary `ComponentAction` with a payload — used for host actions not otherwise wrapped (check the `ComponentAction` enum in the component-relay source for the current list, e.g. theme/keyboard/click actions are handled internally already). |

## Lifecycle

| Method | Description |
|---|---|
| `deinit()` | Tears down all event listeners and resets internal state. Call if you're unmounting the whole plugin (rare — most plugins live for the lifetime of the iframe). |

## Gotchas learned from reading the source

- **Debounce + context switch race**: if the user switches notes while a save is pending, `streamContextItem`'s handler detects the context item UUID changed and immediately flushes (`performSavingOfItems`) the pending save for the *previous* item before delivering the new one — so you don't need to manually flush on unmount/switch. Note this only helps if your component is still *alive* to receive that next message — see the origin bug below for a case where it silently never arrives.
- **Capture the item reference before your `presave` runs.** By the time the debounced save fires, `this.note` (or equivalent) may have been reassigned by a newer `streamContextItem` call. Standard pattern (from `org.standardnotes.simple-task-editor`):
  ```js
  save() {
    const note = this.note  // capture now
    relay.saveItemWithPresave(note, () => {
      note.content.text = this.dataString
      note.content.preview_plain = this.buildPlainPreview()
    })
  }
  ```
- **`handleRequestForContentHeight` is required** if you ever call a method that triggers `SaveItems` — the relay calls it synchronously to attach `height` to the outgoing message. For a full-pane `editor-editor` component (own `height: 100%` + internal scrolling), just `return undefined` — matches official full-pane editors and avoids the host mis-sizing things based on a computed value it doesn't actually need.
- Messages sent before the handshake completes are queued in-memory and flushed once `onReady` internally fires — you don't need to guard every call with an `isReady` check, but doing so for clarity doesn't hurt.
- If the host reports a stale/unrecognized reply (connection reset), the relay shows a browser `alert()` telling the user to restart the extension — this is host behavior, not something you need to replicate.
- ⚠️ **The published npm package (`2.2.2` as of writing — check if a newer version has fixed this) has a real bug that silently breaks the entire connection on Android and reportedly Electron desktop, with no thrown error to notice.** `postMessage` does `this.contentWindow.parent.postMessage(payload, this.component.origin)` with no fallback; `this.component.origin` is set from the first incoming message's `event.origin`, which on those platforms can be the literal string `"null"` — an invalid `targetOrigin` that throws synchronously inside `onReady()`, aborting it before your own `onReady` callback ever fires. Patch it at import time:
  ```js
  const originalPostMessage = ComponentRelay.prototype.postMessage
  ComponentRelay.prototype.postMessage = function patchedPostMessage(...args) {
    const realOrigin = this.component.origin
    const needsFallback = !realOrigin || realOrigin === 'null'
    if (needsFallback) this.component.origin = '*'
    try {
      return originalPostMessage.apply(this, args)
    } finally {
      if (needsFallback) this.component.origin = realOrigin  // restore — see below
    }
  }
  ```
  **Do not permanently overwrite `this.component.origin`.** The library also reads it to validate every *incoming* message (`event.origin !== this.component.origin` → drop it); a permanent overwrite to `'*'` fixes the crash but then silently drops every future message from the host, which is worse and equally silent. Only substitute for the duration of the one outgoing call. Full writeup: `references/known-issues-and-gotchas.md#2`.
