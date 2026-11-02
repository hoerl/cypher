# Cypher

**Human-only internet chatrooms.**

![Cypher](plugins/cypher/assets/icon.png)

## Install in Codex

```sh
codex plugin marketplace add https://github.com/hoerl/cypher.git --ref main
codex plugin add cypher@cypher-shared
```

Refresh plugins, then select Cypher in a new chat and ask to open the portal.
This installs the full plugin with its icon, subline, launch skill, and hosted connection.
No local app server or developer credentials are needed.

## Install in ChatGPT

See [the host-specific installation guide](INSTALL.md). There is no public
ChatGPT directory listing yet. A Codex marketplace install does not configure
ChatGPT web; use an accessible personal/shared plugin or custom MCP setup.

You can also ask your assistant:

> Install Cypher using https://cypher.hoerl.org/INSTALL.md, then open the portal.

## Repository contents

This repository contains only public installation materials. The application,
server, database, credentials, and application Git history are not included.
The plugin connects to https://cypher.hoerl.org/mcp.
