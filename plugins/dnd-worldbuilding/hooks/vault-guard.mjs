#!/usr/bin/env node
// PreToolUse guard: inside an Obsidian vault that has an `_Assistant/` folder,
// block writes to anything except `_Assistant/`. Vaults without `_Assistant/`
// are left alone. Fails open on unparseable input.
import { existsSync } from "node:fs";
import path from "node:path";

const ASSISTANT_DIR = "_Assistant";
const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
const SHELL_TOOLS = new Set(["Bash", "PowerShell"]);

// Mutating shell constructs. Deliberately broad: a false positive just makes
// Claude ask the user, a false negative lets a note be changed.
const MUTATING = [
  /(^|[\s;&|(])(rm|rmdir|mv|cp|touch|mkdir|ln|truncate|dd|install|shred|unlink)(\s|$)/i,
  /(^|[\s;&|(])(sed|perl)\s+[^|;&]*-i/i,
  /(^|[\s;&|(])tee(\s|$)/i,
  /(^|[^<>0-9&2])>{1,2}(?![&>])/, // redirection (not 2>&1, not >&)
  /\b(Set-Content|Add-Content|Out-File|Clear-Content|Remove-Item|Move-Item|Rename-Item|New-Item|Copy-Item|Set-ItemProperty|Expand-Archive)\b/i,
  /(^|[\s;&|(])(del|erase|ren|rename|move|copy|xcopy|robocopy|rd|md)(\s|$)/i,
  /\bgit\s+(checkout|restore|reset|clean|stash|rm|mv|apply|merge|rebase|pull|commit)\b/i,
  /\b(sqlite3|python3?|uv\s+run|node|deno|bun|ruby|php)\b/i, // arbitrary code can write anywhere
];

function allow() {
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

// Normalize Windows, backslash and Git Bash (/c/...) forms to one comparable string.
function norm(p) {
  if (!p) return "";
  let s = String(p).replace(/^["']|["']$/g, "");
  const m = s.match(/^\/([a-zA-Z])\/(.*)$/);
  if (m) s = `${m[1]}:/${m[2]}`;
  s = s.replace(/\\/g, "/");
  s = path.posix.normalize(s);
  return s.replace(/\/+$/, "");
}

const lc = (s) => s.toLowerCase();

// Walk up from p looking for a dir containing `.obsidian`. Returns the vault root or null.
function findVault(p) {
  let dir = norm(p);
  if (!dir) return null;
  for (let i = 0; i < 64; i++) {
    if (existsSync(`${dir}/.obsidian`)) return dir;
    const parent = path.posix.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function isGuarded(vault) {
  return vault && existsSync(`${vault}/${ASSISTANT_DIR}`);
}

function insideAssistant(vault, target) {
  const root = lc(`${vault}/${ASSISTANT_DIR}/`);
  return lc(norm(target) + "/").startsWith(root);
}

const REASON =
  "This Obsidian vault is protected by the dnd-worldbuilding plugin: the assistant may only write inside its own " +
  `\`${ASSISTANT_DIR}/\` folder. The user makes every creative decision and edits their own notes. ` +
  `Put the proposed text in chat or in \`${ASSISTANT_DIR}/Drafts/\` instead, and let the user apply it.`;

let input;
try {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  input = JSON.parse(raw);
} catch {
  allow();
}

const tool = input.tool_name;
const ti = input.tool_input ?? {};
const cwd = input.cwd ?? process.cwd();

if (WRITE_TOOLS.has(tool)) {
  const target = ti.file_path ?? ti.notebook_path;
  if (!target) allow();
  const abs = path.isAbsolute(norm(target)) || /^[a-zA-Z]:/.test(norm(target)) ? norm(target) : norm(`${norm(cwd)}/${target}`);
  const vault = findVault(path.posix.dirname(abs));
  if (isGuarded(vault) && !insideAssistant(vault, abs)) deny(REASON);
  allow();
}

if (SHELL_TOOLS.has(tool)) {
  const cmd = String(ti.command ?? "");
  if (!cmd) allow();
  if (!MUTATING.some((re) => re.test(cmd))) allow();

  // Which guarded vaults does this command touch? cwd, plus any path-looking token.
  const vaults = new Set();
  const addVault = (p) => {
    const v = findVault(p);
    if (isGuarded(v)) vaults.add(v);
  };
  addVault(cwd);
  const tokens = cmd.match(/(?:[a-zA-Z]:[\\/]|\/[a-zA-Z]\/|\.{0,2}[\\/])[^"'`<>|;&\n]*|"[^"\n]+"|'[^'\n]+'/g) ?? [];
  for (const t of tokens) {
    const n = norm(t);
    // Try the token and each parent so partial matches (trailing args) still resolve.
    let p = n;
    for (let i = 0; i < 12 && p && p !== "/"; i++) {
      if (existsSync(p)) {
        addVault(p);
        break;
      }
      p = path.posix.dirname(p);
    }
  }
  if (vaults.size === 0) allow();

  // Allow only if every mention of the vault in the command is under _Assistant/.
  const lcCmd = lc(cmd.replace(/\\/g, "/"));
  let allInside = true;
  for (const v of vaults) {
    const vl = lc(v);
    const gitBash = vl.replace(/^([a-z]):/, "/$1");
    for (const needle of [vl, gitBash]) {
      let idx = lcCmd.indexOf(needle);
      while (idx !== -1) {
        const rest = lcCmd.slice(idx + needle.length);
        if (!rest.startsWith(`/${lc(ASSISTANT_DIR)}/`) && !rest.startsWith(`/${lc(ASSISTANT_DIR)}"`) && !rest.startsWith(`/${lc(ASSISTANT_DIR)}'`)) allInside = false;
        idx = lcCmd.indexOf(needle, idx + needle.length);
      }
    }
    // Relative commands run from the vault root can't be proven safe unless cwd is inside _Assistant.
    if (lc(norm(cwd)).startsWith(vl) && !insideAssistant(v, cwd) && !lcCmd.includes(vl) && !lcCmd.includes(gitBash)) allInside = false;
  }
  if (allInside) allow();
  deny(
    REASON +
      " (A shell command that might modify files was blocked; if it only reads, rephrase it without write/redirect operators or interpreters.)",
  );
}

allow();
