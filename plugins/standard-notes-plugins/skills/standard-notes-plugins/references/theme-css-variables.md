# Theme CSS variables

Source: https://standardnotes.com/help/plugins/themes · reference implementation of the built-in theme: `com.sncommunity.dracula-theme` (`packages/com.sncommunity.dracula-theme/src/main.scss` in https://github.com/standardnotes/plugins)

A theme plugin is a single CSS file. No JS, no manifest complexity beyond `content_type: "SN|Theme"` and `area: "themes"` (see `manifest-and-publishing.md`). Themes work automatically on mobile.

Official client source of truth for these variables (check here if something below looks stale):
- Base variables: https://github.com/standardnotes/app/blob/main/packages/styles/src/Styles/_colors.scss
- Optional component overrides: https://github.com/standardnotes/app/blob/main/packages/web/src/stylesheets/_theme.scss

## Base variables (`:root`)

```css
:root {
  --sn-stylekit-base-font-size: 14px;

  --sn-stylekit-font-size-p: 1rem;
  --sn-stylekit-font-size-editor: 1.21rem;

  --sn-stylekit-font-size-h6: 0.8rem;
  --sn-stylekit-font-size-h5: 0.9rem;
  --sn-stylekit-font-size-h4: 1rem;
  --sn-stylekit-font-size-h3: 1.1rem;
  --sn-stylekit-font-size-h2: 1.2rem;
  --sn-stylekit-font-size-h1: 1.3rem;

  --sn-stylekit-neutral-color: #989898;
  --sn-stylekit-neutral-contrast-color: white;

  --sn-stylekit-info-color: #086dd6;
  --sn-stylekit-info-contrast-color: white;

  --sn-stylekit-success-color: #2b9612;
  --sn-stylekit-success-contrast-color: white;

  --sn-stylekit-warning-color: #f6a200;
  --sn-stylekit-warning-contrast-color: white;

  --sn-stylekit-danger-color: #f80324;
  --sn-stylekit-danger-contrast-color: white;

  --sn-stylekit-shadow-color: #c8c8c8;
  --sn-stylekit-background-color: white;
  --sn-stylekit-border-color: #e3e3e3;
  --sn-stylekit-foreground-color: black;

  --sn-stylekit-contrast-background-color: #f6f6f6;
  --sn-stylekit-contrast-foreground-color: #2e2e2e;
  --sn-stylekit-contrast-border-color: #e3e3e3;

  --sn-stylekit-secondary-background-color: #f6f6f6;
  --sn-stylekit-secondary-foreground-color: #2e2e2e;
  --sn-stylekit-secondary-border-color: #e3e3e3;

  --sn-stylekit-secondary-contrast-background-color: #e3e3e3;
  --sn-stylekit-secondary-contrast-foreground-color: #2e2e2e;
  --sn-styleki--secondary-contrast-border-color: #a2a2a2;

  --sn-stylekit-editor-background-color: var(--sn-stylekit-background-color);
  --sn-stylekit-editor-foreground-color: var(--sn-stylekit-foreground-color);

  --sn-stylekit-paragraph-text-color: #454545;

  --sn-stylekit-input-placeholder-color: rgb(168, 168, 168);
  --sn-stylekit-input-border-color: #e3e3e3;

  --sn-stylekit-scrollbar-thumb-color: #dfdfdf;
  --sn-stylekit-scrollbar-track-border-color: #e7e7e7;

  --sn-stylekit-general-border-radius: 2px;

  --sn-stylekit-monospace-font: 'Ubuntu Mono', courier, monospace;
  --sn-stylekit-sans-serif-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

  --sn-stylekit-grey-1: #72767e;
  --sn-stylekit-grey-2: #bbbec4;
  --sn-stylekit-grey-3: #dfe1e4;
  --sn-stylekit-grey-4: #eeeff1;
  --sn-stylekit-grey-4-opacity-variant: #bbbec43d;
  --sn-stylekit-grey-5: #f4f5f7;
  --sn-stylekit-grey-6: #e5e5e5;

  --sn-stylekit-accessory-tint-color-1: #086dd6;
  --sn-stylekit-accessory-tint-color-2: #ea6595;
  --sn-stylekit-accessory-tint-color-3: #ebad00;
  --sn-stylekit-accessory-tint-color-4: #7049cf;
  --sn-stylekit-accessory-tint-color-5: #1aa772;
  --sn-stylekit-accessory-tint-color-6: #f28c52;
}
```

