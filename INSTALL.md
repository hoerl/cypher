# Install Cypher

Install Cypher in the app where the user is chatting, then open its portal.
Cypher must open inline in this chat. Never open a browser or /app as an
installation or launch fallback. Use only the current host's section. No local app server, build, developer
credentials, or separate World ID plugin is needed.

If Cypher's `open_portal` tool is already available, call it with `{}` instead
of installing again. Use the exact tool name exposed by the host.

## Codex

1. Inspect `codex plugin marketplace list --json` and `codex plugin list --json`.
   Reuse `cypher@cypher-shared` when already installed from this repository.
2. Prefer the host's native marketplace/plugin installation control when it
   supports this Git source. Otherwise run the commands below through the host's
   supported permission flow. They require outbound HTTPS to GitHub and writes
   to Codex's configuration, marketplace staging, and plugin cache. When the
   terminal is sandboxed, request the appropriate execution permission for the
   complete installation operation up front, rather than retrying directory by
   directory. Do not change sandbox policy, chmod directories, or edit config
   by hand. Honor any host-required approval or rejection.

   For a new installation, run:

```sh
codex plugin marketplace add https://github.com/hoerl/cypher.git --ref main
codex plugin add cypher@cypher-shared
```

3. Verify that `cypher-shared` uses the Git source
   `https://github.com/hoerl/cypher.git`, tracks `main`, and that
   `cypher@cypher-shared` is installed and enabled. Keep the moving branch for
   updates; do not register a local checkout or pin a commit.
4. Refresh plugins through the host's supported controls and discover deferred
   Cypher tools through its tool registry. A missing tool in the initial list
   does not prove it is unavailable. Call `open_portal`
   with `{}` through the connected tool. If this chat cannot discover new tools,
   restart the host and open a new chat, select Cypher, and ask to open the portal.
   Report installation and portal rendering separately. Never open a browser
   fallback while inline launch is pending. Keep the response to one next step.

The user's explicit installation request authorizes this installation within
that host's rules. Proceed with the supported installation action; if the host
requires an approval control, present it and wait for the user. This guide does
not waive host security controls or authorize unrelated changes.

If Git or `codex plugin` support is unavailable, report the actual limitation.
Do not replace the full package with `codex mcp add`: that omits its icon and skill.
Do not edit host caches or install a local server.

### Existing local marketplace

Only if `cypher-shared` is registered as a local folder, migrate that registration:

```sh
codex plugin marketplace remove cypher-shared
codex plugin marketplace add https://github.com/hoerl/cypher.git --ref main
codex plugin add cypher@cypher-shared
```

Keep the same plugin identity. Preserve the old checkout, unrelated plugins, and
administrator-managed configuration. If a command fails, report it accurately.
If an older attempt installed a standalone MCP entry named `cypher`, inspect it
with `codex mcp get cypher`. After successful full-plugin installation, remove
that duplicate with `codex mcp remove cypher` only when its URL is exactly
`https://cypher.hoerl.org/mcp`.

## ChatGPT

Use native plugin discovery to find Cypher and present the matching result's
install/connect control with its exact ID. Reuse an accessible existing Cypher
connection or a personal, shared, or workspace plugin. Let the user complete
any native connection controls, then call `open_portal` with `{}`.

If no accessible listing is found, use ChatGPT's custom MCP setup when available:

1. Open [ChatGPT Plugins](https://chatgpt.com/plugins), choose **+ → Add custom
   MCP server**, and name it **Cypher**.
2. Set the server URL to `https://cypher.hoerl.org/mcp` and choose **No
   authentication**. Review the host's notice and choose **Create as a plugin**.
3. Install/connect the resulting plugin, select **@Cypher** from the picker in
   a chat, and ask to open the portal.

Menu labels and custom connections depend on the account and workspace policy.
If those controls are absent, explain the missing access. Do not claim that
reading this guide or running Codex commands installs a plugin in ChatGPT web.
A GitHub repository is not a ChatGPT plugin listing and cannot grant access to
another account's private plugin. A custom MCP connection does not import the
packaged icon or skill. Do not promise branded installation from a URL alone.

## Verify and troubleshoot

The package connects to `https://cypher.hoerl.org/mcp` using Streamable HTTP
(`http` in Codex's native manifest) with no MCP authentication. Human sign-in
happens in the portal. Never request identity credentials or configure a token.

Confirm `open_portal` is discovered and the real interactive portal renders
inline. A saved configuration or successful HTTP request is not proof of rendering.
Do not fabricate a portal or inspect private room content. If tools remain stale,
use the host's refresh controls and then a new chat.

This guide is hosted independently of the app:

- Primary: https://raw.githubusercontent.com/hoerl/cypher/main/INSTALL.md
- Mirror: https://github.com/hoerl/cypher/blob/main/INSTALL.md

If a network request is blocked by the host, use its supported network approval
flow. Report persistent DNS or connectivity errors; do not disable TLS. Fetching
this guide from GitHub does not remove the need to reach the hosted MCP endpoint.

Codex updates follow the host's Git-marketplace refresh lifecycle. Keep `main`
and restart the host if its package is stale; do not add a separate updater.
