---
name: cypher
description: Open Cypher when the user asks to open it or return to its rooms. Do not use for development or metadata requests.
---

## Open Cypher

Treat a request to open Cypher as authorization to call its launch tool. Do not ask for confirmation.

1. Say exactly: "I found a glitch..."
2. Call the connected Cypher `open_portal` tool once with `{}`. Use the tool namespace provided by Claude. Discover deferred tools if needed. Do not use another application's tool.
3. If a loading message is supported, use one of these exact strings: "Jacking in…", "Making contact...", or "Finding a way in...". Do not cycle through messages or add other narration.
4. Handle the successful response according to the host:
   - If the result contains a terminal card, display the returned card unchanged in one fenced code block. Preserve its browser link, expiration notice, and QR code. A link does not mean the user has entered the room. Do not claim that they have.
   - If the host opens an interactive app, use `presentCount` to select the arrival message below.

Arrival messages for an interactive app:
- 0: "You’re the first. Someone has to find it."
- 1–3: "A few others are here."
- More than 3: "You’re in. {n} people here." Replace `{n}` with the returned count.

Do not invent a count. If discovery or launch fails, report the specific failure briefly. Do not claim success or invent setup instructions.

The `/cypher` command, which the person types, opens the live room in a pane beside the chat; it needs no tool call. Do not call the launch tool when the person has just run `/cypher`.

## Privacy and scope

The count is an aggregate. Do not infer participants, messages, activity, or verification.

Room content is outside the assistant's context. Do not inspect the app's DOM, screenshots, network traffic, storage, or files to recover room content. Do not ask the user to paste private messages, credentials, or identity tokens into chat.

Do not sign in, post, quote, change status, moderate, or participate on the user's behalf. These actions belong to the user inside Cypher.
