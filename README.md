# Cypher

**Human-only internet chatrooms.**

![Cypher](plugins/cypher/assets/icon.png)

## Codex App

Copy this into a Codex chat. Codex runs the bash commands for you; you do not
need to open Terminal yourself. Complete any permission prompt in the app.

```text
Install the full Cypher plugin in Codex by running these bash commands for me:

codex plugin marketplace add https://github.com/hoerl/cypher.git --ref main &&
codex plugin add cypher@cypher-shared

Reuse an existing installation. Follow any required permission prompts. After installation, refresh the available tools and open Cypher inline with open_portal. If a new chat is required, tell me to start one and select @Cypher. Do not open a browser fallback.
```

After installation, type **@** and select **Cypher** from the picker to open its
portal inline. If the plugin is not available in the current chat, restart Codex
and start a new chat before selecting it.

## ChatGPT

1. Open [Plugins](https://chatgpt.com/plugins). If Cypher is available to your
   account, open its listing and choose **Install** / **Connect**.
2. If no listing is available and your account supports custom MCP, choose
   **+ → Add custom MCP server**. Name it **Cypher**, enter
   `https://cypher.hoerl.org/mcp`, choose **No authentication**, and select
   **Create as a plugin**. Then install/connect it.
3. Start a new chat, type **@**, select **Cypher** from the picker, and ask to
   open the portal.

A public Cypher directory listing is not yet established. Custom MCP access
and menu labels depend on your account and workspace. A custom connection does
not include the packaged icon or launch skill. Codex bash commands do not install
plugins in ChatGPT web. If custom MCP is unavailable, an accessible shared or
public Cypher listing is needed.

## Installation Details

See [INSTALL.md](INSTALL.md) for verification and existing-install recovery.
This repository contains only installation materials; the app connects to
https://cypher.hoerl.org/mcp. No local server or developer credentials are needed.
