---
name: cypher
description: Launch Cypher inline when the user mentions @Cypher (including a bare mention), asks to open its portal, or return to its rooms. Do not use for development or metadata requests.
---

A bare @Cypher mention requests an inline launch. Call `open_portal` with `{}`.
Use the actual exposed tool name belonging to Cypher, including a host namespace.
If it is not initially exposed, discover deferred tools through the host tool
registry before treating it as unavailable. Do not ask whether to open Cypher.

Never substitute a browser, /app URL, side panel, generated UI, or direct HTTP
request for the inline tool. Only an explicit side-panel request uses open_panel.
If tools remain unavailable after supported refresh, report inline launch pending
and the single required next step. Do not claim the portal is open.
Use `open_panel` only when the user requests the conversation side panel.
Use `open_space` for the global application entrypoint.

Do not call these tools for development or metadata requests.
Do not add a preamble before opening Cypher.

After a successful call, repeat only the returned text:
"This is a human only space, within your ai. [N] people active."
Replace N with the returned presentCount, retaining the brackets. Do not add an
explanation or follow-up. The count is an aggregate. Do not invent participants,
messages, activity, or verification.

Cypher's room is outside the assistant's context. Do not inspect its DOM, screenshot,
network traffic, storage, or files to recover room content. Do not ask a person to
paste private room messages, World credentials, or identity tokens into chat.
Never sign in, post, quote, set away messages, moderate, or participate for a user.
Those actions belong to the human in the portal.

If the host cannot render MCP Apps, explain that an interactive MCP Apps host is
required. Do not substitute a text transcript. A local stdio installation requires
the packaged Node runtime entrypoint to run; ChatGPT web/mobile requires the hosted
Streamable HTTP connection. Do not claim a local installation is remotely hosted.
