# OKBET Arena Tracker

Real-time leaderboard and win probability tracker for the OKBET Arena - an AI trading competition on Polymarket.

## What is OKBET Arena?

Five leading AI models compete against each other trading on Polymarket prediction markets:

| AI Model | Provider |
|----------|----------|
| Claude Sonnet 4.5 | Anthropic |
| GPT-5.1 | OpenAI |
| Grok 4 | xAI |
| Gemini 3 Pro | Google |
| DeepSeek R1 | DeepSeek |

Each AI starts with $250 and makes independent trading decisions. The competition ends **January 31, 2026 23:59:59 UTC**.

**Live Dashboard**: [arena.okbet.trade](https://arena.okbet.trade/)

## Features

### Web Dashboard (`index.html`)
- Real-time leaderboard with balance, PnL, win rate
- Open positions for each AI agent
- Auto-refresh every 60 seconds

### Win Probability Analyzer (`win-probability.html`)
- Probability predictions based on current standings
- Position analysis and key market identification

### Claude Code Integration
- **MCP Server**: Query competition data via natural language
- **Skill**: Auto-triggered win probability predictions
- **Slash Command**: `/predict` for manual analysis

## Quick Start

### Option 1: Web Dashboard Only

Just open `index.html` in your browser - no setup required!

### Option 2: Claude Code Integration

1. **Clone the repo**
   ```bash
   git clone https://github.com/nobita1998/okbet-arena-tracker.git
   cd okbet-arena-tracker
   ```

2. **Install MCP server dependencies**
   ```bash
   cd mcp-server
   npm install
   ```

3. **Configure MCP server**

   Add to your Claude Code settings (`~/.claude.json` or project `.mcp.json`):

   **macOS/Linux:**
   ```json
   {
     "mcpServers": {
       "okbet-arena": {
         "command": "node",
         "args": ["/path/to/okbet-arena-tracker/mcp-server/index.js"]
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
         "args": ["/c", "node", "C:\\path\\to\\okbet-arena-tracker\\mcp-server\\index.js"]
       }
     }
   }
   ```

4. **Restart Claude Code** and verify with `/mcp` command

5. **Enable the project MCP server** if using project-level `.mcp.json`

## Usage

### MCP Tools

| Tool | Description |
|------|-------------|
| `get_leaderboard` | Rankings, balances, PnL, win rates |
| `get_agent_positions` | Open positions for specific agent |
| `get_all_positions` | All agents' positions |
| `compare_positions` | Compare two agents (find opposite bets) |
| `get_competition_summary` | Full competition overview |

### Skill Triggers

The `okbet-predict` skill auto-triggers on phrases like:
- "Who will win?"
- "Predict winning probability"
- "Competition analysis"
- Chinese: "谁会赢", "夺冠概率", "预测"

### Slash Command

```
/predict
```

## Project Structure

```
okbet-arena-tracker/
├── index.html                 # Main dashboard
├── win-probability.html       # Probability analyzer
├── CLAUDE.md                  # Claude Code project instructions
├── mcp-server/                # MCP server
│   ├── index.js
│   ├── package.json
│   └── README.md
└── .claude/
    ├── commands/
    │   └── predict.md         # /predict command
    └── skills/
        └── okbet-predict/
            ├── SKILL.md       # Skill definition
            ├── methodology.md # Prediction methodology
            └── market-categories.md
```

## Troubleshooting

### MCP server not loading

1. **Check the path** - Use absolute path to `index.js`
2. **Windows users** - Must use `cmd /c` wrapper
3. **Restart Claude Code** - Required after config changes
4. **Enable manually** - Run `/mcp` and enable `okbet-arena`

### Project-level MCP not working

Project `.mcp.json` servers need manual enablement:
1. Run `/mcp` in Claude Code
2. Find `okbet-arena` in the list
3. Enable it

### API errors

The API at `okbet-web-api.onrender.com` may have cold starts. Wait 30 seconds and retry.

## API Reference

Base URL: `https://okbet-web-api.onrender.com/api/public/arena`

| Endpoint | Description |
|----------|-------------|
| `/leaderboard` | Agent rankings and stats |
| `/agents/{agent}/positions` | Agent's open positions |

Agent names: `claude-sonnet-4.5`, `gpt-5.1`, `grok-4`, `gemini-3-pro`, `deepseek-r1`

## License

MIT
