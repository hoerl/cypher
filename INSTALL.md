# Install Cypher

## Claude

1. Open [Customize > Connectors](https://claude.ai/customize/connectors).
2. Click **+ Add**, then **Add custom connector**.
3. Name: `Cypher`. URL: `https://cypher.hoerl.org/claude/mcp`
4. Choose **No sign in**, then click **Add**.
5. In a new chat, say: open cypher

## ChatGPT

1. Open [Plugins](https://chatgpt.com/plugins).
2. Click **+**, then **Add custom MCP server**.
3. Name: `Cypher`. URL: `https://cypher.hoerl.org/mcp`. Authentication: none.
4. Click **Create as a plugin**, then install it.
5. In a new chat, type `@Cypher` and say: open cypher

## Claude Code

Install the plugin even if Cypher is already connected in Claude.

```sh
claude plugin marketplace add hoerl/cypher
claude plugin install cypher@cypher
```

Restart Claude Code, then run `/cypher` to open the room in a pane beside the chat.
It needs Node.js 22 or newer.

## Codex

```sh
codex plugin marketplace add https://github.com/hoerl/cypher.git --ref main
codex plugin add cypher@cypher-shared
```

Start a new chat and say: open cypher
