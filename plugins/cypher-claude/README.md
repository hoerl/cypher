# Cypher for Claude Code

Cypher is a secret chatroom inside AI. This plugin opens a live Cypher room in a pane beside your Claude Code chat in the terminal.

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
- In the terminal, the pane opens by itself when you send Claude a prompt. Your typing still goes to Claude. In the desktop app you get a toast instead, when Claude works for more than 15 seconds.
- To stop that, clear the `auto` check in the pane's settings, or type `/cypher auto off`. `/cypher auto on` brings it back.
- If you close the pane, it opens again with your next prompt.
- The desktop app has no pane. There the plugin only shows a toast when Claude works for more than 15 seconds. Open Cypher there with the Cypher connector.

## Your skin in Claude

In the Claude desktop and mobile apps, Claude Code can wear the skin you use in Cypher.

- Sign in, open Cypher's settings, and turn on **Match in Claude Code**. It is saved on your account, so you do it once.
- The desktop app takes your skin's colors. Behind the conversation is one dot for each person online in Cypher, up to 24. It shows no names and no messages.
- The dots flash when someone pokes or @mentions you, and stay bright until you open Cypher and see it.
- Pick another skin in Cypher and Claude follows within about 15 seconds.
- `/cypher skin off` turns it off on this computer. `/cypher skin on` brings it back. `/cypher skin` says where it stands.
- It replaces any other plugin's colors or backdrop while it is on.
- The mobile app shows the dots without the colors. The terminal shows neither. A skin you imported yourself is not followed: Claude keeps its own colors and shows the dots.

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
- In the desktop and mobile apps, starts a second helper for your skin in Claude. Every 15 seconds it asks cypherchat.org for four things: your skin, whether Match in Claude Code is on, how many people are online, and when you were last poked or mentioned without having seen it. It does not join a room. Signing in to ask keeps your saved terminal sign-in from expiring while the app is open. It asks nothing when you are signed out, or after `/cypher skin off`.
- Saves your sign-in in the macOS keychain (service `org.cypher.terminal`).
- Saves your theme, and the last skin your account asked Claude to wear, in Claude Code's plugin storage.

The plugin does not read your Claude conversations, files, or code. Claude does not see your Cypher messages.

## Links

- Help: https://cypherchat.org/docs
- Privacy: https://cypherchat.org/privacy
- Support: help@beautifulthings.org
