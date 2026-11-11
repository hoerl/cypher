# Install Cypher

Cypher is a chatroom that opens inside an AI chat. This file tells an AI agent
how to install Cypher and how to open it.

## Rules for the agent

1. Find the host you run in. Follow only the section for that host.
2. In Codex CLI, follow the Codex section below. In other hosts, if a tool named `open_portal` is available, Cypher is
   installed. Go to "Open Cypher".
3. Do the steps you can do. If a step needs the person, tell the person that
   one step.
4. Verify `cypher-open --help` for Codex CLI, or `open_portal` for inline hosts.
5. Do not open a web browser as a replacement for the app.
6. You cannot read or send room messages. The person uses the room in the app.
7. Status text. Show "Installing Cypher…" when installation starts. Show
   "Opening Cypher…" when you open it. Keep commands, checks and tool names
   out of the chat.

## Addresses

| Item | Value |
|---|---|
| Claude connector URL | `https://cypherchat.org/claude/mcp` |
| ChatGPT and other MCP clients | `https://cypherchat.org/mcp` |
| Transport | Streamable HTTP |
| Authentication | none |
| Tool that opens Cypher | `open_portal` |

The former address `https://cypher.hoerl.org` still works. Use
`https://cypherchat.org` for a new installation.

## Claude (web, desktop, mobile)

An agent cannot add a connector. The person does steps 1 to 4.

1. Open https://claude.ai/customize/connectors
2. Click **+ Add**, then click **Add custom connector**.
3. Name: `Cypher`. URL: `https://cypherchat.org/claude/mcp`
4. Choose **No sign in**, then click **Add**.
5. Start a new chat. Say: `open cypher`

## ChatGPT

A public ChatGPT listing does not exist yet. The person adds a custom MCP
server. The person does steps 1 to 4.

1. Open https://chatgpt.com/plugins
2. Click **+**, then click **Add custom MCP server**.
3. Name: `Cypher`. URL: `https://cypherchat.org/mcp`. Authentication: none.
4. Click **Create as a plugin**, then install it.
5. Start a new chat. Type `@Cypher`. Say: `open cypher`

Do not run Codex commands for ChatGPT.

## Claude Code

The agent can run these two commands.

```sh
claude plugin marketplace add hoerl/cypher
claude plugin install cypher@cypher
```

Then the person restarts Claude Code and types `/cypher`. An agent cannot type
`/cypher` for the person.

- `/cypher` opens the room in a pane beside the chat.
- Requirement: Node.js 22 or newer.
- Install this plugin even when the Cypher connector is connected in Claude.

## Codex

ChatGPT and Codex desktop use inline launching by default. Never infer CLI from
shell access, a local workspace, or the generic Codex agent name. Do not open
Terminal or request Apple Events permission for an ordinary desktop launch.
If the host is uncertain, use the inline app. Terminal launching is only for an
explicitly identified Codex CLI host or an explicit terminal request.

The agent can run these two commands.

```sh
codex plugin marketplace add https://github.com/hoerl/cypher.git --ref main
codex plugin add cypher@cypher-shared
```

Then start a new chat and say: `open cypher`

- Codex desktop with MCP Apps rendering: the existing app opens inline.
- Codex CLI: use `cypher-open`; never display a QR launch card.

For Codex CLI, Node.js 24 or newer is required. The plugin includes the
standalone npm archive at `plugins/cypher/terminal/cypher-terminal.tgz`. After
installation, resolve `../../terminal/cypher-terminal.tgz` relative to the
installed Cypher SKILL.md directory, and run `npm install -g` with that absolute
archive path. Installing the archive copies the client; it does not link to a
plugin cache or development checkout. Verify `cypher-open --help`.

Run `cypher-open` to add a pane in tmux, or open Terminal on macOS outside tmux.
If Codex is busy with another task and a new shell is needed, ask before opening
it. Do not restart the existing task. To start both together, the person runs
`cypher-open --start` directly in a terminal with tmux and Codex installed.
After successful login the client asks whether to save the sign-in. Not now is
the default; Keychain is accessed only after Save or to restore a previously
saved Codex sign-in. Claude and browser credential behavior is unchanged.

To update an existing Git-backed installation:

```sh
codex plugin marketplace upgrade cypher-shared
codex plugin add cypher@cypher-shared
```

Reinstall the updated bundled terminal archive when updating the CLI client.
Keep the full plugin: its existing hosted MCP connection supports desktop inline
launches. The CLI skill bypasses that connection and runs the terminal launcher.

## Open Cypher

In Codex CLI, run `cypher-open` and report only launcher status. Never capture
room output or attach an agent tool to the interactive terminal.
In inline-capable hosts, call `open_portal` with `{}`. Then follow the response rules in the tool
description.

If the tool is not listed after installation, refresh the host's tools. If the
host needs a new chat, tell the person that one step.

## Invite links

An invite link has this form: `https://cypherchat.org/?join=CODE`. `CODE` is 6
characters. The link opens one room.

| Situation | Action |
|---|---|
| Codex CLI | Run `cypher-open --join` with the supplied invite safely quoted. |
| Inline host: `open_portal` is available | Call `open_portal` with `{"join": "<the link>"}`. Pass the link exactly as given. |
| `open_portal` is not available | Give the person the install steps for the host. Then tell the person to start a new chat and paste the invite link again. |
| Claude Code | The person types `/cypher <the link>`. |

Claude Code plugin version 0.3.1 and earlier do not read the link. With those
versions the person types `/cypher`, opens the rooms tab, and selects the room.

The code is an address. It is not a password. Room rules still apply. If the
room refuses the person, the app opens the default room.
