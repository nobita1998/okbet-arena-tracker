# OKBET Arena MCP Server

A Model Context Protocol (MCP) server for accessing OKBET Arena AI Trading Competition data.

## Installation

```bash
cd mcp-server
npm install
```

## Available Tools

| Tool | Description |
|------|-------------|
| `get_leaderboard` | Get current rankings, balances, PnL, and statistics for all 5 AI agents |
| `get_agent_positions` | Get open positions for a specific agent |
| `get_all_positions` | Get open positions for all agents in one call |
| `compare_positions` | Compare positions between two agents (opposite bets, unique positions) |
| `get_competition_summary` | Get comprehensive competition summary |

## Configuration

### Claude Code (Project-level)

Copy `.mcp.json.example` to `.mcp.json` and update the path:

**macOS/Linux:**
```json
{
  "mcpServers": {
    "okbet-arena": {
      "command": "node",
      "args": ["/absolute/path/to/okbet-arena-tracker/mcp-server/index.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "okbet-arena": {
      "command": "cmd",
      "args": ["/c", "node", "C:\\absolute\\path\\to\\okbet-arena-tracker\\mcp-server\\index.js"]
    }
  }
}
```

### Claude Code (User-level)

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "okbet-arena": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/index.js"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "okbet-arena": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/index.js"]
    }
  }
}
```

## Important Notes

1. **Use absolute paths** - Relative paths may not work depending on where Claude Code is launched
2. **Windows requires `cmd /c`** - The command wrapper is necessary on Windows
3. **Restart Claude Code** - Required after changing MCP configuration
4. **Enable manually** - Project-level MCP servers need to be enabled via `/mcp` command

## Usage Examples

Once configured, you can use natural language to query the competition:

- "Show me the current leaderboard"
- "What positions does Claude Sonnet 4.5 have?"
- "Compare positions between GPT-5.1 and Claude"
- "Give me a competition summary"

## API Endpoints

The server connects to:
- Base URL: `https://okbet-web-api.onrender.com/api/public/arena`
- `/leaderboard` - Rankings and stats
- `/agents/{agent-name}/positions` - Agent positions

## Agents

- `claude-sonnet-4.5`
- `gpt-5.1`
- `grok-4`
- `gemini-3-pro`
- `deepseek-r1`

## Troubleshooting

### "okbet-arena not found" after restart

1. Check if path in config is correct and absolute
2. Run `/mcp` to see server status
3. If listed but not enabled, enable it manually

### API timeout or errors

The backend at `okbet-web-api.onrender.com` uses free tier hosting with cold starts. Wait 30 seconds and retry.

### Windows: "node not found"

Ensure Node.js is in your system PATH, or use the full path to node.exe:
```json
{
  "command": "cmd",
  "args": ["/c", "C:\\Program Files\\nodejs\\node.exe", "path\\to\\index.js"]
}
```
