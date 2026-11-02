# Install Cypher

Human-only internet chatrooms.

## Choose the current host

Reading this page does not install anything. ChatGPT and Codex have different
connection flows. A local Codex configuration does not configure ChatGPT web.

For an assistant handling an explicit install request:

1. Check whether Cypher is already connected and open_portal is available. If it
   is, call it with no arguments; do not add a duplicate connection.
2. In Codex, follow the Git marketplace installation below. No public directory
   listing is required. Do not fall back to a bare MCP connection.
3. In ChatGPT, reuse an accessible personal/shared plugin or follow the custom
   MCP steps below. There is no public Cypher directory listing yet.
4. Confirm installation and tool discovery. Call open_portal through the host's
   connected tool, not a standalone HTTP request. A successful HTTP probe cannot
   open an interactive portal in the user's chat.
5. If tools cannot refresh in this chat, ask the user to start a new chat after
   refreshing the host. Say explicitly that opening the portal is still pending.

Do not create another plugin through Plugin Creator just to bypass missing
listing access. Do not execute a downloaded shell installer or simulate a portal.
Never request World ID credentials. If a host offers no supported install flow,
explain that limit instead of claiming installation succeeded.

## Connection details

- Name: Cypher
- Subline: Human-only internet chatrooms.
- Remote MCP URL: https://cypher.hoerl.org/mcp
- Transport: Streamable HTTP
- Authentication: No authentication
- Launch tool: open_portal, with an empty argument object

World ID sign-in happens inside the portal. It is not MCP OAuth. Do not configure
a bearer token, OAuth client, or local Node server for this hosted endpoint.

## ChatGPT

Prefer the current Cypher plugin listing when it is accessible. Install it,
open a new chat, type @, select Cypher from the picker, and send "open the portal".
Typing a plain-text name without selecting the plugin does not select it.

If no listing is accessible and the account supports custom MCP connections:

1. In ChatGPT Plugins, choose the plus button, then Add custom MCP server.
2. Enter Cypher and https://cypher.hoerl.org/mcp. Choose No authentication.
3. Review the host's notice and choose Create as a plugin.
4. Install/connect the resulting plugin, then select it in a new chat as above.

Availability and menu labels depend on the account and workspace policy. If these
controls are absent, do not claim the assistant can enable them. A local command
or ZIP on another computer cannot install a plugin in ChatGPT web.

A custom URL connection does not import Cypher's packaged icon, subtitle, or
skill. For the branded installation, use the current packaged release supplied
by the publisher. If only the custom connection is available, report that branding
is unverified rather than promising the icon will appear automatically.

## Codex desktop

Install the full plugin from the public installer repository. It contains only
installation materials; the application code and its Git history remain private.
No checkout, build, local server, or developer credentials are needed.

1. Inspect existing connections and codex plugin marketplace list --json.
   Reuse cypher-shared when its source is Git and its URL is the one below.
2. For a new installation, run:

    codex plugin marketplace add https://github.com/hoerl/cypher.git --ref main
    codex plugin add cypher@cypher-shared

3. Verify codex plugin list --json reports cypher@cypher-shared installed and
   enabled. Verify the marketplace source is Git, tracking main. The package
   includes the current icon, exact subline, launch skill, and hosted MCP server.
4. Refresh plugins using the host's supported controls. If tools remain stale,
   restart the desktop host and open a new chat. Call open_portal with no arguments
   through the connected tool and confirm the portal renders inline.

If cypher-shared is registered as a local folder, remove only that marketplace
registration and re-add the Git URL above, then install the same plugin identity.
Do not delete the old checkout or remove unrelated plugins or marketplaces.

If a previous attempt added a standalone MCP server named cypher, inspect it with
codex mcp get cypher. After the full plugin is successfully installed, remove that
standalone entry with codex mcp remove cypher only if its URL is exactly
https://cypher.hoerl.org/mcp. This avoids duplicate tools. Preserve other entries.

Do not substitute codex mcp add for this installation: it omits the icon, subline,
and skill. If Git or codex plugin support is unavailable, report the actual
limitation and have the user update/use a supported Codex host.

Keep the marketplace on main for updates. Updates follow the host's Git marketplace
refresh lifecycle; restart the host if its installed package is stale. A terminal
CLI can verify installation and tools but cannot prove the visual portal opened.

## Verify the installation

For a full plugin, check the host's plugin details/picker: the current Cypher mark
and the exact subline "Human-only internet chatrooms." should appear. If they do
not, check the installed release; do not call it a verified branded install.

Confirm open_portal is available and its call renders the interactive app in the
current host. Tool discovery, saved configuration, and a successful network probe
are separate from UI rendering. Report each stage accurately. A host without MCP
Apps rendering cannot display the full portal.

If discovery fails, check the /mcp suffix, no-auth setting, and account access.
Refresh the connection/tool list and retry in a new chat. Do not disable TLS or
add credentials to work around a connection failure.

## Official host guidance

- ChatGPT custom MCP setup: https://developers.openai.com/plugins/build/app-quickstart
- MCP configuration and host differences: https://learn.chatgpt.com/docs/extend/mcp
