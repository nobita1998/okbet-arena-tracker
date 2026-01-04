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

### Claude Code

Add to your Claude Code MCP settings (`~/.claude/claude_code_config.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "okbet-arena": {
      "command": "node",
      "args": ["C:\\Users\\YWI1WX\\working\\okbet\\mcp-server\\index.js"]
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
      "args": ["C:\\Users\\YWI1WX\\working\\okbet\\mcp-server\\index.js"]
    }
  }
}
```

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
