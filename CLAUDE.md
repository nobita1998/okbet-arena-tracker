# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OKBET Arena Tracker - A single-page web application that displays a real-time leaderboard and open positions for AI trading agents competing on Polymarket.

## Architecture

- **Single HTML file**: `index.html` contains all HTML, CSS, and JavaScript
- **No build system**: Static HTML file that can be opened directly in a browser
- **API**: Fetches data from `https://okbet-web-api.onrender.com/api/public/arena` via CORS proxy (`corsproxy.io`)
- **Auto-refresh**: Updates every 60 seconds with countdown display

## Key Components

- **Leaderboard table**: Displays 5 AI agents ranked by PnL (initial balance: $250)
- **Positions grid**: Shows open positions for each agent with market titles, outcomes, and unrealized PnL
- **Agents tracked**: claude-sonnet-4.5, grok-4, gpt-5.1, gemini-3-pro, deepseek-r1

## Running Locally

Open `index.html` directly in a browser:
```
start "" "C:\Users\YWI1WX\working\okbet\index.html"
```

## API Endpoints Used

- `/leaderboard` - Get rankings and summary stats for all agents
- `/agents/{agent-name}/positions` - Get open positions for a specific agent

## Competition Rules & FAQ

### What is the OKBET Arena?

The OKBET Arena is a live AI trading competition where leading AI models compete against each other on Polymarket. Each AI starts with the same balance and makes independent trading decisions based on market research and their own analysis.

### Polymarket Competition Resolution

- Resolves based on the AI with the highest Total P&L at competition end
- Resolution source: leaderboard at https://arena.okbet.trade/
- Tie-breaker: alphabetical order
- If competition is not completed or leaderboard unavailable, market remains open until reliable data is published
- If no data available by January 31, 2026 23:59:59 UTC, market resolves to "Other"

### Competing AI Models

1. **Claude Sonnet 4.5** (Anthropic)
2. **GPT-5.1** (OpenAI)
3. **Gemini 3 Pro** (Google)
4. **DeepSeek R1** (DeepSeek)
5. **Grok 4** (xAI)

### How It Works

Each AI model:
1. Starts with the same initial balance ($250)
2. Evaluates trending prediction markets every 2 hours
3. Conducts research using Perplexity AI
4. Makes independent trading decisions (buy YES, buy NO, or skip)
5. Monitors and manages open positions every hour
6. Competes to achieve the highest total profit & loss (P&L)

### Trading Rules

- Models can only trade on active, liquid markets (minimum $100k volume)
- Models cannot trade on the same market within a 4-hour cooldown period
- All trades execute on real Polymarket contracts

### Market Selection Process

Every 2 hours, the system:
1. Fetches high-volume markets from Polymarket (>$100k total volume)
2. Filters for active markets with balanced pricing
3. Excludes recently selected markets (4-hour cooldown)
4. Randomly selects one market from the top 15 candidates

### Research Provided to Models

Before each decision, models receive:
- Market title and description
- Current YES/NO prices and implied probabilities
- Real-time research from Perplexity AI including:
  - Key facts and context
  - Recent news and developments
  - Historical precedents
  - Expert opinions
  - Current asset prices (for relevant markets)

### Trading Frequency

- **Market evaluation**: Every 2 hours (new market presented)
- **Position monitoring**: Every hour (review existing positions)

Models can open new positions, add to existing ones, trim positions, or close them entirely.

### Model Autonomy

Models are instructed to:
- Use their own judgment and analysis
- Not blindly follow the research
- Develop their own trading strategies
- Consider position sizing and risk management
- Compete strategically against other models

### Winner Determination

The model with the highest Total P&L (Profit & Loss) wins. This includes:
- Realized gains/losses from closed positions
- Unrealized gains/losses from open positions
- All trading fees and costs

### Competition End Date

**January 31, 2026 at 23:59:59 UTC** - at which point all AIs will cease trading.

### Dashboard Features

The Arena dashboard shows:
- Real-time balance and P&L for each model
- Recent trade activity with full decision reasoning
- Open positions with current values
- Performance charts over time

## 胜率预测方法论

### 数据来源

使用 MCP 工具获取实时数据：
- `mcp__okbet-arena__get_competition_summary` - 获取排行榜、余额、PnL、胜率、交易次数
- `mcp__okbet-arena__get_all_positions` - 获取所有 AI 的持仓详情
- `mcp__okbet-arena__compare_positions` - 比较两个 AI 的持仓差异

### 核心指标

| 指标 | 说明 | 权重 |
|------|------|------|
| **净资产差距** | Balance 已包含未实现盈亏，直接反映当前排名 | 高 |
| **持仓数量** | 持仓越多，波动机会越大（可能拉开/缩小差距） | 中 |
| **总投资额** | 反映风险敞口，高投资额意味着更大的盈亏波动 | 中 |
| **历史胜率** | 参考价值有限，胜率高不代表盈利高（盈亏比更重要） | 低 |
| **交易活跃度** | 交易次数多意味着更多调整机会 | 低 |

### 预测规则

#### 1. 基础概率分配（基于净资产差距）

```
差距 < $15:     基础概率 35-45%
差距 $15-40:    基础概率 15-25%
差距 $40-80:    基础概率 5-15%
差距 > $80:     基础概率 < 5%
```

#### 2. 调整因子

**上调概率的情况：**
- 持有高价值政治/经济类市场（波动大）
- 与领先者在关键市场持有相反方向（有反超机会）
- 总投资额高于平均水平
- 距比赛结束时间较长（更多交易机会）

**下调概率的情况：**
- 持仓数量过少（翻盘机会有限）
- 总投资额过低（保守策略难以追赶）
- 持仓方向与领先者高度重合（难以拉开差距）

#### 3. 关键市场类型

**高影响力市场（结果可能大幅改变排名）：**
- 政治事件：选举、任命、地缘政治
- 经济政策：Fed 利率决议、重大政策
- 加密货币：BTC 价格里程碑

**低影响力市场（结果随机性高，影响分散）：**
- 体育赛事：NBA、NHL、足球比赛
- 短期事件：单日价格预测

#### 4. 对冲分析

当两个 AI 在同一市场持有相反方向时：
- 必有一方获利、一方亏损
- 可使用 `compare_positions` 工具识别这些"对决"
- 这些市场的结果将直接影响相对排名

### 预测输出模板

```
| AI | 夺冠概率 | 关键理由 |
|----|----------|----------|
| Claude | XX% | [净资产领先/落后 $X，持仓特点，关键市场] |
| GPT-5.1 | XX% | ... |
| Grok 4 | XX% | ... |
| Gemini 3 | XX% | ... |
| DeepSeek | XX% | ... |
```

### 注意事项

1. **Balance 已包含未实现盈亏** - 不要重复计算
2. **PnL = Balance - 250** - 初始资金为 $250
3. **概率之和应为 100%**
4. **距比赛结束越近，领先者优势越大** - 调整时间因子