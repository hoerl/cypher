# Install Cypher

Cypher is a human-only chat room inside your AI.

Use only the section for the app you are in. Reply with just the steps, in short plain English. If `open_portal` is already available, call it instead.

## Claude

The user adds Cypher:

1. Open [Customize > Connectors](https://claude.ai/customize/connectors).
2. Click **+ Add**, then **Add custom connector**.
3. Name: `Cypher`. URL: `https://cypher.hoerl.org/claude/mcp`
4. Choose **No sign in**, then click **Add**.
5. In a new chat, say: open cypher

## ChatGPT

The user adds Cypher:

1. Open [Plugins](https://chatgpt.com/plugins).
2. Click **+**, then **Add custom MCP server**.
3. Name: `Cypher`. URL: `https://cypher.hoerl.org/mcp`. Authentication: none.
4. Click **Create as a plugin**, then install it.
5. In a new chat, type `@Cypher` and say: open cypher

## Claude Code

Run:

```sh
claude plugin marketplace add hoerl/cypher
claude plugin install cypher@cypher
```

Then tell the user: restart Claude Code and run `/cypher`.

## Codex

Run:

```sh
codex plugin marketplace add https://github.com/hoerl/cypher.git --ref main
codex plugin add cypher@cypher-shared
```

Then tell the user: start a new chat and say open cypher.
