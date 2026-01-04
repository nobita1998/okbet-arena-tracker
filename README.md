# OKBET Arena Predict Skill

A Claude Code skill for predicting win probabilities in the OKBET Arena - an AI trading competition on Polymarket.

## What is OKBET Arena?

Five AI models compete trading on Polymarket prediction markets:

| AI Model | Provider |
|----------|----------|
| Claude Sonnet 4.5 | Anthropic |
| GPT-5.1 | OpenAI |
| Grok 4 | xAI |
| Gemini 3 Pro | Google |
| DeepSeek R1 | DeepSeek |

Each AI starts with $250. Competition ends **January 31, 2026**.

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/nobita1998/okbet-arena-tracker.git
cd okbet-arena-tracker
```

### 2. Install MCP server

```bash
cd mcp-server
npm install
```

### 3. Configure MCP server

Add to `~/.claude.json`:

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

### 4. Copy skill to your project

```bash
cp -r .claude/skills/okbet-predict /your/project/.claude/skills/
```

Or copy the entire `.claude` folder to use both skill and slash command.

### 5. Restart Claude Code

## Usage

### Skill (Auto-triggered)

Just ask naturally:

- "Who will win the competition?"
- "Predict winning probabilities"
- "谁会赢？"
- "预测夺冠概率"

### Slash Command

```
/predict
```

### MCP Tools (Direct)

```
"Show me the leaderboard"
"Compare Claude and GPT positions"
"What are Grok's open positions?"
```

## Project Structure

```
.
├── .claude/
│   ├── commands/
│   │   └── predict.md              # /predict slash command
│   └── skills/
│       └── okbet-predict/
│           ├── SKILL.md            # Skill definition
│           ├── methodology.md      # Prediction methodology
│           └── market-categories.md # Market impact classification
├── mcp-server/
│   ├── index.js                    # MCP server
│   ├── package.json
│   └── README.md
├── CLAUDE.md                       # Project context for Claude
└── README.md
```

## How Predictions Work

The skill uses a methodology based on:

1. **Net Asset Gap** - Current balance difference (Balance includes unrealized PnL)
2. **Position Analysis** - Number of positions, total invested amount
3. **Opposite Bets** - Markets where AIs bet against each other
4. **Market Categories** - High-impact (politics, crypto) vs low-impact (sports)

See `.claude/skills/okbet-predict/methodology.md` for details.

## MCP Tools Available

| Tool | Description |
|------|-------------|
| `get_leaderboard` | Rankings, balances, PnL, win rates |
| `get_agent_positions` | Open positions for one agent |
| `get_all_positions` | All agents' positions |
| `compare_positions` | Find opposite bets between two agents |
| `get_competition_summary` | Full overview |

## Troubleshooting

### MCP server not loading

1. Use **absolute path** to `index.js`
2. Windows: must use `cmd /c` wrapper
3. **Restart Claude Code** after config change
4. Run `/mcp` to verify status

### Skill not triggering

1. Ensure `.claude/skills/okbet-predict/` exists in your project
2. Check `SKILL.md` is present and valid
3. Try the slash command `/predict` instead

## License

MIT
