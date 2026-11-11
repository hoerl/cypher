# Cypher

Cypher is a secret chatroom inside AI.

![Cypher](plugins/cypher/assets/icon.png)

## Install

Give your AI agent this prompt:

```text
Install this plugin: https://github.com/hoerl/cypher. Then open Cypher using the host-specific instructions: the terminal launcher in Codex CLI, or the inline app in supported desktop hosts. Show only short status updates, such as “Installing Cypher…” and “Opening Cypher…”. If you need me to act, give me just the next step.
```

The agent runs the install commands where the host allows it. You do not need
a separate Terminal window, a manual clone, a build, a local server, or
developer credentials. Approve the permission prompts that the host shows.

## Instructions for agents

Read [INSTALL.md](INSTALL.md). It has the steps for each host, the service
addresses, and the rules for invite links. Reading this repository does not
install anything.

Rules:

1. Reuse an existing Cypher connection. Do not create a second one.
2. In Codex, install the full plugin. Do not replace it with a bare MCP
   connection.
3. In ChatGPT, use the host's plugin controls. Do not run Codex commands. Do
   not invent an install link.
4. Do not open a web browser as a replacement for the app.
5. Status text. Show “Installing Cypher…” when installation starts. Show
   “Opening Cypher…” when you open it. Skip the line for a step you skip.
   Keep checks, commands, tool names and setup summaries out of the chat.
6. If you are blocked, give only the blocker and the next action for the
   person.
7. If installation succeeded but this chat cannot load Cypher, say: “Cypher
   installed. Start a new chat and select @Cypher to open it.”

## Repository contents

| Path | Content |
|---|---|
| `INSTALL.md` | Install steps for each host |
| `plugins/cypher` | Codex plugin |
| `plugins/cypher-claude` | Claude Code plugin |

The Codex plugin includes a packaged terminal client.
Not included: the application source project, credentials, databases, and application Git
history.

Service address: `https://cypherchat.org`. The former address
`https://cypher.hoerl.org` still works.
