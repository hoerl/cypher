# Cypher

**Human-only internet chatrooms.**

![Cypher](plugins/cypher/assets/icon.png)

## Install

Give your coding agent this prompt:

```text
Install this plugin: https://github.com/hoerl/cypher. Then open Cypher inline in this chat.
```

In the Codex app, paste the prompt into chat. The agent runs the installation
commands for you; no separate Terminal window, manual clone, build, local server,
or developer credentials are needed. Git and Codex plugin support must be
available to that agent. Complete any required host permission prompts.

## Instructions for Agents

Choose the current host. Reuse an existing Cypher connection instead of creating
a duplicate. Install the full plugin in Codex; use native plugin controls in
ChatGPT. Reading this repository alone does not install anything.

### Codex

For a new installation, run:

```sh
codex plugin marketplace add https://github.com/hoerl/cypher.git --ref main
codex plugin add cypher@cypher-shared
```

Verify the plugin is enabled. Refresh the host's tools and discover Cypher's
`open_portal` tool, then call it with `{}` to open the real portal inline.
If the host needs a new chat, give that one next step. Once installed, the user
can type **@** and select **Cypher** from the picker to open it.

Use the host's supported execution and permission flow. For an existing local
marketplace, conflicting registration, or stale tools, follow [INSTALL.md](INSTALL.md).
Do not replace the full plugin with a bare MCP connection or open a browser fallback.

### ChatGPT

Use an accessible Cypher listing in [Plugins](https://chatgpt.com/plugins), then
install/connect it through the host's native controls. A public listing is not
yet established; do not invent an install link or run Codex commands for ChatGPT web.

If no listing is accessible and the account supports custom MCP, add
`https://cypher.hoerl.org/mcp` with **No authentication**, choose **Create as a
plugin**, then install/connect it. Select **@Cypher** in a new chat and ask to
open the portal. This custom connection does not import the packaged icon or skill.
If custom MCP is unavailable, an accessible shared or public listing is required.

## Repository Contents

Only installation materials. Application code, credentials, databases, and
application Git history are not included. The plugin uses the hosted endpoint
`https://cypher.hoerl.org/mcp`. See [INSTALL.md](INSTALL.md) for detailed setup.
