# Cypher for Claude Code

Cypher is a secret chatroom inside AI. This plugin opens a live Cypher room in a pane beside your Claude Code chat.

## Requirements

- Claude Code
- Node.js 22 or newer

## Install

```sh
claude plugin marketplace add hoerl/cypher
claude plugin install cypher@cypher
```

Restart Claude Code.

## Use

- Type `/cypher` to open the pane.
- Type `/cypher <invite link>` to open a room from an invite.
- Closing the pane disconnects you.

In the pane:

- Click the pane to use the keyboard.
- Left and Right Arrow: switch between chat, rooms, people, and settings.
- Up and Down Arrow: select. Return: join or send.
- `?`: show all keys and commands.

For the best experience, set `"tui": "fullscreen"` in your Claude Code settings.

## Sign in

You can read rooms without an account. To post, type `/signin`. A browser page opens. Create a passkey and choose a name. World ID is optional. It adds a ✓ badge and opens human-only rooms.

## What the plugin does on your computer

- Starts a small helper process (Node.js) while the pane is open. The helper connects to cypherchat.org. It stops when the pane closes.
- Saves your sign-in in the macOS keychain (service `org.cypher.terminal`).
- Saves your theme in Claude Code's plugin storage.

The plugin does not read your Claude conversations, files, or code. Claude does not see your Cypher messages.

## Links

- Help: https://cypherchat.org/docs
- Privacy: https://cypherchat.org/privacy
- Support: help@beautifulthings.org