Values shown are the light-theme defaults — override whichever subset you need for your palette; unset ones inherit the app's defaults.

## Optional component-level overrides

These target specific UI regions and default to composing the base variables above — override individually only if the base palette isn't sufficient:

```css
--modal-background-color: var(--sn-stylekit-background-color);

--editor-header-bar-background-color: var(--sn-stylekit-background-color);
--editor-background-color: var(--sn-stylekit-editor-background-color);
--editor-foreground-color: var(--sn-stylekit-editor-foreground-color);
--editor-title-bar-border-bottom-color: var(--sn-stylekit-border-color);
--editor-title-input-color: var(--sn-stylekit-editor-foreground-color);
--editor-pane-background-color: var(--sn-stylekit-background-color);
--editor-pane-editor-background-color: var(--sn-stylekit-editor-background-color);
--editor-pane-editor-foreground-color: var(--sn-stylekit-editor-foreground-color);
--editor-pane-component-stack-item-background-color: var(--sn-stylekit-background-color);

--text-selection-color: var(--sn-stylekit-info-contrast-color);
--text-selection-background-color: var(--sn-stylekit-info-color);

--note-preview-progress-color: var(--sn-stylekit-info-color);
--note-preview-progress-background-color: var(--sn-stylekit-passive-color-4-opacity-variant);

--note-preview-selected-progress-color: var(--sn-stylekit-secondary-background-color);
--note-preview-selected-progress-background-color: var(--sn-stylekit-passive-color-4-opacity-variant);

--items-column-background-color: var(--sn-stylekit-background-color);
--items-column-items-background-color: var(--sn-stylekit-background-color);
--items-column-border-left-color: var(--sn-stylekit-border-color);
--items-column-border-right-color: var(--sn-stylekit-border-color);
--items-column-search-background-color: var(--sn-stylekit-contrast-background-color);
--item-cell-selected-background-color: var(--sn-stylekit-contrast-background-color);
--item-cell-selected-border-left-color: var(--sn-stylekit-info-color);

--navigation-column-background-color: var(--sn-stylekit-secondary-background-color);
--navigation-section-title-color: var(--sn-stylekit-secondary-foreground-color);
--navigation-item-text-color: var(--sn-stylekit-secondary-foreground-color);
--navigation-item-count-color: var(--sn-stylekit-neutral-color);
--navigation-item-selected-background-color: rgb(253, 253, 253);

--preferences-navigation-icon-color: var(--sn-stylekit-neutral-color);
--preferences-navigation-selected-background-color: var(--sn-stylekit-info-backdrop-color);

--dropdown-menu-radio-button-inactive-color: var(--sn-stylekit-passive-color-1);

--panel-resizer-background-color: var(--sn-stylekit-secondary-contrast-background-color);
--link-element-color: var(--sn-stylekit-info-color);
```

## Dock icon (colored circle next to the theme's name)

Add to the theme's manifest (`ext.json` / published JSON):

```json
"dock_icon": {
  "type": "circle",
  "background_color": "#086DD6",
  "foreground_color": "#ffffff",
  "border_color": "#086DD6"
}
```

## Build tooling used by official themes

Official theme packages write plain SCSS (e.g. `src/main.scss`) and compile with a shared webpack config:
```json
"scripts": {
  "build": "webpack --entry ./src/main.scss --config ../theme.webpack.config.js"
},
"sn": {
  "content_type": "SN|Theme",
  "area": "themes",
  "main": "dist/dist.css"
}
```
Output is a single `dist/dist.css`, which is what `url`/`main` point to. You don't need SCSS or webpack — a hand-written `.css` file works exactly the same, since the app only ever fetches the final compiled CSS.
