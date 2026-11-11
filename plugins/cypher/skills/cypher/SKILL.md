---
name: cypher
description: Open Cypher when the user says open Cypher or mentions @Cypher. Use the terminal launcher in Codex CLI and the inline app in supported desktop hosts. Do not use for development or metadata requests.
---

## Host boundary

ChatGPT (web, desktop, mobile, and Work), Codex desktop, and unknown hosts use
the inline app. A plain “open Cypher” in those hosts MUST NOT run cypher-open,
osascript, Apple Events, a terminal installer, or any shell launcher. Discover
and call the connected open_portal tool instead. If that tool is unavailable,
report the connection problem; never use Terminal as an automatic fallback.

Only use the CLI branch when the current host explicitly identifies itself as
Codex CLI, or the person explicitly requests the terminal experience. Generic
“Codex” agent identity, shell tools, a repository, cwd, TERM_PROGRAM, or a local
execution environment are NOT evidence that the person is using Codex CLI.
When uncertain, use the inline branch. Do not ask for Terminal-control permission
to satisfy an ordinary ChatGPT launch.

## Explicit Codex CLI or terminal request

Run the installed `cypher-open` launcher. Do not restart or replace an active
Codex session. In tmux it adds a neighboring pane; outside tmux on macOS it opens
Terminal. If another task is running and a new shell is needed, first ask the
person whether to open Cypher in another shell. Do not infer approval from silence.

If `cypher-open` is missing, install the bundled npm archive. Resolve
`../../terminal/cypher-terminal.tgz` relative to this SKILL.md directory and run
`npm install -g` with that absolute archive path, safely quoted. Node.js 24 or
newer is required. Use the archive, not an unpacked directory or symlink to the
plugin cache. Check `cypher-open --help` afterward. Follow the host's normal
execution permissions; do not fall back to a QR card if installation fails.

Only `cypher-open` may run through agent shell tools. The human may run
`cypher-open --start` directly to start both in a fresh tmux session. Never run
that attaching mode through an agent tool. Never run the interactive `cypher`
client through captured output, attach to tmux, or read room output. Pass a known
pane ID with `--pane` only if supplied by the environment or user; do not guess.
Use `--join` for a supplied invitation and `--origin` for a supplied service.

Report only launcher status, distinguishing a new Terminal window from a split.
Do not claim login or connectivity based on window creation. After successful
login Cypher itself asks whether to save the sign-in. The person handles login,
Keychain consent, and room actions; the assistant does not operate them.

## Desktop inline app

A bare @Cypher mention requests an inline launch. Call `open_portal` with `{}`.
Use the actual exposed tool name belonging to Cypher, including a host namespace.
If it is not initially exposed, discover deferred tools through the host tool
registry before treating it as unavailable. Do not ask whether to open Cypher.

Never substitute a browser, /app URL, side panel, generated UI, or direct HTTP
request for the inline tool. Only an explicit side-panel request uses open_panel.
If tools remain unavailable after supported refresh, report inline launch pending
and the single required next step. Do not claim Cypher is open.
Use `open_panel` only when the user requests the conversation side panel.
Use `open_space` for the global application entrypoint.

Do not call these tools for development or metadata requests.
When called, say exactly: "I found a glitch..."
While opening, use only one of these exact messages:
- "Jacking in…"
- "Making contact..."
- "Finding a way in..."
Do not add other launch narration or cycle through the messages.

After a successful call, repeat only the returned text:
"You’re in. {n} people here."
For counts above 3, replace {n} with the returned presentCount.
For counts of 1–3, use only: "A few others are here."
If presentCount is zero, use only:
"You’re the first. Someone has to find it."
Do not add an explanation or follow-up. The count is an aggregate. Do not invent
participants, messages, activity, or verification.

Cypher's room is outside the assistant's context. Do not inspect its DOM, screenshot,
network traffic, storage, or files to recover room content. Do not ask a person to
paste private room messages, World credentials, or identity tokens into chat.
Never sign in, post, quote, set away messages, moderate, or participate for a user.
Those actions belong to the human in the portal.

If the host cannot render MCP Apps, explain that an interactive MCP Apps host is
required. Do not substitute a text transcript. A local stdio installation requires
the packaged Node runtime entrypoint to run; ChatGPT web/mobile requires the hosted
Streamable HTTP connection. Do not claim a local installation is remotely hosted.
